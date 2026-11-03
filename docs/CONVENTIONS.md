# 폼 / 서버 액션 컨벤션

## 1. useActionState vs 직접 await 호출

기준은 "단일 `<form>` 제출이냐 아니냐"입니다.

| 상황 | 패턴 |
| --- | --- |
| `<form>` 제출 한 번 = 액션 한 번 (로그인, 회원가입, 위저드 최종 제출 등) | `useActionState` |
| 클릭/blur 등 이벤트 핸들러, 마운트 시 자동 호출, 한 핸들러에서 액션을 여러 번/조건부로 호출 | `useTransition` + 직접 `await` 호출 |

**useActionState 예시 (SignUpForm.tsx, LoginForm.tsx, CreateWorkspaceModal.tsx):**

```tsx
const [error, action, isPending] = useActionState(signup, undefined);

// react-hook-form의 onSubmit에서 startTransition으로 감싸서 호출
startTransition(() => action(formData));
```

**직접 호출 예시 (SidebarItem.tsx, Header.tsx — 이름 변경/삭제처럼 form이 아닌 이벤트):**

```tsx
const [isPending, startTransition] = useTransition();

const handleRename = () => {
  startTransition(async () => {
    await updateConversation(id, editInputValue);
  });
};
```

억지로 `useActionState`에 끼워 맞추지 않습니다. 액션을 여러 개 조합하거나(`Chat.tsx`의 스트리밍 중 `addMessage` 다회 호출), 조건부로 다른 액션을 부를 때는 직접 `await`가 더 읽기 쉽습니다.

### 서버 액션 시그니처

```ts
"use server";
export const signup = async (_prevState: PrevState, formData: FormData) => {
  const parsed = SignUpSchema.safeParse({ ... });
  if (!parsed.success) return { errorMessage: "..." };
  // ...
  return { errorMessage: "..." }; // 실패 시에만 값 반환, 성공 시 redirect
};
```

- 검증 실패/비즈니스 로직 실패는 `throw` 대신 `{ errorMessage }`를 반환합니다 (`useActionState`가 그대로 받아 처리).
- 성공 후 이동이 필요하면 `redirect()`를 호출합니다 (반환값 없음).
- 필드 단위 서버 에러(예: "이미 가입된 이메일")를 특정 input 아래에 표시하고 싶다면, 단순 toast 대신 `useForm`의 `setError("email", { message })`로 매핑하는 것을 우선 고려합니다.

## 2. react-hook-form 사용 순서

컴포넌트 안에서 아래 순서를 기본값으로 합니다.

```tsx
"use client";

// 1. zod 스키마에서 타입 추론
type TForm = z.infer<typeof SignUpSchema>;

const SignUpForm = () => {
  // 2. 서버 액션 상태 (form 제출형이면 useActionState)
  const [error, action, isPending] = useActionState(signup, undefined);
  const [, startTransition] = useTransition();

  // 3. useForm 선언 — resolver, defaultValues, mode 순서로
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TForm>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { name: "", email: "", password: "" }, // uncontrolled → controlled 경고 방지, 항상 명시
    mode: "onChange", // 실시간 검증. 제출 시에만 검증하려면 onSubmit
  });

  // 4. RHF → FormData 변환 후 서버 액션 호출
  const onSubmit = (data: TForm) => {
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v));
    startTransition(() => action(formData));
  };

  // 5. 서버 에러를 UI로 반영 (toast 또는 setError)
  useEffect(() => {
    if (error?.errorMessage) toast.error(error.errorMessage);
  }, [error]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input error={!!errors.email} {...register("email")} />
      {errors.email && <FormMessage message={errors.email.message!} />}
      <Submit disabled={isPending}>제출</Submit>
    </form>
  );
};
```

포인트:
- **스키마가 단일 진실 소스**: `/schemas`의 zod 스키마를 클라이언트(`zodResolver`)와 서버(`safeParse`) 양쪽에서 그대로 재사용합니다. 검증 로직을 두 곳에 따로 작성하지 않습니다.
- **`register` 우선, `Controller`는 필요할 때만**: 네이티브 `<input>`은 `register`로 충분합니다. `Select`, `DatePicker`처럼 값이 이벤트 객체가 아닌 커스텀 컴포넌트에만 `Controller`(또는 `useController`)를 씁니다.
- **`formState`는 구조분해로 필요한 것만 구독**: `formState.errors`, `isSubmitting`처럼 쓰는 필드만 꺼내 씁니다. `formState` 객체 전체를 그대로 쓰면 불필요한 리렌더가 생깁니다.
- **로딩 상태는 하나로 통일**: `useActionState`의 `isPending`(또는 RHF의 `isSubmitting`)을 그대로 버튼 `disabled`에 씁니다. 별도 `useState`로 중복 로딩 플래그를 만들지 않습니다.
- **제출 버튼은 `type="submit"`, 나머지 버튼은 `type="button"`을 명시**: `<form>` 안에 여러 버튼이 있을 때 의도치 않은 제출을 막습니다.

## 3. 서버 상태(읽기/캐싱) — react-query 도입 기준

현재는 react-query/SWR 없이 서버 컴포넌트 fetch + 서버 액션으로 충분히 커버되고 있습니다. 아래 상황이 생기면 그때 도입을 검토합니다.

- 같은 서버 데이터를 여러 클라이언트 컴포넌트가 공유하며 캐시 무효화가 필요할 때 (예: 워크스페이스 목록을 사이드바와 헤더가 동시에 구독)
- 폴링, 무한 스크롤, 백그라운드 리페치가 필요할 때
- optimistic update를 여러 지점에서 일관되게 관리해야 할 때

그 전까지 mutation은 지금처럼 서버 액션(+`useActionState`/`useTransition`)으로 처리합니다.

## 4. Optimistic UI (참고)

React 19 기반 프로젝트이므로, `SidebarItem.tsx`의 이름 변경/삭제처럼 "낙관적으로 먼저 반영하고 실패 시 롤백"이 자연스러운 지점에는 `useOptimistic`을 우선 검토합니다. 별도 로컬 state로 낙관적 업데이트를 직접 구현하지 않습니다.

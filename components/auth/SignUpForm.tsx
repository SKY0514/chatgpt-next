"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import FormCard from "./FormCard";
import Submit from "./Submit";
import { SignUpSchema } from "@/schemas/auth";
import FormMessage from "./FormMessage";
import { useActionState, useEffect, useState, useTransition } from "react";
import { signup } from "@/actions/signup";
import toast from "react-hot-toast";

type TSignUpForm = z.infer<typeof SignUpSchema>;

const SignUpForm = () => {
  const [error, action, isPending] = useActionState(signup, undefined);
  const [, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TSignUpForm>({
    resolver: zodResolver(SignUpSchema),
    mode: "onChange",
  });

  const onSubmit = (data: TSignUpForm) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);

    startTransition(() => {
      action(formData);
    });
  };

  // effect

  useEffect(() => {
    if (error?.errorMessage) {
      toast.error(error.errorMessage);
    }
  }, [error]);

  return (
    <FormCard
      title="Threadly"
      subtitle="팀 워크스페이스에 참여하고 시작하세요"
      footer={{
        label: "이미 계정이 있으신가요?",
        linkLabel: "로그인",
        href: "/login",
      }}
    >
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        {/* 이름 */}

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-[13px] text-foreground">
            이름 (성명)
          </Label>
          <div className="relative">
            <img
              src="/icon-user.svg"
              alt="name icon"
              className="pointer-events-none absolute top-1/2 left-3.5 size-3 -translate-y-1/2"
            />
            <Input
              id="name"
              placeholder="홍길동"
              className="h-11 rounded-xl border-none bg-[#F2F3FF] pl-10"
              error={!!errors.name}
              {...register("name")}
            />
          </div>
          {errors.name && <FormMessage message={errors.name.message!} />}
        </div>

        {/* 이메일 */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[13px] text-foreground">
            이메일
          </Label>
          <div className="relative">
            <img
              src="/icon-email.svg"
              alt="email icon"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            />
            <Input
              id="email"
              autoComplete="email"
              placeholder="name@company.com"
              className="h-11 rounded-xl border-none bg-[#F2F3FF] pl-10"
              error={!!errors.email}
              {...register("email")}
            />
          </div>
          {errors.email && <FormMessage message={errors.email.message!} />}
        </div>
        {/* 비밀번호 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[13px] text-foreground">
              비밀번호
            </Label>
            <span className="text-xs text-muted-foreground/80">
              8자 이상, 영문/숫자 조합
            </span>
          </div>
          <div className="relative">
            <img
              src="/icon-lock.svg"
              alt="password icon"
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-auto -translate-y-1/2"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="********"
              className="h-11 rounded-xl border-none bg-[#F2F3FF] pr-11 pl-10"
              error={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-3 -translate-y-1/2 opacity-70 hover:opacity-100"
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              aria-pressed={showPassword}
            >
              <img
                src={showPassword ? "/icon-eye.svg" : "/icon-eye-off.svg"}
                alt={
                  showPassword
                    ? "비밀번호 보이기 아이콘"
                    : "비밀번호 감추기 아이콘"
                }
                className="h-3 w-auto"
              />
            </button>
          </div>
          {errors.password && (
            <FormMessage message={errors.password.message!} />
          )}
        </div>
        <Submit
          className="h-11 w-full gap-2 rounded-xl text-base"
          disabled={isPending}
        >
          가입하기
          <img
            src="/icon-arrow-right.svg"
            alt="가입하기 아이콘"
            className="size-3"
          />
        </Submit>
      </form>
    </FormCard>
  );
};

export default SignUpForm;

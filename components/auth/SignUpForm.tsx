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
import { useActionState, useEffect, useTransition } from "react";
import { signup } from "@/actions/signup";
import toast from "react-hot-toast";

type TSignUpForm = z.infer<typeof SignUpSchema>;

const SignUpForm = () => {
  const [error, action, isPending] = useActionState(signup, undefined);
  const [, startTransition] = useTransition();
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
      title="회원가입"
      footer={{ label: "이미 계정이 있으신가요?", href: "/login" }}
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* 이름 */}
        <div className="space-y-1">
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            placeholder="이름을 입력해주세요."
            error={!!errors.name}
            {...register("name")}
          />
          {errors.name && <FormMessage message={errors.name.message!} />}
        </div>
        {/* 이메일 */}
        <div className="space-y-1">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            autoComplete="email"
            placeholder="example@example.com"
            error={!!errors.email}
            {...register("email")}
          />
          {errors.email && <FormMessage message={errors.email.message!} />}
        </div>
        {/* 비밀번호 */}
        <div className="space-y-1">
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="*********"
            error={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <FormMessage message={errors.password.message!} />
          )}
        </div>
        <Submit className="w-full" disabled={isPending}>
          가입하기
        </Submit>
      </form>
    </FormCard>
  );
};

export default SignUpForm;

"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import FormCard from "./FormCard";
import Submit from "./Submit";
import { LoginSchema } from "@/schemas/auth";
import FormMessage from "./FormMessage";
import { useActionState, useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { login } from "@/actions/login";

type TLoginForm = z.infer<typeof LoginSchema>;

const LoginForm = ({ from }: { from?: string }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [error, action, isPending] = useActionState(login, undefined);
  const [, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginForm>({
    resolver: zodResolver(LoginSchema),
    mode: "onChange",
  });

  // effect

  useEffect(() => {
    if (error?.errorMessage) {
      console.log("error?.errorMessage", error?.errorMessage);

      toast.error(error.errorMessage);
    }
  }, [error]);

  // handlers.

  const onSubmit = (data: TLoginForm) => {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("rememberMe", String(rememberMe));
    if (from) formData.append("from", from);

    startTransition(() => {
      action(formData);
    });
  };

  return (
    <FormCard
      title="Threadly"
      subtitle="팀 워크스페이스에 다시 오신 것을 환영합니다"
      footer={{
        label: "계정이 없으신가요?",
        linkLabel: "회원가입",
        href: "/signup",
      }}
    >
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
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
              autoComplete="username"
              placeholder="name@company.com"
              error={!!errors.email}
              className="h-11 rounded-xl border-none bg-[#F2F3FF] pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && <FormMessage message={errors.email.message!} />}
        </div>
        {/* 비밀번호 */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px] text-foreground">
            비밀번호
          </Label>
          <div className="relative">
            <img
              src="/icon-lock.svg"
              alt="password icon"
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-auto -translate-y-1/2"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="********"
              error={!!errors.password}
              className="h-11 rounded-xl border-none bg-[#F2F3FF] pr-11 pl-10"
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
        {/* 로그인 상태 유지 */}
        <label className="flex items-center gap-2 pt-1">
          <Checkbox
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked)}
          />
          <span className="text-[13px] text-muted-foreground">
            30일간 로그인 상태 유지
          </span>
        </label>
        <Submit
          className="h-11 w-full gap-2 rounded-xl text-base"
          disabled={isPending}
        >
          워크스페이스 로그인
          <img
            src="/icon-arrow-right.svg"
            alt="로그인하기 아이콘"
            className="size-3"
          />
        </Submit>
      </form>
    </FormCard>
  );
};

export default LoginForm;

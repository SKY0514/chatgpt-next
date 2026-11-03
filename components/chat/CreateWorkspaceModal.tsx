"use client";

import { startTransition, useActionState, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Link2,
  Mail,
  Pencil,
  Plus,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "cn";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useCreateWorkspaceModalStore } from "@/stores/createWorkspaceModal";
import { createWorkspace } from "@/actions/workspaces";
import { TRole } from "@/types/role";
import { ROLE_OPTIONS } from "@/constants/role";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import {
  CreateWorkspaceSchema,
  TCreateWorkspaceForm,
} from "@/schemas/workspace";
import FormMessage from "../auth/FormMessage";

const INVITE_LINK = "https://threadly.ai/invite/coming-soon";

const CreateWorkspaceModal = () => {
  const open = useCreateWorkspaceModalStore((state) => state.open);
  const setOpen = useCreateWorkspaceModalStore((state) => state.setOpen);

  const [step, setStep] = useState<1 | 2>(1);
  const [isEditingName, setIsEditingName] = useState(true);

  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<TRole>("member");

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<TCreateWorkspaceForm>({
    resolver: zodResolver(CreateWorkspaceSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      invites: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "invites",
  });

  const watchName = watch("name");

  const resetState = () => {
    setStep(1);
    reset();
    setIsEditingName(true);
    setEmailInput("");
    setRoleInput("member");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetState();
  };

  const handleGoToStep2 = async () => {
    const isValid = await trigger("name");
    if (!isValid) return;

    setIsEditingName(false);
    setStep(2);
  };

  const handleClickPrev = () => {
    setIsEditingName(true);
    setStep(1);
  };

  const handleAddInvite = () => {
    const email = emailInput.trim();
    if (!email || !email.includes("@")) return;

    if (fields.some((invite) => invite.email === email)) {
      setEmailInput("");
      return;
    }
    append({ email, role: roleInput });

    setEmailInput("");
  };

  const handleRemoveInvite = (index: number) => {
    remove(index);
  };

  const handleChangeInviteRole = (index: number, role: TRole) => {
    update(index, { email: fields[index].email, role });
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(INVITE_LINK);
    toast.success("링크가 복사되었습니다");
  };

  const [, submitCreateWorkspace, isCreating] = useActionState(
    async (
      _prev: null,
      payload: TCreateWorkspaceForm & { skipInvites: boolean },
    ) => {
      try {
        const { pendingSignupEmails } = await createWorkspace(
          payload.name,
          payload.skipInvites ? [] : payload.invites,
        );

        if (!payload.skipInvites && (pendingSignupEmails ?? []).length > 0) {
          toast.success(
            `워크스페이스가 생성되었습니다. 아직 가입 전인 팀원은 가입과 동시에 자동으로 합류됩니다: ${pendingSignupEmails!.join(", ")}`,
          );
        } else {
          toast.success("워크스페이스가 생성되었습니다");
        }

        startTransition(() => handleOpenChange(false));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "워크스페이스 생성에 실패했습니다",
        );
      }

      return null;
    },
    null,
  );

  const onSubmit = handleSubmit((data, event) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)
      ?.submitter as HTMLButtonElement | null;
    const skipInvites = submitter?.value === "skip";

    startTransition(() => submitCreateWorkspace({ ...data, skipInvites }));
  });

  const roleLabel = (value: string) =>
    ROLE_OPTIONS.find((role) => role.value === value)?.label ?? value;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[80%] gap-6 rounded-2xl border border-[#e2e8f0]/80 p-[33px] sm:max-w-[672px]">
        <DialogTitle className="sr-only">워크스페이스 만들기</DialogTitle>

        <form onSubmit={onSubmit} className="contents">
          {/* 상단 스텝 인디케이터 */}
          <div className="w-full rounded-xl bg-[#f8fafc] px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Step 1 */}
              <div className="flex items-center gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#6366f1] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                  {step === 2 ? (
                    <Check className="size-3.5 text-white" />
                  ) : (
                    <span className="text-[13px] font-semibold text-white">
                      1
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[11px] tracking-[0.55px] text-[#64748b] uppercase">
                    STEP 1
                  </p>
                  <p className="text-[13px] text-[#0f172a]">
                    워크스페이스 정보
                  </p>
                </div>
              </div>

              {/* 연결선 */}
              <div className="mx-4 h-0.5 flex-1 overflow-hidden rounded-full bg-[#cbd5e1]">
                <div
                  className={cn(
                    "h-full bg-[#6366f1] transition-all",
                    step === 2 ? "w-full" : "w-0",
                  )}
                />
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]",
                    step === 2 ? "bg-[#6366f1]" : "bg-[#cbd5e1]",
                  )}
                >
                  <span className="text-[13px] font-semibold text-white">
                    2
                  </span>
                </div>
                <div>
                  <p
                    className={cn(
                      "text-[11px] tracking-[0.55px] uppercase",
                      step === 2
                        ? "font-semibold text-[#6366f1]"
                        : "text-[#64748b]",
                    )}
                  >
                    STEP 2
                  </p>
                  <p className="text-[13px] text-[#0f172a]">팀원 초대</p>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 1: 워크스페이스 이름 */}
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 shrink-0 rounded-full bg-[#6366f1]" />
                <p className="text-base tracking-[-0.4px] text-[#0f172a]">
                  워크스페이스 이름
                </p>
              </div>
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-1 rounded bg-[#e0e7ff]/50 px-2 py-1 text-xs text-[#6366f1] hover:bg-[#e0e7ff]/80"
                >
                  수정
                  <Pencil className="size-2.5" />
                </button>
              )}
            </div>

            <p className="mt-2.5 text-[13px] text-[#64748b]">
              팀원들과 함께 AI 대화와 프로젝트를 공유할 공간의 이름을
              정해주세요.
            </p>

            <div className="relative mt-2.5">
              <Input
                disabled={!isEditingName}
                placeholder="예: 프로덕트 디자인팀"
                className="h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-[17px] text-sm text-[#0f172a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] disabled:opacity-100"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isEditingName) {
                    e.preventDefault();
                    if (step === 1) handleGoToStep2();
                    else setIsEditingName(false);
                  }
                }}
                {...register("name")}
              />
              {!isEditingName && watchName && (
                <Check className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-[#6366f1]" />
              )}
              {errors.name && <FormMessage message={errors.name.message!} />}
            </div>

            {step === 1 && (
              <button
                type="button"
                onClick={handleGoToStep2}
                disabled={!watchName.trim()}
                className="mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#6366f1] text-xs text-white transition-colors hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                다음
                <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>

          {step === 2 && (
            <>
              <div className="h-px w-full bg-[#f1f5f9]" />

              {/* STEP 2: 팀원 초대 */}
              <div className="w-full">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-[#6366f1]" />
                  <p className="text-base tracking-[-0.4px] text-[#0f172a]">
                    팀원 초대하기
                  </p>
                </div>
                <p className="mt-1 text-[13px] text-[#64748b]">
                  함께 협업할 동료들의 이메일을 입력하세요. 언제든지 역할을
                  조정할 수 있습니다.
                </p>

                <div className="mt-4 flex flex-col gap-2.5">
                  {fields.map((invite, idx) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-xl border border-[#f1f5f9] bg-[#f8fafc] px-[15px] py-[11px]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-8 shrink-0 bg-[#e0e7ff]">
                          <AvatarFallback className="bg-inherit text-xs font-semibold text-[#6366f1]">
                            {invite.email[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] text-[#0f172a]">
                            {invite.email}
                          </p>
                          <p className="text-[11px] text-[#64748b]">
                            초대 예정
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Select
                          value={invite.role}
                          onValueChange={(v) =>
                            v && handleChangeInviteRole(idx, v)
                          }
                        >
                          <SelectTrigger className="h-8 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-xs drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                            <SelectValue>
                              {(value: string | null) => roleLabel(value ?? "")}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() => handleRemoveInvite(idx)}
                          title="초대 취소"
                          className="flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#e2e8f0]"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 이메일 입력 행 */}
                  <div className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white p-[7px] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                    <Mail className="ml-2 size-3.5 shrink-0 text-[#64748b]" />
                    <input
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddInvite();
                        }
                      }}
                      placeholder="teammate@company.com"
                      className="h-8 min-w-0 flex-1 border-none text-sm text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
                    />
                    <Select
                      value={roleInput}
                      onValueChange={(v) => v && setRoleInput(v)}
                    >
                      <SelectTrigger className="h-8 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-xs">
                        <SelectValue>
                          {(value: string | null) => roleLabel(value ?? "")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={handleAddInvite}
                      disabled={!emailInput.trim()}
                      className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#6366f1] px-3 text-xs text-white transition-colors hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="size-3" />
                      추가
                    </button>
                  </div>
                </div>

                {/* 초대 링크 */}
                <div className="mt-4 rounded-xl border border-[#f1f5f9] bg-[#f8fafc] p-[17px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Link2 className="size-3.5 text-[#0f172a]" />
                      <p className="text-xs text-[#0f172a]">
                        초대 링크로 팀원 초대하기
                      </p>
                    </div>
                    <p className="text-[11px] text-[#64748b]">
                      링크 소지자 가입 허용
                    </p>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-[#e2e8f0] bg-white px-[15px] py-[9px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                      <p className="truncate font-mono text-xs text-[#64748b]">
                        {INVITE_LINK}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-[15px] text-xs text-[#0f172a] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#f8fafc]"
                    >
                      <Copy className="size-3" />
                      링크 복사
                    </button>
                  </div>
                </div>
              </div>

              {/* 하단 액션 바 */}
              <div className="flex w-full items-center justify-between pt-1">
                <button
                  type="submit"
                  value="skip"
                  className="rounded-lg px-3 py-2 text-xs text-[#64748b] hover:bg-[#f1f5f9]"
                  disabled={!watchName.trim() || isCreating}
                >
                  나중에 하기
                </button>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleClickPrev}
                    disabled={isCreating}
                    className="flex h-10 items-center justify-center rounded-xl bg-[#f1f5f9] px-4 text-xs text-[#0f172a] hover:bg-[#e2e8f0]"
                  >
                    이전
                  </button>
                  <button
                    type="submit"
                    value="create"
                    disabled={!watchName.trim() || isCreating}
                    className="flex h-10 items-center gap-2 rounded-xl bg-[#6366f1] px-5 text-xs text-white drop-shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#4f46e5]"
                  >
                    {isCreating ? "생성 중..." : "워크스페이스 만들기"}
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              </div>

              {/* 하단 안내문 */}
              <div className="flex w-full items-center justify-center gap-2 border-t border-[#f1f5f9] pt-3">
                <span className="size-1.5 shrink-0 rounded-full bg-[#6366f1]/60" />
                <p className="text-[11px] text-[#64748b]">
                  워크스페이스 생성 후 언제든지 멤버 권한 및 세부 설정을 변경할
                  수 있습니다.
                </p>
              </div>
            </>
          )}

          {step === 1 && (
            <div className="flex w-full items-center justify-center gap-2 pt-1 text-[#64748b]">
              <Users className="size-3.5" />
              <p className="text-[11px]">
                이름을 정하고 다음 단계에서 팀원을 초대할 수 있어요.
              </p>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceModal;

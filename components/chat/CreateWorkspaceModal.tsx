"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Link2,
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "cn";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useCreateWorkspaceModalStore } from "@/stores/createWorkspaceModal";
import { useWorkspaceGroupStore } from "@/stores/workspaceGroup";
import {
  addWorkspaceMemberByEmail,
  createWorkspace,
  removeWorkspaceMember,
  renameWorkspace,
} from "@/actions/workspaces";
import { useUserStore } from "@/stores/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  CreateWorkspaceSchema,
  TCreateWorkspaceForm,
  WorkspaceInviteEmailSchema,
} from "@/schemas/workspace";
import FormMessage from "../auth/FormMessage";

const buildInviteLink = (inviteToken: string) => {
  const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return `${base}/invite/${inviteToken}`;
};

type Member = {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
};

type ResultMessage = {
  type: "success" | "pending" | "already" | "invalid";
  text: string;
};

const CreateWorkspaceModal = () => {
  const open = useCreateWorkspaceModalStore((state) => state.open);
  const setOpen = useCreateWorkspaceModalStore((state) => state.setOpen);
  const openWorkspace = useWorkspaceGroupStore((state) => state.openWorkspace);
  const storeUser = useUserStore((state) => state.user);

  const [step, setStep] = useState<1 | 2>(1);
  const [isEditingName, setIsEditingName] = useState(true);

  // STEP 1 "다음"을 누르는 즉시 워크스페이스가 만들어지므로, 이후엔 이
  // id/inviteToken을 그대로 씁니다 — STEP 2는 더 이상 "제출"이 없고, 모든
  // 조작(멤버 추가/제거/이름 수정)이 그 자리에서 바로 서버에 반영됩니다.
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [savedName, setSavedName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);

  const [emailInput, setEmailInput] = useState("");
  const [resultMessage, setResultMessage] = useState<ResultMessage | null>(
    null,
  );
  const [isLinkHighlighted, setIsLinkHighlighted] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const [isCreating, startCreateTransition] = useTransition();
  const [isRenaming, startRenameTransition] = useTransition();
  const [isAdding, startAddTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startRemoveTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<TCreateWorkspaceForm>({
    resolver: zodResolver(CreateWorkspaceSchema),
    mode: "onChange",
    defaultValues: { name: "" },
  });

  const nameField = register("name");

  const watchName = watch("name");

  // "수정"을 누르면 isEditingName이 true가 되는데, 그 순간엔 아직 입력창이
  // disabled 상태라 바로 focus()를 걸 수 없어요. 리렌더로 disabled가 풀린
  // 다음에 포커싱되도록 effect로 분리합니다.
  useEffect(() => {
    if (isEditingName) setFocus("name");
  }, [isEditingName, setFocus]);

  const resetState = () => {
    setStep(1);
    setIsEditingName(true);
    setWorkspaceId(null);
    setInviteToken(null);
    setSavedName("");
    setMembers([]);
    setEmailInput("");
    setResultMessage(null);
    setCopyState("idle");
    reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      // 완료/나중에 하기/X/바깥 클릭 등 닫는 방법과 상관없이, 워크스페이스가
      // 만들어진 상태였다면 사이드바에서 바로 펼쳐진 채로 보이게 합니다.
      if (workspaceId) openWorkspace(workspaceId);
      resetState();
    }
  };

  const handleGoToStep2 = handleSubmit((data) => {
    startCreateTransition(async () => {
      try {
        const newWorkspace = await createWorkspace(data.name);
        setWorkspaceId(newWorkspace.id);
        setInviteToken(newWorkspace.inviteToken);
        setSavedName(newWorkspace.name);
        setMembers([
          {
            id: newWorkspace.ownerId,
            name: storeUser.name || "",
            email: storeUser.email || "",
            isOwner: true,
          },
        ]);
        setIsEditingName(false);
        setStep(2);
        toast.success(`'${newWorkspace.name}' 워크스페이스가 만들어졌어요`);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "워크스페이스 생성에 실패했습니다",
        );
      }
    });
  });

  // blur(=포커스 아웃)로 저장합니다. Enter도 같은 함수를 쓰고, 둘 다
  // react-hook-form의 watch()가 아니라 이벤트에서 받은 실제 DOM 값을
  // 그대로 씁니다 — Esc로 되돌린 직후 blur가 한 번 더 걸려도, 그 시점의
  // state 반영 타이밍에 기대지 않고 안전하게 "바뀐 게 없다"로 처리되도록.
  const handleBlurName = (rawValue: string) => {
    setIsEditingName(false);

    if (!workspaceId) return;

    const newName = rawValue.trim();

    // 바뀐 게 없으면 요청을 보내지 않습니다.
    if (newName === savedName) return;

    // 비어있거나 공백뿐이면 저장하지 않고 원래 이름으로 되돌립니다.
    if (!newName) {
      setValue("name", savedName);
      return;
    }

    startRenameTransition(async () => {
      try {
        await renameWorkspace(workspaceId, newName);
        setSavedName(newName);
      } catch (error) {
        setValue("name", savedName);
        toast.error(
          error instanceof Error ? error.message : "이름 변경에 실패했습니다",
        );
      }
    });
  };

  // Esc: 저장하지 않고 원래 이름으로 되돌린 뒤 수정 모드만 종료합니다.
  const handleCancelEditName = () => {
    setValue("name", savedName);
    setIsEditingName(false);
  };

  const handleAddInvite = () => {
    const email = emailInput.trim();
    const parsed = WorkspaceInviteEmailSchema.safeParse(email);

    if (!parsed.success) {
      setResultMessage({
        type: "invalid",
        text: "올바른 이메일 주소를 입력해 주세요.",
      });
      return;
    }

    if (members.some((member) => member.email === email)) {
      setResultMessage({ type: "already", text: "이미 참여 중인 멤버예요" });
      setEmailInput("");
      return;
    }

    if (!workspaceId) return;

    startAddTransition(async () => {
      try {
        const result = await addWorkspaceMemberByEmail(workspaceId, email);

        if (result.status === "added") {
          setMembers((prev) => [
            ...prev,
            {
              id: result.member.id,
              name: result.member.name,
              email,
              isOwner: false,
            },
          ]);
          setResultMessage({
            type: "success",
            text: `${result.member.name} 님을 추가했어요`,
          });
        } else if (result.status === "already-member") {
          setResultMessage({
            type: "already",
            text: "이미 참여 중인 멤버예요",
          });
        } else {
          setResultMessage({
            type: "pending",
            text: "아직 가입하지 않은 이메일이에요. 아래 초대 링크를 전달해 주세요.",
          });
          setIsLinkHighlighted(true);
          setTimeout(() => setIsLinkHighlighted(false), 1600);
        }
        setEmailInput("");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "초대에 실패했습니다",
        );
      }
    });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!workspaceId) return;

    setRemovingId(memberId);
    startRemoveTransition(async () => {
      try {
        await removeWorkspaceMember(workspaceId, memberId);
        setMembers((prev) => prev.filter((member) => member.id !== memberId));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "멤버 제거에 실패했습니다",
        );
      } finally {
        setRemovingId(null);
      }
    });
  };

  const handleCopyLink = async () => {
    if (!inviteToken) return;
    await navigator.clipboard.writeText(buildInviteLink(inviteToken));
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[80%] gap-6 rounded-2xl border border-[#e2e8f0]/80 p-[33px] sm:max-w-[672px]">
        <DialogTitle className="sr-only">워크스페이스 만들기</DialogTitle>

        <div className="contents">
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
                    워크스페이스 생성
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
              {step === 2 && !isEditingName && (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  disabled={isRenaming}
                  className="flex items-center gap-1 rounded bg-[#e0e7ff]/50 px-2 py-1 text-xs text-[#6366f1] hover:bg-[#e0e7ff]/80 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  수정
                  <Pencil className="size-2.5" />
                </button>
              )}
            </div>

            {step === 1 && (
              <p className="mt-2.5 text-[13px] text-[#64748b]">
                팀원들과 함께 AI 대화와 프로젝트를 공유할 공간의 이름을
                정해주세요.
              </p>
            )}

            <div className="relative mt-2.5">
              <Input
                disabled={!isEditingName || isRenaming}
                placeholder="예: 프로덕트 디자인팀"
                className="h-11 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-[17px] text-sm text-[#0f172a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] disabled:opacity-100"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isEditingName) {
                    e.preventDefault();
                    if (step === 1) handleGoToStep2();
                    else handleBlurName(e.currentTarget.value);
                  } else if (
                    e.key === "Escape" &&
                    step === 2 &&
                    isEditingName
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancelEditName();
                  }
                }}
                {...nameField}
                onBlur={(e) => {
                  nameField.onBlur(e);
                  if (step === 2) handleBlurName(e.target.value);
                }}
              />
              {!isEditingName && watchName && (
                <Check className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-[#6366f1]" />
              )}
              {/* STEP 2에선 비워도 저장 안 하고 조용히 원래 이름으로
                  되돌아가므로(handleBlurName), 이 에러 문구는 STEP 1에서만
                  필요합니다. */}
              {step === 1 && errors.name && (
                <FormMessage message={errors.name.message!} />
              )}
            </div>

            {step === 1 && (
              <button
                type="button"
                onClick={handleGoToStep2}
                disabled={!watchName.trim() || isCreating}
                className="mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#6366f1] text-xs text-white transition-colors hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? "만드는 중..." : "워크스페이스 만들기"}
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
                  가입된 이메일은 바로 추가되고, 미가입자는 아래 링크로 초대할
                  수 있어요.
                </p>

                {/* 이메일 입력 줄 (역할 선택 없음) */}
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white p-[7px] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] focus-within:border-[#6366f1] focus-within:ring-2 focus-within:ring-[#6366f1]">
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
                  <button
                    type="button"
                    onClick={handleAddInvite}
                    disabled={!emailInput.trim() || isAdding}
                    className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#6366f1] px-3 text-xs text-white transition-colors hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="size-3" />
                    추가
                  </button>
                </div>

                {/* 결과 메시지 — 한 번에 하나만 */}
                {resultMessage && (
                  <div
                    className={cn(
                      "mt-2 flex items-center gap-2 rounded-lg border px-[13px] py-[7px]",
                      resultMessage.type === "success"
                        ? "border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.1)]"
                        : "border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.1)]",
                    )}
                  >
                    {resultMessage.type === "success" ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-[#059669]" />
                    ) : (
                      <AlertTriangle className="size-3.5 shrink-0 text-[#d97706]" />
                    )}
                    <p
                      className={cn(
                        "text-xs font-medium",
                        resultMessage.type === "success"
                          ? "text-[#059669]"
                          : "text-[#d97706]",
                      )}
                    >
                      {resultMessage.text}
                    </p>
                  </div>
                )}

                {/* 멤버 칩 목록 — 맨 앞은 항상 나(오너) */}
                <div className="mt-4">
                  <p className="text-xs font-semibold text-[#64748b]">
                    멤버{" "}
                    <span className="font-bold text-[#6366f1]">
                      ({members.length})
                    </span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 rounded-full border border-[#e2e8f0]/60 bg-[#e2e8f0] py-[5px] pr-[11px] pl-[5px] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
                      >
                        <Avatar size="sm" className="bg-[#6366f1]">
                          <AvatarFallback className="bg-inherit text-[11px] font-semibold text-white">
                            {member.name.slice(0, 1)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-[#0f172a]">
                          {member.isOwner ? `${member.name} (나)` : member.name}
                        </span>
                        {member.isOwner ? (
                          <span className="rounded-full bg-[#6366f1]/10 px-2 py-0.5 text-[10px] font-semibold text-[#6366f1]">
                            오너
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#64748b]">
                            {member.email}
                          </span>
                        )}
                        {!member.isOwner && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removingId === member.id}
                            title="워크스페이스에서 제거"
                            className="flex size-4 shrink-0 items-center justify-center rounded-full text-[#64748b] hover:bg-[#cbd5e1] disabled:opacity-50"
                          >
                            <X className="size-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 초대 링크 — 항상 표시 */}
                <div
                  className={cn(
                    "mt-4 rounded-xl border p-[17px] transition-colors",
                    isLinkHighlighted
                      ? "border-[#6366f1] bg-[#f1f5f9]"
                      : "border-[#f1f5f9] bg-[#f8fafc]",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Link2 className="size-3.5 text-[#0f172a]" />
                      <p className="text-xs font-semibold text-[#0f172a]">
                        초대 링크로 초대하기
                      </p>
                    </div>
                    <p className="text-[11px] text-[#64748b]">
                      링크 소지자 가입 허용
                    </p>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 overflow-hidden rounded-lg border border-[#e2e8f0] bg-white px-[15px] py-[9px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                      <p className="truncate font-mono text-xs text-[#64748b]">
                        {inviteToken ? buildInviteLink(inviteToken) : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      disabled={!inviteToken}
                      className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#e2e8f0] bg-white px-[15px] text-xs text-[#0f172a] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {copyState === "copied" ? (
                        <>
                          <Check className="size-3 text-[#059669]" />
                          복사됨
                        </>
                      ) : (
                        "링크 복사"
                      )}
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1">
                    <ShieldCheck className="size-3 shrink-0 text-[#6366f1]" />
                    <p className="text-[11px] text-[#64748b]">
                      링크를 받은 사람은 가입 후 바로 참여해요
                    </p>
                  </div>
                </div>
              </div>

              {/* 하단 액션 바 */}
              <div className="flex w-full items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  disabled={isAdding}
                  className="rounded-lg px-3 py-2 text-xs text-[#64748b] hover:bg-[#f1f5f9]"
                >
                  나중에 하기
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  disabled={isAdding}
                  className="flex h-10 items-center gap-2 rounded-xl bg-[#6366f1] px-5 text-xs text-white drop-shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  완료
                  <ArrowRight className="size-3" />
                </button>
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
                만든 뒤 바로 팀원을 초대할 수 있어요
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkspaceModal;

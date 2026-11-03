"use client";

import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MobileMenu from "./MobileMenu";
import ModelSelect from "./ModelSelect";
import WorkspaceConversationHeader from "./WorkspaceConversationHeader";
import { useUserStore } from "@/stores/user";
import { useParams } from "next/navigation";
import { getConversation, updateConversation } from "@/actions/conversations";
import { getWorkspaceHeaderInfo } from "@/actions/workspaces";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { isEmpty } from "@/utils";

const Header = ({ sidebar }: { sidebar: ReactNode }) => {
  const { id, workspaceId } = useParams<{ id?: string; workspaceId?: string }>();
  const userName = useUserStore((state) => state.user.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [inputValue, setInputValue] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const initials = (userName || "").slice(-2);

  const { data: conversation } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id!),
    enabled: !!id,
  });

  // 워크스페이스 공유 대화(/w/[workspaceId]/c/[id])일 때만 필요한 추가 정보
  const { data: workspaceInfo } = useQuery({
    queryKey: ["workspace-header", workspaceId],
    queryFn: () => getWorkspaceHeaderInfo(workspaceId!),
    enabled: !!workspaceId && !!id,
  });

  const conversationName = id ? (conversation?.name ?? "") : null;

  const renameMutation = useMutation({
    mutationFn: (name: string) => updateConversation(id!, name),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: ["conversation", id] });
      const previous = queryClient.getQueryData(["conversation", id]);

      queryClient.setQueryData(["conversation", id], (old: any) => ({
        ...old,
        name,
      }));

      return { previous };
    },
    onError: (error, _name, context) => {
      console.error("error:", error);
      toast.error("대화명 수정에 실패하였습니다.");

      if (context?.previous) {
        queryClient.setQueryData(["conversation", id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", id] });
    },
  });

  const handleBlurEditInput = () => {
    setIsEditMode(false);

    if (!id) return;
    if (conversationName === inputValue) return;

    renameMutation.mutate(inputValue);
  };

  const handleKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleBlurEditInput();
  };

  const handleClickEditButton = () => {
    setInputValue(conversationName ?? "");
    setIsEditMode(true);
  };

  useEffect(() => {
    if (isEditMode) {
      inputRef.current?.focus();
    }
  }, [isEditMode]);

  // 워크스페이스 공유 대화 화면에서는 전용 헤더(워크스페이스 배지/멤버 아바타/
  // 모델 선택/검색)로 완전히 교체합니다. 데이터가 아직 로딩 중이면(workspaceInfo
  // 없음) 깜빡임 없이 아래 기본 헤더를 그대로 보여줍니다.
  if (workspaceId && id && workspaceInfo) {
    return (
      <WorkspaceConversationHeader
        sidebar={sidebar}
        workspaceName={workspaceInfo.workspaceName}
        conversationTitle={conversationName || "새 대화"}
        members={workspaceInfo.members.map((member) => ({
          name: member.name,
          initial: member.name.slice(-2),
        }))}
        userInitials={initials}
      />
    );
  }

  return (
    <header className="h-14 shrink-0 sticky top-0 z-10 flex items-center justify-between border-b border-[#e2e8f0]/60 bg-white/90 px-6 backdrop-blur-[6px]">
      <div className="flex min-w-0 items-center gap-3">
        {/* 모바일 메뉴 영역 */}
        <MobileMenu>{sidebar}</MobileMenu>

        {!isEmpty(conversationName) && (
          <div className="flex max-w-50 flex-1 items-center gap-x-3">
            {isEditMode ? (
              <input
                ref={inputRef}
                className="rounded-lg border border-zinc-400 bg-transparent px-2 py-1 text-[13px] w-100"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onBlur={handleBlurEditInput}
                onKeyDown={handleKeydown}
                disabled={renameMutation.isPending}
              />
            ) : (
              <>
                <div className="min-w-0 flex-1 truncate">
                  {conversationName}
                </div>
                <button
                  className="hover:cursor-pointer"
                  onClick={handleClickEditButton}
                >
                  <Pencil className="text-[#64748b]/60 size-3.5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* 모델 선택 영역 */}
        <ModelSelect />
      </div>

      <div className="flex size-8 items-center justify-center rounded-full bg-[#4f46e5] text-xs text-white">
        {initials}
      </div>
    </header>
  );
};

export default Header;

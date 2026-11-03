"use client";

import { BarChart2, ChevronDown, Folder, Plus, Settings } from "lucide-react";
import { cn } from "cn";
import { WORKSPACE_ROUTES } from "@/constants/routes";
import WorkSpaceItem from "./WorkSpaceItem";
import Link from "next/link";
import { useWorkspaceGroupStore } from "@/stores/workspaceGroup";
import { useUserStore } from "@/stores/user";
import { useModalStore } from "@/stores/modal";
import ModalFooter from "../modal/ModalFooter";
import { useOptimistic, useTransition } from "react";
import { deleteConversation } from "@/actions/conversations";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Props = {
  workspace: {
    role: "owner" | "admin" | "member";
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
  };
  conversations: { id: string; name: string | null; userId: string }[];
};

const WorkspaceGroup = ({ workspace, conversations }: Props) => {
  const { id: conversationId } = useParams<{ id?: string }>();
  const router = useRouter();
  const openWorkspaceId = useWorkspaceGroupStore(
    (state) => state.openWorkspaceId,
  );
  const toggleWorkspace = useWorkspaceGroupStore(
    (state) => state.toggleWorkspace,
  );
  const isCollapsed = openWorkspaceId !== workspace.id;
  const currentUserId = useUserStore((state) => state.user.id);

  const isMember = workspace.role === "member";
  const isOwner = workspace.role === "owner";
  const { openModal, closeModal } = useModalStore((state) => state);

  const [isDeleting, startDeleteTransition] = useTransition();

  // 이름 변경/삭제 권한: 오너는 전부, 멤버는 본인이 만든 대화만 (⋮ 메뉴 노출 여부에
  // 그대로 반영됩니다 — 실제 검증은 actions/conversations.ts에서 한 번 더 합니다)
  const items = conversations.map((conversation) => ({
    id: conversation.id,
    label: conversation.name || "",
    href: WORKSPACE_ROUTES.CONVERSATION(workspace.id, conversation.id),
    canManage: isOwner || conversation.userId === currentUserId,
  }));

  const [optimisticList, removeOptimisticList] = useOptimistic(
    items,
    (state, deletedId: string) => state.filter((item) => item.id !== deletedId),
  );

  const handleClickDeleteButton = (id: string) => {
    openModal({
      title: "정말 삭제하시겠습니까?",
      description: "삭제 후 데이터는 복구하기 어려울 수 있습니다.",
      footer: (
        <ModalFooter
          disabled={isDeleting}
          onCancel={closeModal}
          onConfirm={() => onDelete(id)}
        />
      ),
    });
  };

  const onDelete = (id: string) => {
    startDeleteTransition(async () => {
      removeOptimisticList(id);
      try {
        await deleteConversation(id);

        if (conversationId === id) {
          router.replace(WORKSPACE_ROUTES.NEW(workspace.id));
        }

        toast.success("삭제에 성공했습니다.");

        closeModal();
      } catch (error) {
        console.error("error:", error);
        toast.error("삭제에 실패했습니다.");
      }
    });
  };

  return (
    <div className="w-full rounded-lg">
      <div className="flex items-center justify-between gap-x-2 px-2 py-1.5">
        <button
          className="flex min-w-0 flex-1 items-center gap-x-2"
          onClick={() => toggleWorkspace(workspace.id)}
        >
          <Folder
            className={cn(
              "size-3.5 shrink-0",
              isCollapsed ? "text-[#64748b]" : "text-[#6366F1]",
            )}
          />
          <span className="truncate text-[13px] text-[#0f172a]">
            {workspace.name}
          </span>

          <ChevronDown
            className={cn("size-3.5", isCollapsed && "-rotate-90")}
          />
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            href={WORKSPACE_ROUTES.NEW(workspace.id)}
            title="대화 추가"
            className="flex size-6 items-center justify-center rounded text-[#64748b] hover:text-[#0f172a]"
          >
            <Plus className="size-3.5" />
          </Link>
          {!isMember && (
            <button
              type="button"
              disabled
              title="통계 (준비 중)"
              className="flex size-6 items-center justify-center rounded text-[#64748b] disabled:opacity-50"
            >
              <BarChart2 className="size-3.5" />
            </button>
          )}
          {!isMember && (
            <button
              type="button"
              disabled
              title="워크스페이스 설정 (준비 중)"
              className="flex size-6 items-center justify-center rounded text-[#64748b] disabled:opacity-50"
            >
              <Settings className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col gap-0.5 px-1">
          {optimisticList.length === 0 ? (
            <p className="px-2.5 py-2 text-[13px] text-[#64748b]">
              아직 대화가 없어요
            </p>
          ) : (
            <>
              {optimisticList.map((item) => (
                <WorkSpaceItem
                  key={item.id}
                  item={item}
                  onDelete={(id) => handleClickDeleteButton(id)}
                  canManage={item.canManage}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceGroup;

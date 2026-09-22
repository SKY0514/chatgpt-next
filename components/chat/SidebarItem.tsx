"use client";

import Link from "next/link";
import {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { EllipsisVertical, Pencil, Trash } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { cn } from "cn";
import { useSheetStore } from "@/stores/sheet";
import {
  deleteConversation,
  updateConversation,
} from "@/actions/conversations";
import toast from "react-hot-toast";
import { useModalStore } from "@/stores/modal";
import ModalFooter from "../modal/ModalFooter";
import { BASE_URL } from "@/constants/routes";

type Props = {
  item: { id: string; label: string; href: string };
};
const SidebarItem = ({ item }: Props) => {
  const { id, label, href } = item;
  const pathName = usePathname();
  const editInputRef = useRef<HTMLInputElement>(null);
  const { id: conversationId } = useParams<{ id: string }>();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInputValue, setEditInputValue] = useState(item.label);

  const setOpen = useSheetStore((state) => state.setOpen);
  const { openModal, closeModal } = useModalStore((state) => state);

  useEffect(() => {
    if (isEditMode) {
      editInputRef.current?.focus();
    }
  }, [isEditMode]);

  const handleClickEdit = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsEditMode(true);
  };

  const handleChangeEditInputValue = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setEditInputValue(e.target.value);
  };

  const handleBlurEditInput = async () => {
    setIsEditMode(false);
    if (editInputValue === label) return;

    try {
      await updateConversation(id, editInputValue);
    } catch (error) {
      console.error("error:", error);
      toast.error("대화명 수정에 실패하였습니다.");
    }
  };

  const handleKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlurEditInput();
    }
  };

  const handleClickDelete = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    openModal({
      title: "정말 삭제하시겠습니까?",
      description: "삭제 후 데이터는 복구하기 어려울 수 있습니다.",
      footer: <ModalFooter onCancel={closeModal} onConfirm={handleDelete} />,
    });
  };

  const handleDelete = async () => {
    try {
      await deleteConversation(id);

      if (conversationId === id) {
        router.replace(BASE_URL);
      }

      toast.success("삭제에 성공했습니다.");

      closeModal();
    } catch (error) {
      console.error("error:", error);
      toast.error("삭제에 실패했습니다.");
    }
  };

  const isActive = pathName === href;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-[13px] min-h-10",
        isActive
          ? "bg-[#e2e8f0] text-[#0f172a]"
          : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]",
      )}
      onClick={() => setOpen(false)}
    >
      {isActive && (
        <span className="absolute top-2 bottom-2 left-0 w-1 rounded-r-full bg-[#6366f1]" />
      )}
      {/* label 영역 */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <img
          src={
            isActive
              ? "/icon-active-conversation.svg"
              : "/icon-Inactive-conversation.svg"
          }
          className="size-3.75"
          alt={
            isActive ? "active conversation icon" : "inactive conversation icon"
          }
        />

        {isEditMode ? (
          <input
            ref={editInputRef}
            className="rounded-lg border border-zinc-400 bg-transparent px-2 py-1 text-[13px]"
            value={editInputValue}
            onChange={handleChangeEditInputValue}
            onClick={(e: MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onBlur={handleBlurEditInput}
            onKeyDown={handleKeydown}
          />
        ) : (
          <div className="min-w-0 flex-1 truncate">{label}</div>
        )}
      </div>

      {/* 드롭다운 영역 */}

      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger
          render={<div />}
          nativeButton={false}
          onClick={(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={cn(
            "size-6 shrink-0 items-center justify-center rounded",
            isMenuOpen
              ? "flex"
              : "hidden opacity-0 group-hover:flex group-hover:opacity-100",
          )}
        >
          <EllipsisVertical
            className="text-[#64748b] hover:text-[#0f172a]"
            size={15}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="gap-2" onClick={handleClickEdit}>
            <Pencil size={16} />
            이름 변경
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2" onClick={handleClickDelete}>
            <Trash size={16} />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Link>
  );
};

export default SidebarItem;

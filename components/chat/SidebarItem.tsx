"use client";

import Link from "next/link";
import {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { EllipsisVertical, Pencil, Trash } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
  onDelete: (id: string) => void;
};
const SidebarItem = ({ item, onDelete }: Props) => {
  const { id, label, href } = item;
  const [optimisticLabel, setOptimisticLabel] = useOptimistic(label);
  const pathName = usePathname();
  const editInputRef = useRef<HTMLInputElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInputValue, setEditInputValue] = useState(item.label);

  const setOpen = useSheetStore((state) => state.setOpen);
  const queryClient = useQueryClient();

  const [isRenaming, startRenameTransition] = useTransition();

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

  const handleBlurEditInput = () => {
    setIsEditMode(false);
    if (editInputValue === label) return;

    startRenameTransition(async () => {
      setOptimisticLabel(editInputValue);
      try {
        await updateConversation(id, editInputValue);
        // Header가 useQuery(["conversation", id])로 같은 대화를 보고 있을 수 있어 함께 갱신
        queryClient.invalidateQueries({ queryKey: ["conversation", id] });
      } catch (error) {
        console.error("error:", error);
        toast.error("대화명 수정에 실패하였습니다.");
      }
    });
  };

  const handleKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBlurEditInput();
    }
  };

  const handleClickDelete = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    onDelete(id);
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
              : "/icon-inactive-conversation.svg"
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
            disabled={isRenaming}
          />
        ) : (
          <div className="min-w-0 flex-1 truncate">{optimisticLabel}</div>
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

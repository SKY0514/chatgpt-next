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
import { Ellipsis, Pencil, Trash } from "lucide-react";
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
  item: { id: string; label: string; icon: ReactNode; href: string };
};
const SidebarItem = ({ item }: Props) => {
  const { id, label, icon, href } = item;
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

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between text-sm p-3 group hover:text-white hover:bg-white/10 rounded-lg",
        isMenuOpen || pathName === href
          ? "text-white bg-white/10"
          : "text-zinc-400",
      )}
      onClick={() => setOpen(false)}
    >
      {/* label 영역 */}
      <div className="flex items-center gap-2">
        {icon}
        {isEditMode ? (
          <input
            ref={editInputRef}
            className="bg-transparent border border-zinc-400 rounded-lg px-2 py-1"
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
          <div className="w-45 truncate">{label}</div>
        )}
      </div>

      {/* 드롭다운 영역 */}

      {id !== "new" && (
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger
            render={<div />}
            nativeButton={false}
            onClick={(e: MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Ellipsis
              className={cn(
                "group-hover:block text-gray-400 hover:text-white",
                isMenuOpen ? "block text-white" : "md:hidden text-gray-400",
              )}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem className="gap-2" onClick={handleClickEdit}>
              <Pencil size={18} />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={handleClickDelete}>
              <Trash size={18} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Link>
  );
};

export default SidebarItem;

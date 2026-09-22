"use client";

import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import MobileMenu from "./MobileMenu";
import ModelSelect from "./ModelSelect";
import { useUserStore } from "@/stores/user";
import { useParams } from "next/navigation";
import { getConversation, updateConversation } from "@/actions/conversations";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { isEmpty } from "@/utils";

const Header = ({ sidebar }: { sidebar: ReactNode }) => {
  const { id } = useParams<{ id?: string }>();
  const userName = useUserStore((state) => state.user.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const [conversationName, setConversationName] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const initials = (userName || "").slice(-2);

  const handleBlurEditInput = async () => {
    setIsEditMode(false);

    if (!id) return;
    if (conversationName === inputValue) return;

    try {
      await updateConversation(id, inputValue);
      setConversationName(inputValue);
    } catch (error) {
      console.error("error:", error);
      toast.error("대화명 수정에 실패하였습니다.");
    }
  };

  const handleKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleBlurEditInput();
  };

  const handleClickEditButton = () => {
    setInputValue(conversationName ?? "");
    setIsEditMode(true);
  };

  useEffect(() => {
    let cancelled = false;

    const promise = id ? getConversation(id) : Promise.resolve(null);

    promise.then((conversation) => {
      if (cancelled) return;

      setConversationName(id ? (conversation?.name ?? "") : null);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      inputRef.current?.focus();
    }
  }, [isEditMode]);

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

"use client";

import { useState } from "react";
import { ArrowUp, Quote, X } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback } from "../ui/avatar";
import type { WorkspaceMessageAuthor } from "./WorkspaceMessage";

export type WorkspaceComment = {
  author: WorkspaceMessageAuthor;
  timestamp: string;
  content: string;
  // 지금 보고 있는 사람 본인이 남긴 코멘트인지 — 말풍선을 다르게 강조합니다.
  isSelf?: boolean;
};

type Props = {
  // 코멘트가 달린 AI 답변을 짧게 보여주는 요약문 (패널 상단 고정)
  answerSummary: string;
  comments: WorkspaceComment[];
  onClose?: () => void;
};

const WorkspaceCommentPanel = ({
  answerSummary,
  comments,
  onClose,
}: Props) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    toast("미리보기 화면이라 실제로 등록되지는 않아요");
    setInputValue("");
  };

  return (
    <div className="fixed inset-y-0 right-0 z-20 flex w-[360px] flex-col border-l border-[#e2e8f0] bg-white shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]">
      {/* 헤더 */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e2e8f0]/60 px-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-[#0f172a]">코멘트</span>
          <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-semibold text-[#6366f1]">
            {comments.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* 답변 요약 */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div className="rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Quote className="size-3 text-[#6366f1]" />
            <span className="text-[11px] font-semibold text-[#6366f1]">
              답변 요약
            </span>
          </div>
          <p className="line-clamp-2 text-[13px] text-[#64748b]">
            {answerSummary}
          </p>
        </div>
      </div>

      {/* 코멘트 목록 */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-2">
        {comments.map((comment, index) => (
          <div key={index} className="flex w-full items-start gap-2.5">
            <Avatar size="sm" className="mt-0.5 shrink-0 bg-[#e0e7ff]">
              <AvatarFallback className="bg-inherit text-[11px] font-semibold text-[#6366f1]">
                {comment.author.initial}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span
                  className={
                    comment.isSelf
                      ? "text-[13px] font-semibold text-[#6366f1]"
                      : "text-[13px] font-semibold text-[#0f172a]"
                  }
                >
                  {comment.author.name}
                  {comment.isSelf && (
                    <span className="ml-1 text-[11px] font-normal text-[#64748b]">
                      (나)
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-semibold text-[#64748b]">
                  {comment.timestamp}
                </span>
              </div>

              <div
                className={
                  comment.isSelf
                    ? "rounded-2xl rounded-tl-xs border border-[#6366f1]/20 bg-[#e0e7ff]/40 p-2.5 text-[13px] text-[#0f172a]"
                    : "rounded-2xl rounded-tl-xs bg-[#f1f5f9] p-2.5 text-[13px] text-[#0f172a]"
                }
              >
                {comment.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 코멘트 입력창 — UI만, 실제 등록 기능은 없음 */}
      <div className="shrink-0 border-t border-[#e2e8f0]/60 px-3 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] py-1.5 pr-1.5 pl-3 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="스레드에 코멘트 남기기..."
            className="h-[18px] min-w-0 flex-1 border-none bg-transparent text-[13px] text-[#0f172a] outline-none placeholder:text-[#64748b]"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#6366f1] text-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#4f46e5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUp className="size-3" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceCommentPanel;

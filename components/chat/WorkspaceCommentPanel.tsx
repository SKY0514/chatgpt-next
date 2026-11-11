"use client";

import { useState, useTransition } from "react";
import { ArrowUp, MessageSquareText, MessagesSquare, X } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import {
  addWorkspaceComment,
  getMessageComments,
} from "@/actions/workspaceComments";
import { formatMessageTime } from "@/utils";
import { WORKSPACE_POLL_INTERVAL } from "@/constants/chat";
import { WORKSPACE_ROUTES } from "@/constants/routes";

type Props = {
  messageId: string;
  // 코멘트가 달린 AI 답변을 짧게 보여주는 요약문 (패널 상단 고정)
  answerSummary: string;
  onClose?: () => void;
  // 답변 요약 영역 클릭 시 — 대화 목록에서 해당 답변으로 스크롤합니다.
  onClickSummary?: () => void;
};

const WorkspaceCommentPanel = ({
  messageId,
  answerSummary,
  onClose,
  onClickSummary,
}: Props) => {
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { workspaceId } = useParams<{ workspaceId?: string }>();

  // WorkspaceMessage.tsx의 코멘트 버튼과 같은 쿼리키를 써서, 코멘트를
  // 남기면 버튼의 코멘트 수도 자동으로 같이 갱신됩니다.
  const { data: comments = [] } = useQuery({
    queryKey: ["workspace-comments", messageId],
    queryFn: () => getMessageComments(messageId),
    refetchInterval: WORKSPACE_POLL_INTERVAL,
  });

  const handleSubmit = () => {
    const content = inputValue.trim();
    if (!content) return;

    startTransition(async () => {
      try {
        await addWorkspaceComment(messageId, content);
        setInputValue("");
        queryClient.invalidateQueries({
          queryKey: ["workspace-comments", messageId],
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "대화방이 삭제되었습니다."
        ) {
          toast.error(error.message);
          onClose?.();
          if (workspaceId) {
            router.push(WORKSPACE_ROUTES.NEW(workspaceId));
            // 사이드바(서버 컴포넌트)가 라우터 캐시의 이전 목록을 보여줄 수
            // 있어서, 서버 데이터를 다시 가져오게 강제합니다.
            router.refresh();
          }
          return;
        }
        console.error("error:", error);
        toast.error("코멘트 등록에 실패하였습니다.");
      }
    });
  };

  return (
    <div className="flex h-full w-[360px] shrink-0 flex-col border-l border-[#e2e8f0] bg-white">
      {/* 헤더 */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e2e8f0]/60 px-3">
        <div className="flex items-center gap-2">
          <MessagesSquare className="size-4" />
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

      {/* 답변 요약 — 클릭하면 대화 목록에서 해당 답변으로 스크롤합니다 */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <button
          type="button"
          onClick={onClickSummary}
          className="w-full rounded-xl border border-[#e2e8f0] bg-[#f1f5f9] p-3 text-left transition-colors hover:bg-[#e2e8f0]/60"
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <MessageSquareText className="w-3 h-auto" stroke="#6366f1" />
            <span className="text-[11px] font-semibold text-[#6366f1]">
              답변 요약
            </span>
          </div>
          <p className="line-clamp-2 text-[13px]">{answerSummary}</p>
        </button>
      </div>

      {/* 코멘트 목록 — 내 코멘트는 오른쪽, 다른 사람 코멘트는 왼쪽 */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-2">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`flex w-full items-start gap-2.5 ${
              comment.isSelf ? "justify-end" : ""
            }`}
          >
            {!comment.isSelf && (
              <Avatar size="default" className="mt-0.5 shrink-0 bg-[#e0e7ff]">
                <AvatarFallback className="bg-inherit text-[11px] text-[#464554]">
                  {comment.author.initial}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={`min-w-0 max-w-[85%] space-y-1 ${
                comment.isSelf ? "flex flex-col items-end" : "flex-1"
              }`}
            >
              <div
                className={`flex items-center gap-2 ${
                  comment.isSelf ? "flex-row-reverse" : "justify-between"
                }`}
              >
                <span
                  className={
                    comment.isSelf
                      ? "text-[13px] text-[#6366f1]"
                      : "text-[13px] text-[#0f172a]"
                  }
                >
                  {comment.author.name}
                  {comment.isSelf && (
                    <span className="ml-1 text-[11px] font-normal text-[#64748b]">
                      (나)
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-[#64748b]">
                  {formatMessageTime(comment.createdAt)}
                </span>
              </div>

              <div
                className={
                  comment.isSelf
                    ? "rounded-2xl rounded-tr-xs border border-[#6366f1]/20 bg-[#e0e7ff]/40 p-2.5 text-[13px] text-[#0f172a]"
                    : "rounded-2xl rounded-tl-xs bg-[#f1f5f9] p-2.5 text-[13px] text-[#0f172a]"
                }
              >
                {comment.content}
              </div>
            </div>

            {comment.isSelf && (
              <Avatar size="default" className="mt-0.5 shrink-0 bg-[#c9e6ff]">
                <AvatarFallback className="bg-inherit text-[11px] text-[#0f172a]">
                  {comment.author.initial}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
      </div>

      {/* 코멘트 입력창 */}
      <div className="shrink-0 border-t border-[#e2e8f0]/60 px-3 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-end gap-2 rounded-xl border border-[#e2e8f0] bg-[#F2F3FF] py-1.5 pr-1.5 pl-3 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
        >
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                !isPending
              ) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="스레드에 코멘트 남기기..."
            rows={1}
            disabled={isPending}
            // min-h-8(32px)을 전송 버튼(size-8)과 똑같이 맞춰서, 한 줄일 땐
            // items-end로 바닥을 맞춰도 버튼과 높이가 같아 자연히 가운데처럼
            // 보이고, 줄이 늘어나면 버튼은 그대로 바닥에 고정됩니다.
            className="min-h-8 max-h-30 min-w-0 flex-1 resize-none border-0 bg-transparent px-0 py-1.75 text-[13px] leading-4.5 text-[#0f172a] shadow-none outline-none focus-visible:ring-0 placeholder:text-[#64748b] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isPending}
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

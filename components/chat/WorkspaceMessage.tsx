"use client";

import { ReactNode } from "react";
import { Copy, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { AI_MODEL } from "@/constants/chat";

export type WorkspaceMessageAuthor = {
  name: string;
  // 아바타에 표시할 글자 (보통 이름 가운데 글자, 예: "이지원" → "지")
  initial: string;
};

type Props =
  | {
      // self: 내가 보낸 메시지, member: 다른 워크스페이스 멤버가 보낸 메시지
      role: "self" | "member";
      author: WorkspaceMessageAuthor;
      timestamp: string;
      content: string;
    }
  | {
      role: "assistant";
      timestamp: string;
      model?: string;
      content: ReactNode;
      commentCount?: number;
      commenters?: WorkspaceMessageAuthor[];
      onClickComments?: () => void;
      isLoading?: boolean;
    };

const handleCopy = async (text: string) => {
  await navigator.clipboard.writeText(text);
  toast.success("복사되었습니다");
};

const ACTION_BUTTON_CLASS =
  "bg-[#f8fafc] text-[#64748b] px-2.5 py-1 rounded-md flex items-center gap-x-1.5 text-xs hover:bg-[#e0e2e5]";

const WorkspaceMessage = (props: Props) => {
  if (props.role === "assistant") {
    const {
      timestamp,
      model,
      content,
      commentCount = 0,
      commenters = [],
      onClickComments,
      isLoading = false,
    } = props;
    const hasComments = commentCount > 0;

    return (
      <div className="flex gap-x-3">
        {/* 왼쪽 — 기존 채팅방(Message.tsx)과 동일한 AI 아바타 */}
        <Avatar className="mt-1 flex items-center justify-center bg-[#6366f1]">
          <AvatarImage
            src="/icon-ai-avatar.png"
            alt="ai avatar"
            className="size-3.5"
          />
        </Avatar>

        {/* 오른쪽 */}
        <div className="space-y-2.5">
          {/* AI info */}
          <div className="flex items-center gap-x-2 py-1.25">
            <span className="text-sm font-bold text-[#0f172a]">
              Threadly AI
            </span>
            {model && (
              <span className="rounded-sm bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-semibold text-[#6366f1]">
                {AI_MODEL.find((m) => m.value === model)?.label ?? model}
              </span>
            )}
            <span className="text-xs text-[#64748b]">{timestamp}</span>
          </div>

          {/* 내용 */}
          {isLoading ? (
            <div className="flex items-center gap-1 py-1">
              <span className="size-1.5 rounded-full bg-[#94a3b8] animate-bounce [animation-delay:-0.3s]" />
              <span className="size-1.5 rounded-full bg-[#94a3b8] animate-bounce [animation-delay:-0.15s]" />
              <span className="size-1.5 rounded-full bg-[#94a3b8] animate-bounce" />
            </div>
          ) : typeof content === "string" ? (
            <p className="text-sm text-[#0f172a]">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none text-[#0f172a] prose-headings:text-[#0f172a] prose-strong:text-[#0f172a]">
              {content}
            </div>
          )}

          {/* 액션 바 */}
          <div className="flex items-center gap-x-2">
            <Button
              className={ACTION_BUTTON_CLASS}
              onClick={() =>
                handleCopy(typeof content === "string" ? content : "")
              }
            >
              <Copy className="size-2.5" />
              내용 복사
            </Button>

            {hasComments ? (
              <Button
                className="flex items-center gap-x-1.5 rounded-md bg-[#e0e7ff] px-2.5 py-1 text-xs text-[#3730a3] hover:bg-[#e0e7ff]/80"
                onClick={onClickComments}
              >
                <MessageSquare className="size-2.5" />
                코멘트 ({commentCount})
                <div className="flex -space-x-1.5 pl-0.5">
                  {commenters.slice(0, 3).map((commenter, index) => (
                    <Avatar
                      key={commenter.name + index}
                      size="sm"
                      className="bg-[#e0e7ff] ring-2 ring-white"
                    >
                      <AvatarFallback className="bg-inherit text-[9px] font-semibold text-[#6366f1]">
                        {commenter.initial}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </Button>
            ) : (
              <Button className={ACTION_BUTTON_CLASS} onClick={onClickComments}>
                <MessageSquare className="size-2.5" />
                코멘트 남기기
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // role: "self" | "member"
  const { role, author, timestamp, content } = props;
  const isSelf = role === "self";

  if (isSelf) {
    return (
      <div className="flex justify-end gap-x-3">
        {/* 왼쪽 — 기존 채팅방과 동일한 내 메시지 말풍선 */}
        <div className="space-y-1.5">
          <div className="text-right">
            <div className="space-x-2 text-xs">
              <span className="text-[#64748b]">{timestamp}</span>
              <span className="font-medium text-[#0f172a]">
                {author.name}
              </span>
            </div>
          </div>

          <div className="rounded-2xl rounded-tr-xs bg-[#6366f1] p-4 pr-6 text-sm text-white drop-shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
            {content}
          </div>
        </div>
        {/* 오른쪽 — 기존 채팅방과 동일한 내 아바타 */}
        <Avatar className="mt-5 bg-primary">
          <AvatarFallback className="bg-inherit text-xs text-white">
            {author.name.slice(-2)}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  }

  // 다른 멤버가 보낸 메시지 — 기존 채팅방엔 없던 역할이라, CreateWorkspaceModal의
  // 초대 멤버 아바타(연한 인디고)와 동일한 톤을 가져와 "나"와 구분되게 했습니다.
  return (
    <div className="flex gap-x-3">
      <Avatar className="mt-5 bg-[#e0e7ff]">
        <AvatarFallback className="bg-inherit text-xs font-semibold text-[#6366f1]">
          {author.initial}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-1.5">
        <div className="space-x-2 text-xs">
          <span className="font-medium text-[#0f172a]">{author.name}</span>
          <span className="text-[#64748b]">{timestamp}</span>
        </div>

        <div className="rounded-2xl rounded-tl-xs bg-[#f1f5f9] p-4 text-sm text-[#0f172a]">
          {content}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceMessage;

// AI 응답에서 "핵심 N가지" 같은 번호 매긴 요약을 보여줄 때 쓰는 보조 컴포넌트입니다.
// WorkspaceMessage의 assistant content 자리에 children으로 넣어 사용하세요.
export const WorkspaceInsightList = ({
  items,
}: {
  items: { title: string; description: string }[];
}) => (
  <div className="flex flex-col gap-2">
    {items.map((item, index) => (
      <div
        key={item.title}
        className="flex gap-2.5 rounded-xl bg-[#f1f5f9] p-3"
      >
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#6366f1]/10 text-[11px] font-bold text-[#6366f1]">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-semibold text-[#0f172a]">
            {item.title}
          </p>
          <p className="text-sm text-[#64748b]">{item.description}</p>
        </div>
      </div>
    ))}
  </div>
);

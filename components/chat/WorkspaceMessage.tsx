"use client";

import { ReactNode } from "react";
import { Copy, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { AI_MODEL, WORKSPACE_POLL_INTERVAL } from "@/constants/chat";
import { getMessageComments } from "@/actions/workspaceComments";
import { cn } from "cn";

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
      // 코멘트 조회/작성 대상 식별용 — DB에 저장된 메시지 id와 항상 같은 값이에요
      // (Chat.tsx가 useChat에 uuid generateId를 넘겨서 보장합니다).
      messageId: string;
      timestamp: string;
      model?: string;
      content: ReactNode;
      onClickComments?: () => void;
      // 이 메시지의 코멘트 패널이 현재 열려있는지 — 열려있으면 버튼을
      // primary 색으로 강조해서 "지금 보고 있는 패널"임을 표시합니다.
      isCommentPanelOpen?: boolean;
      isLoading?: boolean;
    };

const handleCopy = async (text: string) => {
  await navigator.clipboard.writeText(text);
  toast.success("복사되었습니다");
};

const ACTION_BUTTON_CLASS =
  "bg-[#f8fafc] text-[#64748b] px-2.5 py-1 rounded-md flex items-center gap-x-1.5 text-xs hover:bg-[#e0e2e5]";

const WorkspaceMessage = (props: Props) => {
  const isAssistant = props.role === "assistant";
  const messageId = isAssistant ? props.messageId : undefined;
  const isAssistantLoading = isAssistant ? (props.isLoading ?? false) : false;

  // role에 따라 훅 호출 여부가 달라지면 안 되니, early return 전에
  // 무조건 호출하고 enabled로 활성화 여부만 제어합니다. 스트리밍 중인
  // 메시지는 아직 DB에 저장되지 않아서 조회해봐도 항상 없음(에러)이라,
  // 로딩이 끝난 뒤에만 조회합니다.
  const { data: comments = [] } = useQuery({
    queryKey: ["workspace-comments", messageId],
    queryFn: () => getMessageComments(messageId!),
    enabled: isAssistant && !isAssistantLoading,
    refetchInterval: WORKSPACE_POLL_INTERVAL,
  });

  if (props.role === "assistant") {
    const {
      timestamp,
      model,
      content,
      onClickComments,
      isCommentPanelOpen = false,
    } = props;
    const isLoading = isAssistantLoading;

    const commentCount = comments.length;
    const hasComments = commentCount > 0;
    const commenters: WorkspaceMessageAuthor[] = Array.from(
      new Map(comments.map((c) => [c.author.name, c.author])).values(),
    );

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

            <Button
              className={cn(
                "flex items-center gap-x-1.5 rounded-md px-2.5 py-1 text-xs",
                isCommentPanelOpen
                  ? "bg-[#6366f1] text-white"
                  : "bg-[#f8fafc] text-[#3730a3] hover:bg-[#e0e7ff]/80",
              )}
              onClick={onClickComments}
            >
              <MessageSquare className="size-2.5" />
              {hasComments ? `코멘트 (${commentCount})` : "코멘트 남기기"}
              <div className="flex -space-x-1.5 pl-0.5">
                {commenters.slice(0, 3).map((commenter, index) => (
                  <Avatar
                    key={commenter.name + index}
                    className="bg-[#e0e7ff] size-5 ring-1 ring-white"
                  >
                    <AvatarFallback className="bg-inherit text-[8px] font-semibold text-[#464554]">
                      {commenter.initial}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </Button>
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
                {author.name} (나)
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
      <Avatar className="mt-5 bg-[#c9e6ff]">
        <AvatarFallback className="bg-inherit text-xs text-[#464554]">
          {author.initial}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-1.5">
        <div className="space-x-2 text-xs">
          <span className="font-medium text-[#0f172a]">{author.name}</span>
          <span className="text-[#64748b]">{timestamp}</span>
        </div>

        <div className="rounded-2xl rounded-tl-xs bg-[#f2f3ff] p-4 text-sm text-[#0f172a]">
          {content}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceMessage;

"use client";

import Empty from "./Empty";
import Message from "./Message";
import WorkspaceMessage from "./WorkspaceMessage";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useModelStore } from "@/stores/model";
import { useParams, useRouter } from "next/navigation";
import {
  addMessage,
  createConversationWithMessage,
  createWorkspaceConversationWithMessage,
  generateWorkspaceConversationTitle,
  updateLastAssistantMessage,
} from "@/actions/conversations";
import type { UIMessage } from "ai";
import { CHAT_ROUTES, WORKSPACE_ROUTES } from "@/constants/routes";
import { useUserStore } from "@/stores/user";
import toast from "react-hot-toast";
import { ChatUIMessage } from "@/types/chat";
import MessageComposer from "./MessageComposer";
import { ArrowDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  initialMessages?: ChatUIMessage[];
  workspaceId?: string;
  workspaceName?: string;
};

const getTextFromMessage = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

const formatMessageTime = (createdAt?: string) =>
  new Date(createdAt ?? Date.now()).toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });

const Chat = ({ initialMessages, workspaceId, workspaceName }: Props) => {
  const { id } = useParams<{ id?: string }>();
  const router = useRouter();

  const [inputValue, setInputValue] = useState("");
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);
  const isContinuingPendingReplyRef = useRef(false);
  const isRegeneratingRef = useRef(false);
  const hasAutoRegeneratedRef = useRef(false);
  const isNewWorkspaceConversationRef = useRef(false);
  const queryClient = useQueryClient();

  const storeModel = useModelStore((state) => state.model);
  const storeUser = useUserStore((state) => state.user);

  const { messages, sendMessage, regenerate, status } = useChat<ChatUIMessage>({
    messages: initialMessages,
    onFinish: async ({ message, messages: finishedMessages }) => {
      if (!id) return;

      const assistantContent = getTextFromMessage(message);

      const maybeGenerateWorkspaceTitle = async (
        finishedMessages: UIMessage[],
        assistantContent: string,
      ) => {
        if (!isNewWorkspaceConversationRef.current || !id) return;
        isNewWorkspaceConversationRef.current = false;

        const lastUserMessage = [...finishedMessages]
          .reverse()
          .find((m) => m.role === "user");
        const userContent = lastUserMessage
          ? getTextFromMessage(lastUserMessage)
          : "";

        await generateWorkspaceConversationTitle(
          id,
          userContent,
          assistantContent,
          storeModel,
        );
        queryClient.invalidateQueries({ queryKey: ["conversation", id] });
      };

      if (isRegeneratingRef.current) {
        isRegeneratingRef.current = false;
        await updateLastAssistantMessage(
          id,
          assistantContent,
          storeModel,
          workspaceId,
        );
        return;
      }

      if (isContinuingPendingReplyRef.current) {
        isContinuingPendingReplyRef.current = false;
        await addMessage(
          id,
          assistantContent,
          "assistant",
          storeModel,
          workspaceId,
        );
        await maybeGenerateWorkspaceTitle(finishedMessages, assistantContent);
        return;
      }

      const lastUserMessage = [...finishedMessages]
        .reverse()
        .find((m) => m.role === "user");
      const userContent = lastUserMessage
        ? getTextFromMessage(lastUserMessage)
        : "";

      await addMessage(id, userContent, "user", undefined, workspaceId);
      await addMessage(
        id,
        assistantContent,
        "assistant",
        storeModel,
        workspaceId,
      );
    },
  });

  const isBusy =
    isCreatingConversation || status === "submitted" || status === "streaming";

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  const createConversation = workspaceId
    ? (text: string) =>
        createWorkspaceConversationWithMessage(workspaceId, text)
    : createConversationWithMessage;

  const buildConversationHref = (conversationId: string) =>
    workspaceId
      ? WORKSPACE_ROUTES.CONVERSATION(workspaceId, conversationId)
      : `${CHAT_ROUTES.CONVERSATIONS}/${conversationId}`;

  const handleSubmit = async () => {
    const text = inputValue;
    if (!text.trim()) return;
    setInputValue("");

    if (!id) {
      setIsCreatingConversation(true);
      try {
        const conversation = await createConversation(text);
        router.push(buildConversationHref(conversation.id));
      } catch (error) {
        console.error("error:", error);
        toast.error("대화 생성에 실패하였습니다.");
        setInputValue(text);
        setIsCreatingConversation(false);
      }
      return;
    }

    sendMessage({ text }, { body: { model: storeModel } }); // ← 빠졌던 줄 복구
  };

  const isEmpty = !id && messages.length === 0;

  const assistantRegenerate = () => {
    if (!lastAssistantMessage) return;
    isRegeneratingRef.current = true;
    regenerate({
      messageId: lastAssistantMessage.id,
      body: { model: storeModel },
    });
  };

  const onCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("복사되었습니다");
  };

  // 새 대화방으로 이동한 직후, 답변을 못 받은 마지막 유저 메세지가 있으면 이어서 답변받기
  useEffect(() => {
    if (hasAutoRegeneratedRef.current) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "user") {
      hasAutoRegeneratedRef.current = true;
      isContinuingPendingReplyRef.current = true;
      if (workspaceId) {
        isNewWorkspaceConversationRef.current = true;
      }

      regenerate({ body: { model: storeModel } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: isFirstRenderRef.current ? "auto" : "smooth",
    });
    isFirstRenderRef.current = false;
  }, [messages]);

  useEffect(() => {
    const scrollContainer = scrollRef.current?.closest("#home-layout");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const distanceFromBottom =
        scrollContainer.scrollHeight -
        scrollContainer.scrollTop -
        scrollContainer.clientHeight;
      setShowScrollToBottom(distanceFromBottom > 150);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col w-[80%] mx-auto flex-1">
      {isEmpty ? (
        <Empty
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
          disabled={isCreatingConversation}
          workspaceName={workspaceName}
        />
      ) : (
        <>
          {/* 채팅 영역 */}
          <div className="w-full min-h-0 pt-8 pb-30">
            <div className="space-y-7">
              {messages.map((message) => {
                const isLast = message.id === messages[messages.length - 1]?.id;
                const isLoading =
                  isLast &&
                  message.role === "assistant" &&
                  getTextFromMessage(message) === "" &&
                  (status === "submitted" || status === "streaming");

                if (workspaceId) {
                  // 워크스페이스 공유 대화: 현재는 메시지에 작성자(userId)를 저장하지
                  // 않아서, user 메시지는 전부 "나"로 표시합니다(다른 멤버 구분은
                  // message 테이블에 작성자 컬럼이 추가되면 지원 예정).
                  if (message.role === "user") {
                    return (
                      <WorkspaceMessage
                        key={message.id}
                        role="self"
                        author={{
                          name: storeUser.name || "",
                          initial: (storeUser.name || "").slice(-2),
                        }}
                        timestamp={formatMessageTime(
                          message.metadata?.createdAt,
                        )}
                        content={getTextFromMessage(message)}
                      />
                    );
                  }

                  return (
                    <WorkspaceMessage
                      key={message.id}
                      role="assistant"
                      model={message.metadata?.model}
                      timestamp={formatMessageTime(
                        message.metadata?.createdAt,
                      )}
                      isLoading={isLoading}
                      content={
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {getTextFromMessage(message)}
                        </ReactMarkdown>
                      }
                    />
                  );
                }

                return (
                  <Message
                    key={message.id}
                    name={storeUser.name}
                    content={getTextFromMessage(message)}
                    role={message.role as "user" | "assistant"}
                    model={message.metadata?.model}
                    createdAt={message.metadata?.createdAt}
                    isLastAssistant={message.id === lastAssistantMessage?.id}
                    isLoading={isLoading}
                    handleRegenerateButton={assistantRegenerate}
                    handleCopyButton={onCopy}
                  />
                );
              })}
            </div>
            <div ref={scrollRef} />
          </div>

          {/* input 영역 */}
          <div className="sticky bottom-4 mt-auto">
            {/* 블러 배경 레이어 - 폼과 분리된 별도 요소 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 -bottom-4 backdrop-blur-xs [linear-gradient(to_bottom,transparent,black_10%)]" />

            {showScrollToBottom && (
              <button
                type="button"
                onClick={() =>
                  scrollRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                className="absolute left-1/2 -top-12 -translate-x-1/2 flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#64748b] shadow-md hover:bg-[#f8fafc] animate-bounce"
              >
                <ArrowDown className="size-4" />
              </button>
            )}

            <div className="relative">
              <MessageComposer
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSubmit}
                disabled={isBusy}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;

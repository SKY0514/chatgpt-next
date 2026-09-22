"use client";

import Empty from "./Empty";
import Message from "./Message";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useModelStore } from "@/stores/model";
import { useParams, useRouter } from "next/navigation";
import {
  addMessage,
  createConversationWithMessage,
  updateLastAssistantMessage,
} from "@/actions/conversations";
import type { UIMessage } from "ai";
import { CHAT_ROUTES } from "@/constants/routes";
import { useUserStore } from "@/stores/user";
import toast from "react-hot-toast";
import { ChatUIMessage } from "@/types/chat";
import MessageComposer from "./MessageComposer";
import { ArrowDown } from "lucide-react";

type Props = {
  initialMessages?: ChatUIMessage[];
};

const getTextFromMessage = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

const Chat = ({ initialMessages }: Props) => {
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

  const storeModel = useModelStore((state) => state.model);
  const storeUser = useUserStore((state) => state.user);

  const { messages, sendMessage, regenerate, status } = useChat<ChatUIMessage>({
    messages: initialMessages,
    onFinish: async ({ message, messages: finishedMessages }) => {
      if (!id) return;

      const assistantContent = getTextFromMessage(message);

      if (isRegeneratingRef.current) {
        isRegeneratingRef.current = false;
        await updateLastAssistantMessage(id, assistantContent, storeModel);
        return;
      }

      if (isContinuingPendingReplyRef.current) {
        // 이동 전에 사용자 메시지는 이미 저장해뒀으니 답변만 저장
        isContinuingPendingReplyRef.current = false;
        await addMessage(id, assistantContent, "assistant", storeModel);
        return;
      }

      // 기존 대화방에서 계속 대화하는 경우: 유저 메세지 + 답변 저장
      const lastUserMessage = [...finishedMessages]
        .reverse()
        .find((m) => m.role === "user");
      const userContent = lastUserMessage
        ? getTextFromMessage(lastUserMessage)
        : "";

      await addMessage(id, userContent, "user");
      await addMessage(id, assistantContent, "assistant", storeModel);
    },
  });

  const isBusy =
    isCreatingConversation || status === "submitted" || status === "streaming";

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  const handleSubmit = async () => {
    const text = inputValue;
    if (!text.trim()) return;
    setInputValue("");

    // 새로운 대화 일때,
    if (!id) {
      setIsCreatingConversation(true);
      try {
        const conversation = await createConversationWithMessage(text);
        router.push(`${CHAT_ROUTES.CONVERSATIONS}/${conversation.id}`);
      } catch (error) {
        console.error("error:", error);
        toast.error("대화 생성에 실패하였습니다.");
        setInputValue(text);
        setIsCreatingConversation(false);
      }
      return;
    }

    sendMessage({ text }, { body: { model: storeModel } });
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
        />
      ) : (
        <>
          {/* 채팅 영역 */}
          <div className="w-full min-h-0 pt-8 pb-30">
            <div className="space-y-7">
              {messages.map((message) => {
                const isLast = message.id === messages[messages.length - 1]?.id;

                return (
                  <Message
                    key={message.id}
                    name={storeUser.name}
                    content={getTextFromMessage(message)}
                    role={message.role as "user" | "assistant"}
                    model={message.metadata?.model}
                    createdAt={message.metadata?.createdAt}
                    isLastAssistant={message.id === lastAssistantMessage?.id}
                    isLoading={
                      isLast &&
                      message.role === "assistant" &&
                      getTextFromMessage(message) === "" &&
                      (status === "submitted" || status === "streaming")
                    }
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

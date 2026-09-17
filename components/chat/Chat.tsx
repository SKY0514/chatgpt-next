"use client";

import { ArrowUp } from "lucide-react";
import { cn } from "cn";
import { Button } from "../ui/button";
import AutoResizingTextarea from "./AutoResizingTextarea";
import Empty from "./Empty";
import Message from "./Message";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useModelStore } from "@/stores/model";
import { useParams, useRouter } from "next/navigation";
import { addMessage, createConversation } from "@/actions/conversations";
import type { UIMessage } from "ai";
import { CHAT_ROUTES } from "@/constants/routes";
import { useUserStore } from "@/stores/user";
import toast from "react-hot-toast";

type Props = {
  initialMessages?: UIMessage[];
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
  const [isMultiline, setIsMultiline] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);
  const isContinuingPendingReplyRef = useRef(false);
  const hasAutoRegeneratedRef = useRef(false);

  const storeModel = useModelStore((state) => state.model);
  const storeUser = useUserStore((state) => state.user);

  const { messages, sendMessage, regenerate } = useChat({
    messages: initialMessages,
    onFinish: async ({ message, messages: finishedMessages }) => {
      if (!id) return;

      const assistantContent = getTextFromMessage(message);

      if (isContinuingPendingReplyRef.current) {
        // 이동 전에 사용자 메시지는 이미 저장해뒀으니 답변만 저장
        isContinuingPendingReplyRef.current = false;
        await addMessage(id, assistantContent, "assistant");
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
      await addMessage(id, assistantContent, "assistant");
    },
  });

  // 새 대화방으로 이동한 직후, 답변을 못 받은 마지막 유저 메세지가 있으면 이어서 답변받기
  // (StrictMode에서 이 effect가 두 번 실행돼도 한 번만 트리거되도록 ref로 가드)
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

  const handleSubmit = async () => {
    const text = inputValue;
    if (!text.trim()) return;
    setInputValue("");

    if (!id) {
      try {
        const conversation = await createConversation(text);
        await addMessage(conversation.id, text, "user");
        router.push(`${CHAT_ROUTES.CONVERSATIONS}/${conversation.id}`);
      } catch (error) {
        console.error("error:", error);
        toast.error("대화 생성에 실패하였습니다.");
        setInputValue(text);
      }
      return;
    }

    sendMessage({ text }, { body: { model: storeModel } });
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: isFirstRenderRef.current ? "auto" : "smooth",
    });
    isFirstRenderRef.current = false;
  }, [messages]);

  return (
    <div className="flex flex-col w-[80%] h-full mx-auto">
      {/* 채팅 영역 */}
      <div className="flex-1 py-10">
        {!id && messages.length === 0 ? (
          <Empty />
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              name={storeUser.name}
              content={message.parts
                .filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("")}
              role={message.role as "user" | "assistant"}
            />
          ))
        )}
      </div>

      {/* input 영역 */}
      <div className="pb-5 sticky bottom-0 bg-white">
        <form
          className={cn(
            "flex gap-x-4 border px-2 py-[9px] rounded-xl",
            isMultiline ? "items-end flex-col" : "items-center",
          )}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <AutoResizingTextarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onMultilineChange={setIsMultiline}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button type="submit" size="icon">
            <ArrowUp />
          </Button>
        </form>
      </div>
      <div ref={scrollRef} />
    </div>
  );
};

export default Chat;

"use client";

import Empty from "./Empty";
import Message from "./Message";
import WorkspaceMessage from "./WorkspaceMessage";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useModelStore } from "@/stores/model";
import {
  useWorkspaceCommentPanelStore,
  workspaceMessageElementId,
} from "@/stores/workspaceCommentPanel";
import { useParams, useRouter } from "next/navigation";
import {
  addMessage,
  createConversationWithMessage,
  createWorkspaceConversationWithMessage,
  generateWorkspaceConversationTitle,
  getConversationMessages,
  notifyPendingMessage,
  updateLastAssistantMessage,
} from "@/actions/conversations";
import type { UIMessage } from "ai";
import { CHAT_ROUTES, WORKSPACE_ROUTES } from "@/constants/routes";
import { useUserStore } from "@/stores/user";
import toast from "react-hot-toast";
import { ChatUIMessage } from "@/types/chat";
import MessageComposer from "./MessageComposer";
import { ArrowDown } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatMessageTime } from "@/utils";
import { WORKSPACE_POLL_INTERVAL } from "@/constants/chat";
import pusherClient from "@/lib/pusherClient";
import { PUSHER_EVENTS, workspaceConversationChannel } from "@/constants/pusher";

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

const Chat = ({ initialMessages, workspaceId, workspaceName }: Props) => {
  const { id } = useParams<{ id?: string }>();
  const router = useRouter();

  const [inputValue, setInputValue] = useState("");
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  // 다른 멤버가 막 보낸 질문을 AI 응답이 끝나기 전에 먼저 보여주기 위한
  // 임시 표시용 상태 — 실제 메시지(new-message)가 도착하면 비웁니다.
  const [pendingRemoteMessages, setPendingRemoteMessages] = useState<
    { authorId: string; authorName: string; content: string }[]
  >([]);

  // 코멘트 패널 — 헤더까지 함께 좁혀야 해서 레이아웃(HomeLayoutContent)과
  // 공유하는 전역 상태로 관리합니다.
  const openCommentMessageId = useWorkspaceCommentPanelStore(
    (state) => state.openComment?.messageId,
  );
  const highlightedMessageId = useWorkspaceCommentPanelStore(
    (state) => state.highlightedMessageId,
  );
  const toggleCommentPanel = useWorkspaceCommentPanelStore(
    (state) => state.toggle,
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);
  const isContinuingPendingReplyRef = useRef(false);
  const isRegeneratingRef = useRef(false);
  const hasAutoRegeneratedRef = useRef(false);
  const isNewWorkspaceConversationRef = useRef(false);
  const queryClient = useQueryClient();

  const storeModel = useModelStore((state) => state.model);
  const storeUser = useUserStore((state) => state.user);

  // 대화 도중 다른 멤버가 이 대화방을 삭제했을 때 — Pusher 이벤트(즉시)와
  // 메시지 저장 실패(안전망) 양쪽에서 같은 방식으로 내보냅니다. useCallback으로
  // 감싸서 아래 Pusher 구독 effect가 매 렌더마다 재구독하지 않게 합니다.
  const handleConversationDeleted = useCallback(() => {
    toast.error("대화방이 삭제되었습니다.");
    if (!workspaceId) return;
    router.push(WORKSPACE_ROUTES.NEW(workspaceId));
    // push만 하면 사이드바(Sidebar.tsx, 서버 컴포넌트)가 라우터 캐시에 남은
    // 이전 목록을 그대로 보여줄 수 있어서, refresh로 서버 데이터를 다시
    // 가져오게 합니다 — 지운 사람 화면에선 바로 빠지는데 나는 안 빠지던
    // 문제가 이것 때문이었어요.
    router.refresh();
  }, [workspaceId, router]);

  const handleFinishedMessage = async (
    message: ChatUIMessage,
    finishedMessages: UIMessage[],
  ) => {
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
        // isNewWorkspaceConversationRef는 workspaceId가 있을 때만 true로
        // 설정돼요(아래 useEffect 참고) — 이 분기에 왔다면 항상 존재합니다.
        workspaceId!,
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
        message.id,
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

    await addMessage(
      id,
      userContent,
      "user",
      undefined,
      workspaceId,
      lastUserMessage?.id,
    );
    await addMessage(
      id,
      assistantContent,
      "assistant",
      storeModel,
      workspaceId,
      message.id,
    );
  };

  const { messages, sendMessage, regenerate, status, setMessages } = useChat<ChatUIMessage>({
    messages: initialMessages,
    // 메시지 id를 DB에도 그대로 저장할 수 있는 형식(uuid)으로 맞춥니다 —
    // 코멘트가 messageId로 메시지를 참조하는데, 새로고침 전/후로 id가
    // 달라지면 방금 스트리밍된 메시지에 코멘트를 남길 수 없게 됩니다.
    generateId: () => crypto.randomUUID(),
    onFinish: async ({ message, messages: finishedMessages }) => {
      if (!id) return;

      try {
        await handleFinishedMessage(message, finishedMessages);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "대화방이 삭제되었습니다."
        ) {
          handleConversationDeleted();
          return;
        }
        console.error("error:", error);
        toast.error("메시지 저장에 실패하였습니다.");
      }
    },
  });

  // 워크스페이스 공유 대화에선 다른 멤버가 보낸 메시지가 이 브라우저의
  // useChat 상태엔 전혀 없어서(각자 따로 들고 있는 로컬 상태), 주기적으로
  // DB를 다시 읽어와 로컬에 없는 메시지만 합쳐줍니다.
  const { data: remoteMessages } = useQuery({
    queryKey: ["conversation-messages", id],
    queryFn: () => getConversationMessages(id!),
    enabled: !!workspaceId && !!id,
    refetchInterval: WORKSPACE_POLL_INTERVAL,
  });

  useEffect(() => {
    if (!remoteMessages) return;

    setMessages((current) => {
      const currentById = new Map(current.map((m) => [m.id, m]));
      const remoteIds = new Set(remoteMessages.map((m) => m.id));

      const hasNewRemote = remoteMessages.some((m) => !currentById.has(m.id));
      if (!hasNewRemote) return current;

      // remote(DB, 시간순 정답)를 뼈대로 쓰되, 이미 로컬에 있는 메시지는
      // 그대로 로컬 버전을 씁니다 — 지금 스트리밍/재생성 중인 최신 내용을
      // 오래된 remote 내용으로 덮어쓰지 않기 위해서예요. 아직 DB에 없는
      // 로컬 전용 메시지(막 보낸 응답 등)는 remote보다 최신이니 맨 뒤에
      // 그대로 둡니다.
      const merged = remoteMessages.map((m) => currentById.get(m.id) ?? m);
      const localOnly = current.filter((m) => !remoteIds.has(m.id));

      return [...merged, ...localOnly];
    });
  }, [remoteMessages, setMessages]);

  // storeUser.id는 마운트 직후 ""에서 실제 값으로 한 번 바뀌고,
  // handleConversationDeleted도 참조가 바뀔 수 있어요 — 이걸 그대로
  // effect의 deps에 넣으면 그때마다 구독을 끊고 다시 맺는데, pusher-js가
  // 그 사이에 이전 바인딩을 완전히 정리하지 못해 이벤트가 두 번씩
  // 들어오는 문제가 있었습니다. ref로 최신값만 읽도록 바꿔서, 이 대화방에
  // 들어온 뒤로는 구독을 딱 한 번만 맺습니다.
  const storeUserIdRef = useRef(storeUser.id);
  useEffect(() => {
    storeUserIdRef.current = storeUser.id;
  }, [storeUser.id]);

  const handleConversationDeletedRef = useRef(handleConversationDeleted);
  useEffect(() => {
    handleConversationDeletedRef.current = handleConversationDeleted;
  }, [handleConversationDeleted]);

  // Pusher로 "이 대화방에 새 메시지/코멘트가 생겼다"는 신호를 받으면, 위
  // 폴링 쿼리와 코멘트 쿼리를 즉시 다시 읽어오게 합니다. 폴링의 refetchInterval은
  // 이 이벤트를 놓쳤을 때를 대비한 느슨한 안전망으로만 남겨뒀어요.
  useEffect(() => {
    if (!workspaceId || !id) return;

    const channel = pusherClient.subscribe(workspaceConversationChannel(id));

    channel.bind(PUSHER_EVENTS.NEW_MESSAGE, () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", id] });
      // 실제 메시지가 도착했으니, 그 전까지 보여주던 임시 표시는 치웁니다.
      setPendingRemoteMessages([]);
    });
    channel.bind(PUSHER_EVENTS.NEW_COMMENT, (data: { messageId: string }) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-comments", data.messageId],
      });
    });
    channel.bind(
      PUSHER_EVENTS.PENDING_MESSAGE,
      (data: { authorId: string; authorName: string; content: string }) => {
        // 내가 보낸 메시지는 이미 내 화면에 바로 보이니 중복으로 또 띄우지 않습니다.
        if (data.authorId === storeUserIdRef.current) return;
        setPendingRemoteMessages((prev) => [...prev, data]);
      },
    );
    // 다른 멤버가 이 대화방을 삭제했을 때 — 새로고침 없이 바로 내보냅니다.
    channel.bind(PUSHER_EVENTS.CONVERSATION_DELETED, () => {
      handleConversationDeletedRef.current();
    });

    return () => {
      // 혹시라도 구독 해제 전에 바인딩이 그대로 남아있을 가능성을 없애기
      // 위해, 채널을 끊기 전에 이 채널에 걸어둔 바인딩을 먼저 전부 지웁니다.
      channel.unbind_all();
      pusherClient.unsubscribe(workspaceConversationChannel(id));
    };
  }, [workspaceId, id, queryClient]);

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

    // AI 응답이 끝나야 저장/발행되는 new-message와 별개로, 질문이 왔다는
    // 것만 먼저 다른 멤버들에게 알려줍니다. 실패해도 치명적이지 않고,
    // 내 전송 자체를 늦출 이유도 없어서 기다리지 않습니다.
    if (workspaceId) {
      notifyPendingMessage(id, text).catch((error) => {
        console.error("error:", error);
      });
    }
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
  }, [messages, pendingRemoteMessages]);

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
                  if (message.role === "user") {
                    // 방금 이 브라우저에서 보낸 메시지는 아직 서버 메타데이터가
                    // 없어서(스트리밍 중) authorId가 비어있는데, 그 경우는
                    // 당연히 지금 보고 있는 나 자신이 보낸 메시지입니다.
                    const authorId = message.metadata?.authorId ?? storeUser.id;
                    const authorName =
                      message.metadata?.authorName ?? storeUser.name ?? "";
                    const isSelf = authorId === storeUser.id;

                    return (
                      <WorkspaceMessage
                        key={message.id}
                        role={isSelf ? "self" : "member"}
                        author={{
                          name: authorName,
                          initial: authorName.slice(-2),
                        }}
                        timestamp={formatMessageTime(
                          message.metadata?.createdAt,
                        )}
                        content={getTextFromMessage(message)}
                      />
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      id={workspaceMessageElementId(message.id)}
                      className={`-mx-3 rounded-2xl p-3 transition-colors duration-700 ${
                        highlightedMessageId === message.id
                          ? "bg-[#eef2ff] ring-2 ring-[#c7d2fe]"
                          : "ring-2 ring-transparent"
                      }`}
                    >
                      <WorkspaceMessage
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
                        messageId={message.id}
                        isCommentPanelOpen={openCommentMessageId === message.id}
                        onClickComments={() =>
                          toggleCommentPanel({
                            messageId: message.id,
                            answerSummary: getTextFromMessage(message),
                          })
                        }
                      />
                    </div>
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

              {/* AI가 아직 답변을 다 쓰지 않아서 DB에 없는, 다른 멤버가 막
                  보낸 질문을 먼저 보여줍니다 — 실제 메시지가 도착하면 사라져요. */}
              {pendingRemoteMessages.map((pending, index) => (
                <WorkspaceMessage
                  key={`pending-${index}`}
                  role="member"
                  author={{
                    name: pending.authorName,
                    initial: pending.authorName.slice(-2),
                  }}
                  timestamp={formatMessageTime()}
                  content={pending.content}
                />
              ))}
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

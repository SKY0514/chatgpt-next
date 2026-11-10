import { UIMessage } from "ai";

export type ChatMessageMetadata = {
  model?: string;
  createdAt: string;
  // role이 "user"인 메시지의 실제 작성자 — 워크스페이스 공유 대화에서
  // "나"인지 다른 멤버인지 구분하는 데 씁니다. assistant 메시지엔 없음.
  authorId?: string;
  authorName?: string;
};

export type ChatUIMessage = UIMessage<ChatMessageMetadata>;

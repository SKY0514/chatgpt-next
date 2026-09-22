import { UIMessage } from "ai";

export type ChatMessageMetadata = {
  model?: string;
  createdAt: string;
};

export type ChatUIMessage = UIMessage<ChatMessageMetadata>;

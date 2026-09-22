import db from "@/db";
import type { ChatUIMessage } from "@/types/chat";

export const getConversationById = async (id: string) => {
  const response = await db.query.conversation.findFirst({
    where: { id },
  });

  return response ?? null;
};

export const getMessagesByConversation = async (id: string) => {
  const response = await db.query.conversation.findFirst({
    where: { id },
    with: {
      messages: {
        orderBy: (message, { asc }) => [asc(message.createdAt)],
      },
    },
  });

  return (response?.messages || []).map(
    (message): ChatUIMessage => ({
      id: message.id,
      role: message.role ?? "user",
      metadata: {
        model: message.model ?? undefined,
        createdAt: message.createdAt.toISOString(),
      },
      parts: [{ type: "text", text: message.content ?? "" }],
    }),
  );
};

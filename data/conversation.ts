import { message } from "./../db/schema";
import db from "@/db";
import { UIMessage } from "ai";

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
    (message): UIMessage => ({
      id: message.id,
      role: message.role ?? "user",
      parts: [{ type: "text", text: message.content ?? "" }],
    }),
  );
};

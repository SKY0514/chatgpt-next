"use server";

import { verifySession } from "./sessions";
import { conversation, message } from "@/db/schema";
import db from "@/db";
import { revalidatePath } from "next/cache";
import { BASE_URL, CHAT_ROUTES } from "@/constants/routes";
import { eq } from "drizzle-orm";
import { getConversationById } from "@/data/conversation";

export const getConversation = async (id: string) => {
  return getConversationById(id);
};

export const addMessage = async (
  conversationId: string,
  content: string,
  role: "user" | "assistant",
  model?: string,
) => {
  await db.insert(message).values({
    conversationId,
    content,
    role,
    model: role === "assistant" ? model : undefined,
  });

  revalidatePath(`${CHAT_ROUTES.CONVERSATIONS}/${conversationId}`);
};

// 대화방의 가장 최근 assistant 메시지를 새 내용으로 덮어씁니다 ("다시 생성" 용도).
export const updateLastAssistantMessage = async (
  conversationId: string,
  content: string,
  model?: string,
) => {
  const [latest] = await db.query.message.findMany({
    where: { conversationId, role: "assistant" },
    orderBy: (message, { desc }) => [desc(message.createdAt)],
    limit: 1,
  });

  if (!latest) return;

  await db
    .update(message)
    .set({ content, model, updatedAt: new Date() })
    .where(eq(message.id, latest.id));

  revalidatePath(`${CHAT_ROUTES.CONVERSATIONS}/${conversationId}`);
};

export const createConversationWithMessage = async (content: string) => {
  const session = await verifySession();

  const result = await db
    .insert(conversation)
    .values({
      name: content,
      userId: session.id,
    })
    .returning();

  const newConversation = result[0];

  await db.insert(message).values({
    conversationId: newConversation.id,
    content,
    role: "user",
  });

  revalidatePath(BASE_URL);
  revalidatePath(`${CHAT_ROUTES.CONVERSATIONS}/${newConversation.id}`);

  return newConversation;
};

export const updateConversation = async (id: string, name: string) => {
  await db
    .update(conversation)
    .set({ name, updatedAt: new Date() })
    .where(eq(conversation.id, id));

  revalidatePath(BASE_URL);
};

export const deleteConversation = async (id: string) => {
  await db.delete(conversation).where(eq(conversation.id, id));
  revalidatePath(BASE_URL);
};

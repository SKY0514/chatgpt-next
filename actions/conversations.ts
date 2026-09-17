"use server";

import { verifySession } from "./sessions";
import { conversation, message } from "@/db/schema";
import db from "@/db";
import { revalidatePath } from "next/cache";
import { BASE_URL, CHAT_ROUTES } from "@/constants/routes";
import { eq } from "drizzle-orm";

export const addMessage = async (
  conversationId: string,
  content: string,
  role: "user" | "assistant",
) => {
  await db.insert(message).values({
    conversationId,
    content,
    role,
  });

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

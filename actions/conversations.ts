"use server";

import { verifySession } from "./sessions";
import { conversation, message } from "@/db/schema";
import db from "@/db";
import { revalidatePath } from "next/cache";
import { BASE_URL, CHAT_ROUTES, WORKSPACE_ROUTES } from "@/constants/routes";
import { eq } from "drizzle-orm";
import { getConversationById } from "@/data/conversation";
import { getWorkspaceMembership } from "@/data/workspace";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const getConversation = async (id: string) => {
  return getConversationById(id);
};

// workspaceId를 넘기면 팀 공유 대화 경로(/w/[workspaceId]/c/[id])를,
// 넘기지 않으면 개인 대화 경로(/c/[id])를 재검증합니다.
const getConversationPath = (conversationId: string, workspaceId?: string) =>
  workspaceId
    ? WORKSPACE_ROUTES.CONVERSATION(workspaceId, conversationId)
    : `${CHAT_ROUTES.CONVERSATIONS}/${conversationId}`;

export const addMessage = async (
  conversationId: string,
  content: string,
  role: "user" | "assistant",
  model?: string,
  workspaceId?: string,
) => {
  await db.insert(message).values({
    conversationId,
    content,
    role,
    model: role === "assistant" ? model : undefined,
  });

  revalidatePath(getConversationPath(conversationId, workspaceId));
};

// 대화방의 가장 최근 assistant 메시지를 새 내용으로 덮어씁니다 ("다시 생성" 용도).
export const updateLastAssistantMessage = async (
  conversationId: string,
  content: string,
  model?: string,
  workspaceId?: string,
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

  revalidatePath(getConversationPath(conversationId, workspaceId));
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

// 워크스페이스 멤버만 팀 공유 대화를 생성할 수 있습니다. 개인 대화와 동일하게
// 첫 메시지와 함께 생성되며(바로 빈 대화방을 만들지 않음), 이름은 비워두고
// 첫 응답이 끝난 뒤 generateWorkspaceConversationTitle로 채웁니다.
export const createWorkspaceConversationWithMessage = async (
  workspaceId: string,
  content: string,
) => {
  const session = await verifySession();

  const membership = await getWorkspaceMembership(workspaceId);

  if (!membership) {
    throw new Error("워크스페이스 멤버만 대화를 생성할 수 있습니다.");
  }

  const [newConversation] = await db
    .insert(conversation)
    .values({ userId: session.id, workspaceId })
    .returning();

  await db.insert(message).values({
    conversationId: newConversation.id,
    content,
    role: "user",
  });

  revalidatePath(BASE_URL);
  revalidatePath(WORKSPACE_ROUTES.CONVERSATION(workspaceId, newConversation.id));

  return newConversation;
};

// 팀 공유 대화의 첫 질문/답변이 끝나면 호출합니다. 15자 이내 제목을 요청해
// 대화명으로 저장합니다 (실패해도 대화 자체는 그대로 유지). model은 하드코딩하지
// 않고 방금 응답을 생성하는 데 실제로 쓰인 모델을 그대로 넘겨받습니다 — 특정
// 모델이 deprecated되어도 이 함수만 따로 깨지는 일이 없도록 하기 위함입니다.
export const generateWorkspaceConversationTitle = async (
  conversationId: string,
  userContent: string,
  assistantContent: string,
  model: string,
) => {
  await verifySession();

  const { text } = await generateText({
    model: openai(model),
    prompt: [
      "다음은 팀 워크스페이스 공유 대화의 첫 질문과 답변입니다.",
      "이 대화의 제목을 15자 이내의 한국어 명사구로 간결하게 지어주세요.",
      "따옴표나 마침표 없이 제목 텍스트만 출력하세요.",
      "",
      `질문: ${userContent}`,
      `답변: ${assistantContent}`,
    ].join("\n"),
  });

  const title = text.trim().replace(/^["'.]+|["'.]+$/g, "").slice(0, 30);
  if (!title) return;

  await db
    .update(conversation)
    .set({ name: title, updatedAt: new Date() })
    .where(eq(conversation.id, conversationId));

  revalidatePath(BASE_URL);
};

// 이름 변경/삭제 권한 규칙:
// - 개인 대화: 만든 본인만 가능
// - 워크스페이스 공유 대화: 워크스페이스 오너는 전부 가능, 멤버는 본인이 만든 것만 가능
// UI(WorkSpaceItem의 ⋮ 메뉴)에서도 똑같은 규칙으로 숨기지만, 그건 보기 좋으라고
// 가려두는 것일 뿐 — 실제 권한 검증은 항상 여기, 서버에서 해야 합니다.
const assertCanManageConversation = async (conversationId: string) => {
  const session = await verifySession();

  const target = await db.query.conversation.findFirst({
    where: { id: conversationId },
  });

  if (!target) {
    throw new Error("대화를 찾을 수 없습니다.");
  }

  if (!target.workspaceId) {
    if (target.userId !== session.id) {
      throw new Error("본인이 만든 대화만 수정/삭제할 수 있습니다.");
    }
    return;
  }

  const membership = await getWorkspaceMembership(target.workspaceId);
  const isOwner = membership?.role === "owner";
  const isCreator = target.userId === session.id;

  if (!isOwner && !isCreator) {
    throw new Error("이 대화를 수정/삭제할 권한이 없습니다.");
  }
};

export const updateConversation = async (id: string, name: string) => {
  await assertCanManageConversation(id);

  await db
    .update(conversation)
    .set({ name, updatedAt: new Date() })
    .where(eq(conversation.id, id));

  revalidatePath(BASE_URL);
};

export const deleteConversation = async (id: string) => {
  await assertCanManageConversation(id);

  await db.delete(conversation).where(eq(conversation.id, id));
  revalidatePath(BASE_URL);
};

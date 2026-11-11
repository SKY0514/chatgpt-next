"use server";

import { verifySession } from "./sessions";
import { workspaceComment } from "@/db/schema";
import db from "@/db";
import { getWorkspaceMembership } from "@/data/workspace";
import pusherServer from "@/lib/pusher";
import { PUSHER_EVENTS, workspaceConversationChannel } from "@/constants/pusher";

export type WorkspaceMessageComment = {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; initial: string };
  isSelf: boolean;
};

// 해당 메시지가 워크스페이스 공유 대화에 속해있는지 + 요청자가 그 워크스페이스
// 멤버인지를 함께 확인합니다. 아니면 null — 개인 대화 메시지엔 코멘트 기능이
// 없고, 멤버가 아니면 남/조회 둘 다 막습니다.
const assertCommentableMessage = async (messageId: string) => {
  const target = await db.query.message.findFirst({
    where: { id: messageId },
    with: { conversation: true },
  });

  // 메시지 자체가 없으면(대화방이 삭제돼 cascade로 함께 지워진 경우 포함)
  // "워크스페이스 메시지가 아니다"와는 다른 원인이라 구분해서 던집니다 —
  // 클라이언트가 이 경우만 알럿+리다이렉트로 다르게 처리할 수 있게요.
  if (!target) {
    throw new Error("대화방이 삭제되었습니다.");
  }

  if (!target.conversation?.workspaceId) {
    throw new Error("워크스페이스 대화의 메시지에만 코멘트를 남길 수 있습니다.");
  }

  const membership = await getWorkspaceMembership(target.conversation.workspaceId);
  if (!membership) {
    throw new Error("워크스페이스 멤버만 코멘트를 남길 수 있습니다.");
  }

  return target;
};

export const getMessageComments = async (
  messageId: string,
): Promise<WorkspaceMessageComment[]> => {
  const session = await verifySession();
  await assertCommentableMessage(messageId);

  const comments = await db.query.workspaceComment.findMany({
    where: { messageId },
    with: { user: true },
    orderBy: (comment, { asc }) => [asc(comment.createdAt)],
  });

  return comments.map((comment) => ({
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: {
      name: comment.user.name,
      initial: comment.user.name.slice(-2),
    },
    isSelf: comment.userId === session.id,
  }));
};

export const addWorkspaceComment = async (messageId: string, content: string) => {
  const session = await verifySession();

  if (!content.trim()) {
    throw new Error("코멘트 내용을 입력해주세요.");
  }

  const target = await assertCommentableMessage(messageId);

  await db.insert(workspaceComment).values({
    messageId,
    userId: session.id,
    content: content.trim(),
  });

  // assertCommentableMessage가 이미 workspaceId 존재를 확인했으니(없으면
  // 위에서 throw) conversation은 항상 있습니다.
  await pusherServer.trigger(
    workspaceConversationChannel(target.conversation!.id),
    PUSHER_EVENTS.NEW_COMMENT,
    { messageId },
  );
};

import { verifySession } from "@/actions/sessions";
import db from "@/db";

export const getWorkspacesByUser = async () => {
  const session = await verifySession();

  const memberships = await db.query.workspaceMember.findMany({
    where: { userId: session.id },
    with: { workspace: true },
    orderBy: (workspaceMember, { desc }) => [desc(workspaceMember.createdAt)],
  });

  return memberships.map((membership) => ({
    ...membership.workspace,
    role: membership.role,
  }));
};

// 현재 로그인한 사용자가 해당 워크스페이스의 멤버인지 확인합니다.
// 멤버가 아니면 null — 팀 공유 대화 생성/조회 권한 검증에 공용으로 사용합니다.
export const getWorkspaceMembership = async (workspaceId: string) => {
  const session = await verifySession();

  return db.query.workspaceMember.findFirst({
    where: { workspaceId, userId: session.id },
    with: { workspace: true },
  });
};

export const getConversationsByWorkspace = async (workspaceId: string) => {
  return db.query.conversation.findMany({
    where: { workspaceId },
    orderBy: (conversation, { desc }) => [desc(conversation.updatedAt)],
  });
};

// /w/[workspaceId]/c/[id] 페이지 진입 시 사용: 멤버십 + 해당 대화가 실제로
// 이 워크스페이스 소속인지를 함께 확인합니다. 멤버가 아니거나, 대화가 다른
// 워크스페이스(또는 개인) 소유면 null을 반환합니다 — 호출부에서 notFound() 처리하세요.
export const getWorkspaceConversation = async (
  workspaceId: string,
  conversationId: string,
) => {
  const membership = await getWorkspaceMembership(workspaceId);
  if (!membership) return null;

  const conversation = await db.query.conversation.findFirst({
    where: { id: conversationId, workspaceId },
  });

  return conversation ?? null;
};

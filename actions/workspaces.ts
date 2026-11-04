"use server";

import { randomBytes } from "crypto";
import { verifySession } from "./sessions";
import { workspace, workspaceMember } from "@/db/schema";
import db from "@/db";
import { getUserByEmail } from "@/data/user";
import { getWorkspaceMembership } from "@/data/workspace";
import { revalidatePath } from "next/cache";
import { BASE_URL, WORKSPACE_ROUTES } from "@/constants/routes";
import { eq, and } from "drizzle-orm";

// 초대 링크(/invite/[token])용 토큰. 링크 소지자는 누구나 합류할 수 있는
// 구조라 추측하기 어렵도록 128비트(22자, URL-safe) 랜덤 문자열을 씁니다.
const generateInviteToken = () => randomBytes(16).toString("base64url");

export const createWorkspace = async (name: string) => {
  const session = await verifySession();

  if (!name.trim()) {
    throw new Error("워크스페이스 이름을 입력해주세요.");
  }

  const [newWorkspace] = await db
    .insert(workspace)
    .values({ name: name.trim(), ownerId: session.id, inviteToken: generateInviteToken() })
    .returning();

  await db.insert(workspaceMember).values({
    workspaceId: newWorkspace.id,
    userId: session.id,
    role: "owner",
  });

  revalidatePath(BASE_URL);

  return newWorkspace;
};

export const renameWorkspace = async (workspaceId: string, name: string) => {
  const membership = await getWorkspaceMembership(workspaceId);

  if (!membership || membership.role !== "owner") {
    throw new Error("워크스페이스 오너만 이름을 변경할 수 있습니다.");
  }

  if (!name.trim()) {
    throw new Error("워크스페이스 이름을 입력해주세요.");
  }

  await db
    .update(workspace)
    .set({ name: name.trim(), updatedAt: new Date() })
    .where(eq(workspace.id, workspaceId));

  revalidatePath(BASE_URL);
};

type AddMemberResult =
  | { status: "added"; member: { id: string; name: string } }
  | { status: "already-member" }
  | { status: "pending" };

// 워크스페이스 생성 모달의 "추가" 버튼에서 호출합니다. 가입된 이메일이면
// 즉시 멤버로 등록(role: member 고정), 미가입 이메일이면 아무것도 저장하지
// 않고 "pending"만 돌려줍니다 — 그 경우 호출부가 초대 링크를 안내합니다.
export const addWorkspaceMemberByEmail = async (
  workspaceId: string,
  email: string,
): Promise<AddMemberResult> => {
  const membership = await getWorkspaceMembership(workspaceId);

  if (!membership || membership.role !== "owner") {
    throw new Error("워크스페이스 오너만 멤버를 추가할 수 있습니다.");
  }

  const invitedUser = await getUserByEmail(email);

  if (!invitedUser) {
    return { status: "pending" };
  }

  const existingMembership = await db.query.workspaceMember.findFirst({
    where: { workspaceId, userId: invitedUser.id },
  });

  if (existingMembership) {
    return { status: "already-member" };
  }

  // 위에서 이미 "있으면" 걸러냈지만, 동시에 두 번 눌렸을 가능성까지 막기
  // 위해 DB 유니크 제약(workspace_member_workspace_user_key)에 기대어
  // onConflictDoNothing으로도 한 번 더 막습니다 — 그 경우 insert 결과가
  // 비어있을 수 있어 아래에서 다시 조회합니다.
  const [newMember] = await db
    .insert(workspaceMember)
    .values({ workspaceId, userId: invitedUser.id, role: "member" })
    .onConflictDoNothing({
      target: [workspaceMember.workspaceId, workspaceMember.userId],
    })
    .returning();

  if (!newMember) {
    return { status: "already-member" };
  }

  revalidatePath(BASE_URL);

  return { status: "added", member: { id: newMember.id, name: invitedUser.name } };
};

// 오너만 멤버를 제거할 수 있고, 오너 본인(role: owner)은 이 경로로 제거할 수
// 없습니다 — UI에서도 오너 칩엔 제거 버튼을 안 보여주지만, 서버에서도 막습니다.
export const removeWorkspaceMember = async (
  workspaceId: string,
  memberId: string,
) => {
  const membership = await getWorkspaceMembership(workspaceId);

  if (!membership || membership.role !== "owner") {
    throw new Error("워크스페이스 오너만 멤버를 제거할 수 있습니다.");
  }

  const target = await db.query.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
  });

  if (!target) return;

  if (target.role === "owner") {
    throw new Error("오너는 제거할 수 없습니다.");
  }

  await db
    .delete(workspaceMember)
    .where(and(eq(workspaceMember.id, memberId), eq(workspaceMember.workspaceId, workspaceId)));

  revalidatePath(BASE_URL);
};

// 워크스페이스 전용 헤더(WorkspaceConversationHeader)용 — 워크스페이스 이름과
// 멤버 목록(아바타 스택 표시용)을 함께 내려줍니다. 멤버가 아니면 null.
export const getWorkspaceHeaderInfo = async (workspaceId: string) => {
  const membership = await getWorkspaceMembership(workspaceId);
  if (!membership) return null;

  const members = await db.query.workspaceMember.findMany({
    where: { workspaceId },
    with: { user: true },
  });

  return {
    workspaceName: membership.workspace.name,
    members: members
      .filter((member) => member.user !== null)
      .map((member) => ({ name: member.user!.name })),
  };
};

// 초대 링크(/invite/[token]) 접속 시 호출합니다. 토큰에 맞는 워크스페이스가
// 없으면 null, 이미 멤버면 가입 없이 그 워크스페이스로, 아니면 멤버로
// 등록한 뒤 그 워크스페이스로 보냅니다.
export const joinWorkspaceByInviteToken = async (token: string) => {
  const session = await verifySession();

  const targetWorkspace = await db.query.workspace.findFirst({
    where: { inviteToken: token },
  });

  if (!targetWorkspace) return null;

  const membership = await db.query.workspaceMember.findFirst({
    where: { workspaceId: targetWorkspace.id, userId: session.id },
  });

  if (!membership) {
    // 동시에 같은 링크로 두 번 들어와도(예: 더블클릭, 새로고침) 에러 없이
    // 조용히 넘어가도록 onConflictDoNothing을 씁니다.
    await db
      .insert(workspaceMember)
      .values({
        workspaceId: targetWorkspace.id,
        userId: session.id,
        role: "member",
      })
      .onConflictDoNothing({
        target: [workspaceMember.workspaceId, workspaceMember.userId],
      });
    // revalidatePath는 여기서 쓸 수 없어요 — 이 함수가 /invite/[token]
    // 페이지의 렌더링 도중(클라이언트 액션이 아니라) 바로 호출되는데,
    // revalidatePath는 그런 "렌더링 중" 호출을 허용하지 않습니다. 대신
    // 이 함수를 호출한 쪽에서 곧바로 새 워크스페이스(아직 이 세션에서
    // 한 번도 방문한 적 없는 경로)로 redirect()하므로, 그 페이지는 항상
    // 최신 데이터로 새로 렌더링됩니다 — 그래서 없어도 괜찮습니다.
  }

  return { workspaceId: targetWorkspace.id };
};

// 오너만 초대 링크를 재발급할 수 있습니다 — 링크가 유출됐을 때 이전 링크를
// 무효화하는 용도입니다.
export const regenerateWorkspaceInviteToken = async (workspaceId: string) => {
  const membership = await getWorkspaceMembership(workspaceId);

  if (!membership || membership.role !== "owner") {
    throw new Error("워크스페이스 오너만 초대 링크를 재발급할 수 있습니다.");
  }

  const newToken = generateInviteToken();

  await db
    .update(workspace)
    .set({ inviteToken: newToken, updatedAt: new Date() })
    .where(eq(workspace.id, workspaceId));

  revalidatePath(WORKSPACE_ROUTES.NEW(workspaceId));

  return newToken;
};

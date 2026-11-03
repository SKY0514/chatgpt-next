"use server";

import { randomUUID } from "crypto";
import { verifySession } from "./sessions";
import { workspace, workspaceMember, workspaceInvite } from "@/db/schema";
import db from "@/db";
import { getUserByEmail } from "@/data/user";
import { getWorkspaceMembership } from "@/data/workspace";
import { revalidatePath } from "next/cache";
import { BASE_URL } from "@/constants/routes";
import { eq } from "drizzle-orm";

type InviteInput = { email: string; role: "admin" | "member" };

export const createWorkspace = async (
  name: string,
  invites: InviteInput[] = [],
) => {
  const session = await verifySession();

  if (!name.trim()) {
    return {
      errorMessage: "워크스페이스 이름을 입력해주세요.",
    };
  }

  // neon-http 드라이버는 db.transaction()을 지원하지 않아서, 워크스페이스 생성은
  // 순차적으로 처리합니다.
  const [newWorkspace] = await db
    .insert(workspace)
    .values({ name, ownerId: session.id })
    .returning();

  await db.insert(workspaceMember).values({
    workspaceId: newWorkspace.id,
    userId: session.id,
    role: "owner",
  });

  // 이미 가입된 이메일은 수락 절차 없이 바로 워크스페이스 멤버가 되고,
  // 아직 가입 전인 이메일은 초대 토큰을 남겨서 회원가입 완료 시 자동으로 합류시킵니다.
  const pendingSignupEmails: string[] = [];

  for (const invite of invites) {
    const invitedUser = await getUserByEmail(invite.email);

    if (invitedUser) {
      await db.insert(workspaceMember).values({
        workspaceId: newWorkspace.id,
        userId: invitedUser.id,
        role: invite.role,
      });
      continue;
    }

    await db.insert(workspaceInvite).values({
      workspaceId: newWorkspace.id,
      email: invite.email,
      role: invite.role,
      token: randomUUID(),
    });
    pendingSignupEmails.push(invite.email);
  }

  revalidatePath(BASE_URL);

  return { workspace: newWorkspace, pendingSignupEmails };
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

// 새로 가입한 이메일 앞으로 남아있던 워크스페이스 초대가 있으면 바로 멤버로 합류시킵니다.
// 회원가입 액션(actions/signup.ts)에서 사용자 생성 직후 호출됩니다.
export const joinPendingWorkspaceInvites = async (
  userId: string,
  email: string,
) => {
  const invites = await db.query.workspaceInvite.findMany({
    where: { email },
  });

  for (const invite of invites) {
    await db.insert(workspaceMember).values({
      workspaceId: invite.workspaceId,
      userId,
      role: invite.role,
    });
    await db.delete(workspaceInvite).where(eq(workspaceInvite.id, invite.id));
  }
};

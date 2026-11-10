import { defineRelations } from "drizzle-orm";
import { text, timestamp, pgTable, uuid, unique } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversation = pgTable("conversation", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  name: text("name"),
  userId: uuid("userId")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  // null이면 개인 대화, 값이 있으면 워크스페이스에 속한 팀 공유 대화
  workspaceId: uuid("workspaceId").references(() => workspace.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const message = pgTable("message", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  content: text("content"),
  role: text("role").$type<"user" | "assistant">(),
  model: text("model"),
  conversationId: uuid("conversationId")
    .references(() => conversation.id, { onDelete: "cascade" })
    .notNull(),
  // role이 "user"인 메시지를 실제로 보낸 사람. 워크스페이스 공유 대화에서
  // "누가 보냈는지" 구분하는 데 씁니다 — assistant 메시지는 null.
  userId: uuid("userId").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspace = pgTable("workspace", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  name: text("name").notNull(),
  ownerId: uuid("ownerId")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  // 미가입자 초대용 링크(/invite/[inviteToken])에 쓰는 토큰. 워크스페이스당
  // 하나만 유지하며, 오너가 재발급하면 이전 링크는 자동으로 무효화됩니다.
  inviteToken: text("invite_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaceComment = pgTable("workspace_comment", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  messageId: uuid("messageId")
    .references(() => message.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("userId")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaceMember = pgTable(
  "workspace_member",
  {
    id: uuid("id").defaultRandom().notNull().primaryKey(),
    workspaceId: uuid("workspaceId")
      .references(() => workspace.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("userId")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").$type<"owner" | "admin" | "member">().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // 한 사람이 같은 워크스페이스에 두 번 가입할 수 없도록 DB에서 막습니다.
    // (이메일 추가/초대 링크 둘 다 "이미 멤버인지" 미리 확인하지만, 동시에
    // 두 번 눌렀을 때를 대비한 최종 안전장치입니다.)
    unique("workspace_member_workspace_user_key").on(
      table.workspaceId,
      table.userId,
    ),
  ],
);

const schema = {
  user,
  conversation,
  message,
  workspace,
  workspaceMember,
  workspaceComment,
};

export const relations = defineRelations(schema, (r) => ({
  user: {
    conversations: r.many.conversation({
      from: r.user.id,
      to: r.conversation.userId,
    }),
    ownedWorkspaces: r.many.workspace({
      from: r.user.id,
      to: r.workspace.ownerId,
    }),
    workspaceMemberships: r.many.workspaceMember({
      from: r.user.id,
      to: r.workspaceMember.userId,
    }),
  },
  conversation: {
    user: r.one.user({
      from: r.conversation.userId,
      to: r.user.id,
    }),
    workspace: r.one.workspace({
      from: r.conversation.workspaceId,
      to: r.workspace.id,
    }),
    messages: r.many.message({
      from: r.conversation.id,
      to: r.message.conversationId,
    }),
  },
  message: {
    conversation: r.one.conversation({
      from: r.message.conversationId,
      to: r.conversation.id,
    }),
    user: r.one.user({
      from: r.message.userId,
      to: r.user.id,
    }),
    comments: r.many.workspaceComment({
      from: r.message.id,
      to: r.workspaceComment.messageId,
    }),
  },
  workspace: {
    owner: r.one.user({
      from: r.workspace.ownerId,
      to: r.user.id,
    }),
    members: r.many.workspaceMember({
      from: r.workspace.id,
      to: r.workspaceMember.workspaceId,
    }),
    conversations: r.many.conversation({
      from: r.workspace.id,
      to: r.conversation.workspaceId,
    }),
  },
  workspaceMember: {
    workspace: r.one.workspace({
      from: r.workspaceMember.workspaceId,
      to: r.workspace.id,
      optional: false,
    }),
    user: r.one.user({
      from: r.workspaceMember.userId,
      to: r.user.id,
    }),
  },
  workspaceComment: {
    message: r.one.message({
      from: r.workspaceComment.messageId,
      to: r.message.id,
      optional: false,
    }),
    user: r.one.user({
      from: r.workspaceComment.userId,
      to: r.user.id,
      optional: false,
    }),
  },
}));

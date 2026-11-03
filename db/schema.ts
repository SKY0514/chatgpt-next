import { defineRelations } from "drizzle-orm";
import { text, timestamp, pgTable, uuid } from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspace = pgTable("workspace", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  name: text("name").notNull(),
  ownerId: uuid("ownerId")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workspaceMember = pgTable("workspace_member", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  workspaceId: uuid("workspaceId")
    .references(() => workspace.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("userId")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").$type<"owner" | "admin" | "member">().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 아직 가입하지 않은 이메일을 초대했을 때 보관되는 대기 초대.
// 그 이메일로 회원가입이 완료되면 workspaceMember 행을 만들고 이 행은 삭제됩니다.
export const workspaceInvite = pgTable("workspace_invite", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  workspaceId: uuid("workspaceId")
    .references(() => workspace.id, { onDelete: "cascade" })
    .notNull(),
  email: text("email").notNull(),
  role: text("role").$type<"admin" | "member">().notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const schema = {
  user,
  conversation,
  message,
  workspace,
  workspaceMember,
  workspaceInvite,
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
    invites: r.many.workspaceInvite({
      from: r.workspace.id,
      to: r.workspaceInvite.workspaceId,
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
  workspaceInvite: {
    workspace: r.one.workspace({
      from: r.workspaceInvite.workspaceId,
      to: r.workspace.id,
    }),
  },
}));

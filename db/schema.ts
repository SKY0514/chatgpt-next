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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const message = pgTable("message", {
  id: uuid("id").defaultRandom().notNull().primaryKey(),
  content: text("content"),
  role: text("role").$type<"user" | "assistant">(),
  conversationId: uuid("conversationId")
    .references(() => conversation.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const schema = { user, conversation, message };

export const relations = defineRelations(schema, (r) => ({
  user: {
    conversations: r.many.conversation({
      from: r.user.id,
      to: r.conversation.userId,
    }),
  },
  conversation: {
    user: r.one.user({
      from: r.conversation.userId,
      to: r.user.id,
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
}));

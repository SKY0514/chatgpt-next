import { user, workspace, workspaceMember } from "@/db/schema";

export type User = typeof user.$inferSelect;
export type Workspace = typeof workspace.$inferSelect;
export type WorkspaceMember = typeof workspaceMember.$inferSelect;

import { user, workspace, workspaceMember, workspaceInvite } from "@/db/schema";

export type User = typeof user.$inferSelect;
export type Workspace = typeof workspace.$inferSelect;
export type WorkspaceMember = typeof workspaceMember.$inferSelect;
export type WorkspaceInvite = typeof workspaceInvite.$inferSelect;

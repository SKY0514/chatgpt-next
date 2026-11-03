import { notFound } from "next/navigation";
import Chat from "@/components/chat/Chat";
import { getWorkspaceMembership } from "@/data/workspace";

const WorkspaceNewConversationPage = async ({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) => {
  const { workspaceId } = await params;

  const membership = await getWorkspaceMembership(workspaceId);

  if (!membership) {
    notFound();
  }

  return (
    <Chat workspaceId={workspaceId} workspaceName={membership.workspace.name} />
  );
};

export default WorkspaceNewConversationPage;

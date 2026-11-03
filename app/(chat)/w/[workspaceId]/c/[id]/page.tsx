import { notFound } from "next/navigation";
import Chat from "@/components/chat/Chat";
import { getWorkspaceConversation } from "@/data/workspace";
import { getMessagesByConversation } from "@/data/conversation";

const WorkspaceConversationPage = async ({
  params,
}: {
  params: Promise<{ workspaceId: string; id: string }>;
}) => {
  const { workspaceId, id } = await params;

  const conversation = await getWorkspaceConversation(workspaceId, id);

  if (!conversation) {
    notFound();
  }

  const messages = await getMessagesByConversation(id);

  return <Chat key={id} workspaceId={workspaceId} initialMessages={messages} />;
};

export default WorkspaceConversationPage;

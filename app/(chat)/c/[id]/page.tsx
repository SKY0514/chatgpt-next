import Chat from "@/components/chat/Chat";
import { getMessagesByConversation } from "@/data/conversation";

const ConversationPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const messages = await getMessagesByConversation(id);
  return <Chat key={id} initialMessages={messages} />;
};

export default ConversationPage;

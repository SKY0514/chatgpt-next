import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageSquareOff } from "lucide-react";
import Chat from "@/components/chat/Chat";
import { getWorkspaceConversation } from "@/data/workspace";
import { getMessagesByConversation } from "@/data/conversation";
import { BASE_URL } from "@/constants/routes";

const WorkspaceConversationPage = async ({
  params,
}: {
  params: Promise<{ workspaceId: string; id: string }>;
}) => {
  const { workspaceId, id } = await params;

  const result = await getWorkspaceConversation(workspaceId, id);

  // 멤버가 아니면 애초에 이 워크스페이스에 접근할 권한이 없는 거라 404로.
  if (result === "not-member") {
    notFound();
  }

  // 멤버인데 대화가 없으면 — 다른 멤버가 방금 삭제한 경우가 대부분이에요.
  // Pusher로 거의 다 걸러지지만, 사이드바가 갱신되기 전에 클릭했거나 즐겨찾기/
  // 공유 링크로 바로 들어온 경우를 위한 안내 화면입니다.
  if (result === "not-found") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#f1f5f9]">
          <MessageSquareOff className="size-5 text-[#64748b]" />
        </div>
        <h1 className="text-base font-semibold text-[#0f172a]">
          삭제된 대화방이에요
        </h1>
        <p className="max-w-sm text-sm text-[#64748b]">
          대화를 만든 사람이나 워크스페이스 오너가 이 대화방을 삭제했어요.
        </p>
        <Link
          href={BASE_URL}
          className="mt-2 rounded-xl bg-[#6366f1] px-4 py-2 text-sm text-white hover:bg-[#4f46e5]"
        >
          홈으로 이동
        </Link>
      </div>
    );
  }

  const messages = await getMessagesByConversation(id);

  return <Chat key={id} workspaceId={workspaceId} initialMessages={messages} />;
};

export default WorkspaceConversationPage;

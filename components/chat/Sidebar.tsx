import { CHAT_ROUTES } from "@/constants/routes";
import { MessageSquare } from "lucide-react";
import SidebarItem from "./SidebarItem";
import SidebarBrand from "./SidebarBrand";
import NewChatButton from "./NewChatButton";
import UserProfileCard from "./UserProfileCard";
import { getConversationsByUser } from "@/data/user";
import NewWorkspaceButton from "./NewWorkspaceButton";
import SidebarCollapsibleSection from "./SidebarCollapsibleSection";

const Sidebar = async () => {
  const conversations = await getConversationsByUser();

  const formattedItems = conversations.map((conversation) => ({
    id: conversation.id,
    label: conversation.name || "",
    href: `${CHAT_ROUTES.CONVERSATIONS}/${conversation.id}`,
  }));

  return (
    <nav className="flex h-full flex-col border-r border-[#e2e8f0]/60 bg-[#f8fafc] px-3 py-4">
      <div className="w-full shrink-0 space-y-4">
        <SidebarBrand />

        <div className="w-full px-1">
          <NewChatButton />
        </div>
      </div>

      <div className="w-full flex-1 space-y-5 overflow-y-auto px-1 mt-4">
        {/* 개인 대화 영역 */}
        <div className="space-y-1">
          <SidebarCollapsibleSection title="개인 대화">
            {formattedItems.length === 0 ? (
              <div className="bg-white p-4 rounded-xl drop-shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex items-center flex-col space-y-2">
                <div className="bg-[#f1f5f9] rounded-full flex items-center justify-center size-8">
                  <MessageSquare
                    className="size-3.5 opacity-70"
                    stroke="#64748b"
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-[#0f172a]">아직 대화가 없어요</h2>
                  <h2 className="text-[#64748b]">새 대화를 시작해보세요</h2>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-y-0.5">
                {formattedItems.map((item) => (
                  <SidebarItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </SidebarCollapsibleSection>
        </div>
        {/* 워크 스페이스 영역 */}
        <div className="space-y-1.5 border-t border-[#e2e8f0]/60 pt-3">
          <p className="px-2 py-1 text-[11px] text-[#64748b]">워크스페이스</p>

          <div className="bg-white p-4 rounded-xl drop-shadow-[0px_1px_2px_rgba(0,0,0,0.05)] flex items-center flex-col">
            <div className="bg-[#f1f5f9] rounded-full flex items-center justify-center size-8">
              <img
                src="/icon-workspace.svg"
                alt="workspace icon"
                className="w-3.5 h-auto"
              />
            </div>
            <h2 className="text-[#0f172a] text-center mt-2">
              아직 속한 워크스페이스가 없어요
            </h2>
            <div className="mt-3.5 w-full">
              <NewWorkspaceButton />
            </div>
          </div>
        </div>
      </div>

      {/* 사용자 프로필 영역 */}
      <div className="w-full shrink-0">
        <UserProfileCard />
      </div>
    </nav>
  );
};

export default Sidebar;

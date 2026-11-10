import CreateWorkspaceModal from "@/components/chat/CreateWorkspaceModal";
import HomeLayoutContent from "@/components/chat/HomeLayoutContent";
import Sidebar from "@/components/chat/Sidebar";
import UserProvider from "@/providers/UserProvider";
import { ReactNode } from "react";

const ChatLayout = ({ children }: { children: ReactNode }) => {
  return (
    <UserProvider>
      <div className="md:flex h-full">
        {/* 사이드바 영역 */}
        <div className="hidden md:block w-[288px]">
          <Sidebar />
        </div>
        {/* 헤더 + chat 영역 (+ 코멘트 패널이 열리면 같이 좁아짐) */}
        <HomeLayoutContent sidebar={<Sidebar />}>{children}</HomeLayoutContent>
      </div>
      <CreateWorkspaceModal />
    </UserProvider>
  );
};

export default ChatLayout;

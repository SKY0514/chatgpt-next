import Sidebar from "@/components/chat/Sidebar";
import { ReactNode } from "react";

const ChatLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="md:flex h-full">
      {/* 사이드바 영역 */}
      <div className="hidden md:block w-75">
        <Sidebar />
      </div>
      {/* 헤더 + chat 영역 */}
      <div>{children}</div>
    </div>
  );
};

export default ChatLayout;

"use client";

import { ReactNode } from "react";
import Header from "./Header";
import WorkspaceCommentPanel from "./WorkspaceCommentPanel";
import { useWorkspaceCommentPanelStore } from "@/stores/workspaceCommentPanel";

type Props = {
  sidebar: ReactNode;
  children: ReactNode;
};

// 코멘트 패널이 열리면 겹쳐 가리는 대신, 헤더 + 대화 영역(#home-layout)이
// 함께 좁아지도록 같은 flex row에 패널을 형제로 둡니다. Chat.tsx(대화 영역)
// 안의 w-[80%]는 이 좁아진 폭을 기준으로 다시 계산되기 때문에 따로
// 손댈 필요가 없습니다.
const HomeLayoutContent = ({ sidebar, children }: Props) => {
  const openComment = useWorkspaceCommentPanelStore(
    (state) => state.openComment,
  );
  const close = useWorkspaceCommentPanelStore((state) => state.close);
  const scrollToMessage = useWorkspaceCommentPanelStore(
    (state) => state.scrollToMessage,
  );

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      <div
        className="flex min-w-0 flex-1 flex-col h-full overflow-y-auto"
        id="home-layout"
      >
        <Header sidebar={sidebar} />
        {children}
      </div>

      {openComment && (
        <WorkspaceCommentPanel
          messageId={openComment.messageId}
          answerSummary={openComment.answerSummary}
          onClose={close}
          onClickSummary={() => scrollToMessage(openComment.messageId)}
        />
      )}
    </div>
  );
};

export default HomeLayoutContent;

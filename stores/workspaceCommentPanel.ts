import { create } from "zustand";

// 코멘트 패널 UI를 Chat.tsx(대화 영역)와 레이아웃(헤더+대화 영역을 함께
// 좁혀야 하는 쪽)이 같이 읽고 써야 해서 zustand로 뺐습니다 — props로
// 내려주려면 Header/children을 감싸는 공용 조상까지 다시 끌어올려야 해요.
export const workspaceMessageElementId = (messageId: string) =>
  `workspace-message-${messageId}`;

type OpenComment = {
  messageId: string;
  answerSummary: string;
};

type State = {
  openComment: OpenComment | null;
  // 답변 요약 클릭으로 스크롤해온 메시지를 잠깐 강조 표시하는 용도
  highlightedMessageId: string | null;
};

type Action = {
  toggle: (comment: OpenComment) => void;
  close: () => void;
  scrollToMessage: (messageId: string) => void;
};

let highlightTimeout: ReturnType<typeof setTimeout> | null = null;

const useWorkspaceCommentPanelStore = create<State & Action>()((set) => ({
  openComment: null,
  highlightedMessageId: null,
  toggle: (comment) =>
    set((state) => ({
      openComment:
        state.openComment?.messageId === comment.messageId ? null : comment,
    })),
  close: () => set({ openComment: null }),
  scrollToMessage: (messageId) => {
    document
      .getElementById(workspaceMessageElementId(messageId))
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

    if (highlightTimeout) clearTimeout(highlightTimeout);
    set({ highlightedMessageId: messageId });
    highlightTimeout = setTimeout(() => {
      set({ highlightedMessageId: null });
    }, 1500);
  },
}));

export { useWorkspaceCommentPanelStore };

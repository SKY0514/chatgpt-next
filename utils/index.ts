export const isEmpty = (text: string | null) => {
  return text === null || text?.trim() === "";
};

// 메시지/코멘트 타임스탬프 표시용 — Chat.tsx(메시지)와
// WorkspaceCommentPanel.tsx(코멘트)가 같은 형식을 씁니다.
export const formatMessageTime = (createdAt?: string) =>
  new Date(createdAt ?? Date.now()).toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });

// "/"로 시작하는 내부 경로만 허용 (open redirect 방지). 로그인/회원가입에서
// 둘 다 쓰는 ?from= 리다이렉트 검증 로직이라 공용으로 뺐습니다.
export const isSafeRedirectPath = (from: unknown): from is string =>
  typeof from === "string" && from.startsWith("/") && !from.startsWith("//");

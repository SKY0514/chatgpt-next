// 워크스페이스 공유 대화 하나당 채널 하나 — 그 안에서 새 메시지/코멘트
// 이벤트를 둘 다 흘려보냅니다. 서버 액션(발행)과 클라이언트(구독) 양쪽이
// 똑같은 이름을 써야 해서 공용으로 뺐습니다.
export const workspaceConversationChannel = (conversationId: string) =>
  `workspace-conversation-${conversationId}`;

export const PUSHER_EVENTS = {
  // 메시지(사용자/AI)가 새로 저장됐을 때
  NEW_MESSAGE: "new-message",
  // 코멘트가 새로 저장됐을 때 — payload: { messageId: string }
  NEW_COMMENT: "new-comment",
  // 사용자가 막 질문을 보낸 시점(아직 DB 저장 전, AI 응답도 전) — payload:
  // { authorId: string; authorName: string; content: string }. AI가 답변을
  // 다 쓸 때까지 기다리지 않고, 질문이 왔다는 것만 먼저 다른 멤버 화면에
  // 보여주기 위한 신호용 이벤트입니다.
  PENDING_MESSAGE: "pending-message",
} as const;

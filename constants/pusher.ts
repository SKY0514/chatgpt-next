// 워크스페이스 공유 대화 하나당 채널 하나 — 그 안에서 새 메시지/코멘트
// 이벤트를 둘 다 흘려보냅니다. 서버 액션(발행)과 클라이언트(구독) 양쪽이
// 똑같은 이름을 써야 해서 공용으로 뺐습니다.
export const workspaceConversationChannel = (conversationId: string) =>
  `workspace-conversation-${conversationId}`;

// 위와 별개로, 워크스페이스 하나당 채널 하나 — 특정 대화방 페이지를 보고
// 있지 않아도(사이드바만 보고 있어도) 대화방 생성/삭제/제목 변경을 알 수
// 있게 합니다. 사이드바(WorkspaceGroup.tsx)가 구독합니다.
export const workspaceChannel = (workspaceId: string) =>
  `workspace-${workspaceId}`;

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
  // 대화방이 삭제됐을 때 — payload 없음. 지금 그 대화방을 보고 있는 다른
  // 멤버를 새로고침 없이 바로 워크스페이스 홈으로 내보내기 위한 이벤트.
  CONVERSATION_DELETED: "conversation-deleted",
  // 워크스페이스의 대화방 목록이 바뀌었을 때(생성/삭제/이름·제목 변경) —
  // payload 없음. 사이드바가 이 신호만 받고 router.refresh()로 서버
  // 데이터를 다시 가져옵니다.
  WORKSPACE_UPDATED: "workspace-updated",
} as const;

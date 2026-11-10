// 워크스페이스 공유 대화/코멘트는 Pusher로 실시간 반영되지만(새 메시지/코멘트
// 저장 시 서버가 이벤트를 쏘고, 클라이언트는 그걸 받아 즉시 리페치), 혹시
// 이벤트를 놓쳤을 때(네트워크 끊김 등)를 대비한 안전망으로 느슨하게 한 번씩
// 더 다시 읽어옵니다 — Chat.tsx(메시지)와 WorkspaceMessage.tsx·
// WorkspaceCommentPanel.tsx(코멘트)가 같은 주기를 씁니다.
export const WORKSPACE_POLL_INTERVAL = 30000;

// gpt-4.1-nano는 OpenAI에서 지원 종료(deprecated)되어 목록에서 제외했습니다.
// 세 개 모두 각 모델 세대의 저가형(nano/mini) 라인업으로, 토큰 비용이 낮은 편입니다.
export const AI_MODEL = [
  {
    label: "GPT-5 nano",
    value: "gpt-5-nano",
  },
  {
    label: "GPT-5 mini",
    value: "gpt-5-mini",
  },
  {
    label: "GPT-4o mini",
    value: "gpt-4o-mini",
  },
] as const;

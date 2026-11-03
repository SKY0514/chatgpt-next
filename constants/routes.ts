export const BASE_URL = "/";

export const AUTH_ROUTES = {
  LOGIN: "/login",
  SIGN_UP: "/signup",
};

export const CHAT_ROUTES = {
  CONVERSATIONS: "/c",
};

// 워크스페이스 공유 대화는 개인 대화(/c/[id])와 분리된 네임스페이스를 씁니다.
// 접근 권한(멤버십) 검증을 URL만으로 할 수 있고, 추후 설정/대시보드 화면도
// 같은 네임스페이스 하위에 둘 수 있습니다.
export const WORKSPACE_ROUTES = {
  NEW: (workspaceId: string) => `/w/${workspaceId}`,
  CONVERSATION: (workspaceId: string, conversationId: string) =>
    `/w/${workspaceId}/c/${conversationId}`,
};

export const PUBLIC_ROUTES = [AUTH_ROUTES.LOGIN, AUTH_ROUTES.SIGN_UP];

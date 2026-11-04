export const isEmpty = (text: string | null) => {
  return text === null || text?.trim() === "";
};

// "/"로 시작하는 내부 경로만 허용 (open redirect 방지). 로그인/회원가입에서
// 둘 다 쓰는 ?from= 리다이렉트 검증 로직이라 공용으로 뺐습니다.
export const isSafeRedirectPath = (from: unknown): from is string =>
  typeof from === "string" && from.startsWith("/") && !from.startsWith("//");

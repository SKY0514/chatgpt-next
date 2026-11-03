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

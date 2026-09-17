# Chatgpt Next — 팀 워크스페이스 기반 협업 AI 챗봇

> 개인 계정 단위로만 동작하는 범용 AI 챗봇(ChatGPT, Claude, Gemini)의 한계를 넘어, 팀이 하나의 워크스페이스에서 AI와의 대화를 함께 보고 코멘트를 남기며 사용량을 관리할 수 있는 협업형 챗봇 서비스입니다.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F)](https://orm.drizzle.team)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

**🔗 Live Demo: [chatgpt-next-phi-ten.vercel.app](https://chatgpt-next-phi-ten.vercel.app)**

<!--
  README 상단에 실제 서비스 스크린샷/GIF를 추가하면 좋습니다. 예:
  ![screenshot](docs/screenshots/chat.png)
-->

## 소개

ChatGPT, Claude, Gemini 같은 범용 AI 챗봇은 대화가 개인 계정에 종속되어 있어, 팀 단위로 AI를 활용할 때 다음과 같은 문제가 발생합니다.

- 동료가 이전에 어떤 질문을 하고 어떤 답을 받았는지 알 수 없어 같은 질문이 반복되고 지식이 파편화됨
- 유용한 답변을 팀에 공유하려면 캡처/복사-붙여넣기에 의존해야 하고, 원본 대화 맥락이 유실됨
- 팀 요금제가 있어도 대화 자체의 실시간 공유, 답변 단위 코멘트, 세분화된 권한 관리는 지원하지 않음
- 관리자가 팀의 AI 사용 현황(요청 수, 토큰 사용량)을 파악하기 어려움

**Chatgpt Next**는 워크스페이스(팀 공간)를 1급 개체로 두어, 개인 대화와 팀 공유 대화를 구분하고 팀원 간 실시간 코멘트, 역할 기반 권한, 사용량 대시보드를 제공하는 것을 목표로 합니다.

## 핵심 기능

### 구현 완료

| 기능 | 설명 |
| --- | --- |
| 회원가입 / 로그인 | bcrypt 비밀번호 해싱, JWT 기반 세션 관리 |
| 인증 미들웨어 | 미인증 사용자의 보호된 라우트 접근 차단 및 원래 경로로 리다이렉트 |
| AI 채팅 스트리밍 | Vercel AI SDK 기반 OpenAI 모델 실시간 스트리밍 응답 |
| 멀티 모델 선택 | gpt-4.1-nano / gpt-5-nano / gpt-4o-mini 중 대화별 모델 선택 |
| 대화 CRUD | 대화 생성, 이름 수정, 삭제, 사이드바 목록 실시간 반영 |
| 대화 생성 + 첫 메시지 통합 처리 | 새 대화 시작과 첫 메시지 전송을 하나의 액션으로 처리 |

### 개발 예정 (로드맵)

| 기능 | 설명 |
| --- | --- |
| 워크스페이스 생성 / 멤버 초대 | 팀 워크스페이스 생성 및 초대 링크를 통한 멤버 추가 |
| 역할 기반 권한 | 오너 / 멤버 역할 구분, 워크스페이스 설정 변경 권한 제어 |
| 팀 공유 대화 | 워크스페이스 소속 대화를 멤버 전원이 조회하고 이어서 질문 |
| 답변별 코멘트 스레드 | AI 답변(메시지) 단위로 팀원이 의견을 남기는 코멘트 기능 |
| 워크스페이스 사용량 대시보드 | 멤버별·기간별 요청 수 / 토큰 사용량 시각화 |

> 개발 우선순위와 일정은 프로젝트 계획서를 기준으로 진행합니다.

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, Zustand |
| Backend | Next.js Server Actions / Route Handler |
| Database | PostgreSQL (Neon Serverless), Drizzle ORM |
| 인증 | JWT 세션(jose), bcrypt |
| AI 연동 | Vercel AI SDK (`ai`, `@ai-sdk/openai`), OpenAI 스트리밍 응답 |
| 폼 / 검증 | React Hook Form, Zod |

## 아키텍처

```
┌────────────────────┐        ┌──────────────────────────┐        ┌───────────────────┐
│  Client (Next.js)  │ ─────▶ │  Server (Route Handler /  │ ─────▶ │  PostgreSQL(Neon)  │
│  React 19 + Zustand│ ◀───── │  Server Actions)          │ ◀───── │  Drizzle ORM       │
└────────────────────┘        └──────────────┬────────────┘        └───────────────────┘
                                              │
                                              ▼
                                  ┌────────────────────────┐
                                  │  OpenAI API             │
                                  │  (Vercel AI SDK 스트리밍) │
                                  └────────────────────────┘
```

## 폴더 구조

```
├── actions/        # 서버 액션 (인증, 대화 CRUD 등)
├── app/
│   ├── (auth)/     # 로그인 / 회원가입 페이지
│   ├── (chat)/     # 채팅 메인 화면
│   └── api/chat/   # AI 스트리밍 응답 API Route
├── components/     # UI 컴포넌트 (chat, auth, modal, ui)
├── db/             # Drizzle 스키마 및 DB 클라이언트
├── drizzle/        # 마이그레이션 파일
├── lib/            # 공용 유틸리티
├── providers/      # 전역 Provider
├── schemas/        # Zod 검증 스키마
├── stores/         # Zustand 스토어
└── types/          # 공용 타입 정의
```

## 라이선스

개인 학습 및 포트폴리오 목적의 프로젝트입니다.

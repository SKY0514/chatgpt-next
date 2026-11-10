"use client";

import { Search, Users } from "lucide-react";
import { cn } from "cn";
import MobileMenu from "./MobileMenu";
import ModelSelect from "./ModelSelect";
import { Avatar, AvatarFallback } from "../ui/avatar";
import type { ReactNode } from "react";

type Member = { name: string; initial: string };

type Props = {
  sidebar: ReactNode;
  workspaceName: string;
  conversationTitle: string;
  // 아바타로 보여줄 멤버들 — 다 안 보여주고 앞 4명 + "+N"으로 요약합니다.
  members: Member[];
  userInitials: string;
  // 실제 화면에선 Header.tsx처럼 sticky top-0으로 붙어야 하지만, /ui-preview처럼
  // 이미 다른 sticky 헤더 아래에 끼워 보여줄 때는 false로 꺼서 서로 안 겹치게 합니다.
  sticky?: boolean;
};

const MAX_VISIBLE_MEMBERS = 4;

// 멤버 아바타 배경색 팔레트 — 이름을 해시해서 고르기 때문에, 매번 리렌더돼도
// 같은 사람은 항상 같은 색을 받습니다 (매 렌더마다 색이 바뀌는 걸 방지).
const MEMBER_AVATAR_COLORS = ["#E2DFFF", "#C9E6FF", "#DAE2FD", "#E2E7FF"];

// 단순히 글자 코드를 더해서 나누면 거의 항상 같은 색이 나와요 — 한글
// 완성형 코드(0xAC00 + (초성*21+중성)*28+종성)는 28이 4의 배수라서,
// 그 값 % 4가 사실상 받침(종성) 인덱스로만 정해지고, 실제 이름들은 받침이
// 비슷하게 겹치는 경우가 많아서 쏠립니다. FNV-1a로 제대로 섞은 뒤, 하위
// 비트보다 덜 쏠리는 상위 비트를 사용합니다.
const getMemberAvatarColor = (name: string) => {
  let hash = 0x811c9dc5;
  for (const char of name) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  const index = (hash >>> 16) % MEMBER_AVATAR_COLORS.length;
  return MEMBER_AVATAR_COLORS[index];
};

// 워크스페이스 공유 대화 전용 헤더입니다. 지금은 /ui-preview에서만 미리보기로 쓰이고,
// 실제 /w/[workspaceId]/c/[id] 화면에 연결하려면 Header.tsx를 워크스페이스/개인 대화에
// 따라 둘 중 하나를 고르도록 분기하는 작업이 별도로 필요합니다.
const WorkspaceConversationHeader = ({
  sidebar,
  workspaceName,
  conversationTitle,
  members,
  userInitials,
  sticky = true,
}: Props) => {
  const visibleMembers = members.slice(0, MAX_VISIBLE_MEMBERS);
  const overflowCount = members.length - visibleMembers.length;

  return (
    <header
      className={cn(
        "h-14 shrink-0 z-10 flex items-center justify-between border-b border-[#e2e8f0]/60 bg-white/90 px-6 backdrop-blur-[6px]",
        sticky && "sticky top-0",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <MobileMenu>{sidebar}</MobileMenu>

        <div className="flex min-w-0 items-center gap-2">
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#f1f5f9] px-2.5 py-1 text-xs font-semibold text-[#6366f1]">
            <img src="/icon-users.svg" alt="login icon" className="w-6.5 h-6" />
            {workspaceName}
          </span>
          <span className="shrink-0 text-xs text-[#94a3b8]">/</span>
          <span className="min-w-0 truncate text-base font-semibold text-[#0f172a]">
            {conversationTitle}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {/* 멤버 아바타 스택 */}
        <div className="flex items-center -space-x-2">
          {visibleMembers.map((member, index) => (
            <Avatar
              key={member.name + index}
              size="default"
              className="ring-1 ring-white"
              style={{ backgroundColor: getMemberAvatarColor(member.name) }}
            >
              <AvatarFallback className="bg-inherit text-[11px] font-semibold text-[#464554]">
                {member.initial}
              </AvatarFallback>
            </Avatar>
          ))}
          {overflowCount > 0 && (
            <Avatar size="default" className="bg-[#f1f5f9] ring-2 ring-white">
              <AvatarFallback className="bg-inherit text-[11px] font-semibold text-[#6366f1]">
                +{overflowCount}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="h-4 w-px bg-[#e2e8f0]" />

        {/* 모델 선택 — 기존 ModelSelect 그대로 재사용 */}
        <ModelSelect />

        {/* <button
          type="button"
          title="검색 (준비 중)"
          disabled
          className="flex size-8 items-center justify-center rounded-lg text-[#64748b] opacity-50"
        >
          <Search className="size-4" />
        </button> */}

        <div className="flex size-8 items-center justify-center rounded-full bg-[#4f46e5] text-xs text-white">
          {userInitials}
        </div>
      </div>
    </header>
  );
};

export default WorkspaceConversationHeader;

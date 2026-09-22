"use client";

import MessageComposer from "./MessageComposer";

type Props = {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

const Empty = ({ inputValue, onInputChange, onSubmit, disabled }: Props) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      {/* 웰컴 아이콘 & 타이틀 */}
      <div className="mb-8 flex flex-col items-center">
        {/* 아이콘 */}
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-[#6366f1] to-[#4f46e5] shadow-[0px_10px_15px_-3px_rgba(99,102,241,0.2),0px_4px_6px_-4px_rgba(99,102,241,0.2)]">
          <img src="/icon-sidebar.svg" alt="logo" className="size-6" />
        </div>

        <h3 className="mb-2.5 text-center text-base font-medium tracking-[-0.4px] text-[#0f172a]">
          Threadly에 오신 것을 환영합니다
        </h3>

        <p className="max-w-lg text-center text-base text-[#64748b] break-keep whitespace-pre-line">
          개인 작업은 물론, 워크스페이스를 만들어 팀원들과 실시간으로 AI 대화를
          공유하고 협업해보세요.
        </p>
      </div>

      {/* 프롬프트 입력창 */}

      <MessageComposer
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    </div>
  );
};

export default Empty;

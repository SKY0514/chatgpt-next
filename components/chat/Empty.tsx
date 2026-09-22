"use client";

import { ArrowUp, Globe, Loader2, Paperclip } from "lucide-react";
import AutoResizingTextarea from "./AutoResizingTextarea";

type Props = {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

const Empty = ({ inputValue, onInputChange, onSubmit, disabled }: Props) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6">
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
      <form
        className="mb-8 w-full rounded-2xl bg-white p-4 shadow-[0px_4px_6px_2px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <AutoResizingTextarea
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          disabled={disabled}
          placeholder="Threadly에게 질문하거나 작업을 요청하세요... (Shift + Enter로 줄바꿈)"
          className="min-h-11 px-1 shadow-none focus-visible:ring-0"
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              title="문서 첨부 (준비 중)"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-[#64748b] opacity-40"
            >
              <Paperclip className="size-4" />
              문서 첨부
            </button>
            <button
              type="button"
              disabled
              title="웹 브라우징 (준비 중)"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-[#64748b] opacity-40"
            >
              <Globe className="size-4" />웹 브라우징
            </button>
          </div>
          <button
            type="submit"
            disabled={disabled}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#6366f1] text-white drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#4f46e5] disabled:opacity-50"
          >
            {disabled ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUp className="size-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Empty;

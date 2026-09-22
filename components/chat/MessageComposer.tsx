import AutoResizingTextarea from "./AutoResizingTextarea";
import { ArrowUp, Globe, Loader2, Paperclip } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

const MessageComposer = ({ value, onChange, onSubmit, disabled }: Props) => {
  return (
    <form
      className="w-full rounded-2xl bg-white p-4 shadow-[0px_4px_6px_2px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <AutoResizingTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Threadly에게 질문하거나 작업을 요청하세요... (Shift + Enter로 줄바꿈)"
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            !e.nativeEvent.isComposing &&
            !disabled
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
        {/* 제출 버튼 */}
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
  );
};

export default MessageComposer;

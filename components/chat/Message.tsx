import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AI_MODEL } from "@/constants/chat";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Copy, RotateCw } from "lucide-react";

type Props = {
  name?: string;
  content?: string;
  role: "user" | "assistant";
  model?: string;
  createdAt?: string;
  isLastAssistant?: boolean;
  handleRegenerateButton?: () => void;
  handleCopyButton: (text: string) => void;
  isLoading?: boolean;
};

const Message = ({
  name = "user",
  content = "",
  role,
  model,
  createdAt = new Date().toISOString(),
  isLastAssistant = false,
  isLoading = true,
  handleRegenerateButton,
  handleCopyButton,
}: Props) => {
  const isAssistant = role === "assistant";

  const formattedTime = new Date(createdAt).toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      {isAssistant ? (
        <div className="flex gap-x-3">
          {/* 왼쪽 */}
          <Avatar className="bg-[#6366f1] flex items-center justify-center mt-1">
            <AvatarImage
              src="/icon-ai-avatar.png"
              alt="ai avatar"
              className="size-3.5"
            />
          </Avatar>

          {/* 오른쪽 */}
          <div className="space-y-2.5">
            {/* AI info */}
            <div className="flex items-center gap-x-2 py-1.25">
              <span className="text-sm font-bold text-[#0f172a]">
                Threadly AI
              </span>
              <span className="bg-[#f1f5f9] px-1.5 py-0.5 rounded-sm text-[#6366f1] text-[10px] font-semibold">
                {AI_MODEL.find((ai) => ai.value === model)?.label ?? model}
              </span>
              <span className="text-[#64748b] text-xs">{formattedTime}</span>
            </div>

            {/* 내용 */}
            {isLoading ? (
              <div className="flex items-center gap-1 py-1">
                <span className="size-1.5 rounded-full bg-[#94a3b8] animate-bounce [animation-delay:-0.3s]" />
                <span className="size-1.5 rounded-full bg-[#94a3b8] animate-bounce [animation-delay:-0.15s]" />
                <span className="size-1.5 rounded-full bg-[#94a3b8] animate-bounce" />
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-[#0f172a] prose-headings:text-[#0f172a] prose-strong:text-[#0f172a]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            )}

            {/* 다시 생성 */}
            <div className="flex items-center gap-x-2">
              <Button
                className="bg-[#f8fafc] text-[#64748b] px-2.5 py-1 rounded-md flex items-center gap-x-1.5 text-xs hover:bg-[#e0e2e5]"
                onClick={() => handleCopyButton(content)}
              >
                <Copy className="size-2.5" />
                내용 복사
              </Button>
              {isLastAssistant && (
                <Button
                  className="bg-[#f8fafc] text-[#64748b] px-2.5 py-1 rounded-md flex items-center gap-x-1.5 text-xs hover:bg-[#e0e2e5]"
                  onClick={handleRegenerateButton}
                >
                  <RotateCw className="size-2.5" />
                  다시 생성
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-end gap-x-3">
          {/* 왼쪽 */}
          <div className="space-y-1.5">
            {/* 시간 */}
            <div className=" text-right">
              <div className="space-x-2 text-xs">
                <span className="text-[#64748b]">{formattedTime}</span>
                <span className="text-[#0f172a] font-medium">{name}</span>
              </div>
            </div>

            <div className="bg-[#6366f1] text-white p-4 pr-6 drop-shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-2xl rounded-tr-xs text-sm">
              {content}
            </div>
          </div>
          {/* 오른쪽 */}
          <Avatar className="mt-5 bg-primary">
            <AvatarFallback className="bg-inherit text-white text-xs">
              {name.slice(-2)}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </>
  );
};

export default Message;

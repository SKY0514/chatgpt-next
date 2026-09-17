import { cn } from "cn";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type Props = {
  name?: string;
  content?: string;
  role: "user" | "assistant";
};

const Message = ({ name = "user", content = "", role }: Props) => {
  const isAssistant = role === "assistant";
  const avatarName = isAssistant ? "Chat GPT" : name;
  return (
    <div
      className={cn(
        "flex gap-2 mb-5",
        isAssistant ? "justify-start" : "flex-row-reverse",
      )}
    >
      <Avatar className="mt-0.5">
        <AvatarImage src={isAssistant ? "/logo.png" : ""} alt="avatar" />
        <AvatarFallback>{avatarName[0]}</AvatarFallback>
      </Avatar>

      {/* 이름 + 내용 */}
      <div>
        {isAssistant && <h2 className="font-bold">{avatarName}</h2>}
        <div
          className={cn("mt2 whitespace-break-spaces rounded-xl ", {
            "bg-blue-50 px-4 py-2": !isAssistant,
          })}
        >
          {content}
        </div>
      </div>
    </div>
  );
};

export default Message;

import Link from "next/link";
import { Plus } from "lucide-react";
import { BASE_URL } from "@/constants/routes";

const NewChatButton = () => {
  return (
    <Link
      href={BASE_URL}
      className="flex w-full justify-center items-center rounded-xl bg-[#6366f1] px-3.5 py-2.5 drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#4f46e5]"
    >
      <span className="flex items-center gap-x-1.5">
        <Plus className="size-2.5 text-white" strokeWidth={3} />
        <span className="text-sm text-white">새 대화 시작</span>
      </span>
    </Link>
  );
};

export default NewChatButton;

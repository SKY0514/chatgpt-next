import Link from "next/link";
import { Plus } from "lucide-react";
import { BASE_URL } from "@/constants/routes";

const NewWorkspaceButton = () => {
  return (
    <Link
      href={BASE_URL}
      className="flex w-full justify-center items-center rounded-lg bg-[#e2e8f0] px-3 py-2 drop-shadow-[0px_1px_2px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#c7ccd3]"
    >
      <span className="flex items-center gap-x-1.5">
        <Plus className="size-2.5 text-[#6366f1]" strokeWidth={3} />
        <span className="text-sm text-[#6366f1]">워크스페이스 만들기</span>
      </span>
    </Link>
  );
};

export default NewWorkspaceButton;

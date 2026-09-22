"use client";

import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useUserStore } from "@/stores/user";
import { deleteSession } from "@/actions/sessions";
import { Button } from "@base-ui/react";

const UserProfileCard = () => {
  const name = useUserStore((state) => state.user.name);
  const email = useUserStore((state) => state.user.email);
  const initials = (name || "").slice(-2);

  return (
    <div className="w-full border-t border-[#e2e8f0]/50 px-1 pt-2">
      <div className="flex w-full items-center justify-between rounded-xl bg-[#f1f5f9] p-2">
        {/* 왼쪽 */}
        <div className="flex min-w-0 flex-1 items-center gap-x-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-[#4f46e5] text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[#0f172a] truncate leading-tight">
              {name}
            </p>
            <p className="text-[11px] text-[#64748b]/70 truncate leading-tight">
              {email}
            </p>
          </div>
        </div>

        {/* 오른쪽 */}

        <Button
          className="size-8 text-[#64748b] flex items-center justify-center shrink-0"
          onClick={() => deleteSession()}
        >
          <LogOut size={14} strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
};

export default UserProfileCard;

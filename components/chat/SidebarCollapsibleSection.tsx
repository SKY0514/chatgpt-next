"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";

type Props = {
  title: string;
  children: React.ReactNode;
};

const SidebarCollapsibleSection = ({ title, children }: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="flex w-full items-center px-2 py-1 text-[11px] text-[#64748b] hover:text-[#0f172a] gap-x-2"
      >
        <span>{title}</span>
        <ChevronDown className={cn("size-3.5", isCollapsed && "-rotate-90")} />
      </button>

      {!isCollapsed && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
};

export default SidebarCollapsibleSection;

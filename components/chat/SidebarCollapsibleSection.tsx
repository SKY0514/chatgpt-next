"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "cn";
import AddWorkspaceIconButton from "./AddWorkspaceIconButton";

type Props = {
  title: string;
  isWorkspace?: boolean;
  children: React.ReactNode;
};

const SidebarCollapsibleSection = ({
  title,
  isWorkspace = false,
  children,
}: Props) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-x-2">
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="flex w-full items-center px-2 py-1 text-[11px] text-[#64748b] hover:text-[#0f172a] gap-x-2"
        >
          <span>{title}</span>
          <ChevronDown
            className={cn("size-3.5", isCollapsed && "-rotate-90")}
          />
        </button>

        {isWorkspace && <AddWorkspaceIconButton />}
      </div>

      {!isCollapsed && <div className="mt-1">{children}</div>}
    </div>
  );
};

export default SidebarCollapsibleSection;

"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Ellipsis, Pencil, Trash } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "cn";

type Props = {
  item: { id: string; label: string; icon: ReactNode; href: string };
};
const SidebarItem = ({ item }: Props) => {
  const { id, label, icon, href } = item;
  const pathName = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between text-sm p-3 group hover:text-white hover:bg-white/10 rounded-lg",
        isMenuOpen || pathName === href
          ? "text-white bg-white/10"
          : "text-zinc-400",
      )}
    >
      {/* label 영역 */}
      <div className="flex items-center gap-2">
        {icon}
        <div className="w-45 truncate">{label}</div>
      </div>

      {/* 드롭다운 영역 */}

      {id !== "new" && (
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger render={<div />} nativeButton={false}>
            <Ellipsis
              className={cn(
                "group-hover:block text-gray-400 hover:text-white",
                isMenuOpen ? "block text-white" : "md:hidden text-gray-400",
              )}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem className="gap-2">
              <Pencil size={18} />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Trash size={18} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Link>
  );
};

export default SidebarItem;

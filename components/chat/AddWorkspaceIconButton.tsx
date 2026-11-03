"use client";

import { Plus } from "lucide-react";
import { useCreateWorkspaceModalStore } from "@/stores/createWorkspaceModal";

const AddWorkspaceIconButton = () => {
  const setOpen = useCreateWorkspaceModalStore((state) => state.setOpen);

  return (
    <button
      type="button"
      className="px-2 py-1 text-[11px] text-[#64748b] hover:text-[#0f172a]"
      onClick={() => setOpen(true)}
    >
      <Plus className="size-3.5" />
    </button>
  );
};

export default AddWorkspaceIconButton;

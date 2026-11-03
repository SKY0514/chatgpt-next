import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  openWorkspaceId: string | null;
};

type Action = {
  toggleWorkspace: (workspaceId: string) => void;
};

const useWorkspaceGroupStore = create<State & Action>()(
  persist(
    (set) => ({
      openWorkspaceId: null,
      toggleWorkspace: (workspaceId) =>
        set((state) => ({
          openWorkspaceId:
            state.openWorkspaceId === workspaceId ? null : workspaceId,
        })),
    }),
    { name: "workspace-group-storage" },
  ),
);

export { useWorkspaceGroupStore };

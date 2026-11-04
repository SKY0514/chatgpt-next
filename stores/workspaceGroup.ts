import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = {
  openWorkspaceId: string | null;
};

type Action = {
  toggleWorkspace: (workspaceId: string) => void;
  openWorkspace: (workspaceId: string) => void;
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
      // toggle과 달리 무조건 펼친 상태로 만듭니다 — 워크스페이스 생성 모달을
      // 닫을 때, 방금 만든 워크스페이스를 사이드바에서 바로 보여주는 용도.
      openWorkspace: (workspaceId) => set({ openWorkspaceId: workspaceId }),
    }),
    { name: "workspace-group-storage" },
  ),
);

export { useWorkspaceGroupStore };

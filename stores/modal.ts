import { ReactNode } from "react";
import { create } from "zustand";

type ModalConfig = {
  title: string;
  description?: string;
  content?: string;
  footer: ReactNode;
};

type State = {
  open: boolean;
  config?: ModalConfig;
};

type Action = {
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
};

// Create your store, which includes both state and (optionally) actions
const useModalStore = create<State & Action>()((set) => ({
  open: false,
  config: undefined,
  openModal: (config) => set({ open: true, config }),
  closeModal: () =>
    set({
      open: false,
      config: undefined,
    }),
}));

export { useModalStore };

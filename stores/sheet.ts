import { create } from "zustand";

type State = {
  open: boolean;
};

type Action = {
  setOpen: (open: State["open"]) => void;
};

// Create your store, which includes both state and (optionally) actions
const useSheetStore = create<State & Action>()((set) => ({
  open: false,
  setOpen: (open) => set(() => ({ open })),
}));

export { useSheetStore };

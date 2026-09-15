import { create } from "zustand";

type State = {
  model: string;
};

type Action = {
  updateModel: (model: State["model"]) => void;
};

// Create your store, which includes both state and (optionally) actions
const useModelStore = create<State & Action>()((set) => ({
  model: "gpt-3.5-turbo",
  updateModel: (model) => set(() => ({ model })),
}));

export { useModelStore };

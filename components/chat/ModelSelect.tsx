"use client";
import { useModelStore } from "@/stores/model";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "cn";

const AI_MODEL = ["gpt-3.5-turbo", "gpt-4", "gtp-4o"];

const ModelSelect = () => {
  const storeModel = useModelStore((state) => state.model);
  const updateModel = useModelStore((state) => state.updateModel);

  const handleChange = (selectModel: string | null) => {
    if (selectModel === null) return;
    updateModel(selectModel);
  };

  return (
    <Select value={storeModel} onValueChange={handleChange}>
      <SelectTrigger className="w-45 border-none focus:ring-transparent text-xl">
        <SelectValue placeholder="모델 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {AI_MODEL.map((model) => (
            <SelectItem
              key={model}
              value={model}
              disabled={storeModel === model}
            >
              {model}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ModelSelect;

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
import Image from "next/image";
import { AI_MODEL } from "@/constants/chat";

const ModelSelect = () => {
  const storeModel = useModelStore((state) => state.model);
  const updateModel = useModelStore((state) => state.updateModel);

  const handleChange = (selectModel: string | null) => {
    if (selectModel === null) return;
    updateModel(selectModel);
  };

  return (
    <Select value={storeModel} onValueChange={handleChange}>
      <SelectTrigger className="shrink-0 gap-x-1.5 rounded-full border-none bg-[#e0e7ff] px-2.5 text-xs font-medium text-[#3730a3] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] hover:bg-[#e0e7ff]/80 [&_svg]:text-[#3730a3]">
        <img src="/icon-ai.svg" alt="select model" className="size-3.5" />
        <SelectValue placeholder="모델 선택">
          {(value: string | null) =>
            AI_MODEL.find((model) => model.value === value)?.label ?? value
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {AI_MODEL.map((model) => (
            <SelectItem
              key={model.value}
              value={model.value}
              disabled={storeModel === model.value}
            >
              {model.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ModelSelect;

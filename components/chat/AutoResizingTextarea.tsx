"use client";
import { TextareaHTMLAttributes, useEffect, useRef } from "react";
import { Textarea } from "../ui/textarea";

type AutoResizingTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  onMultilineChange?: (isMultiline: boolean) => void;
};

const AutoResizingTextarea = ({
  value,
  onMultilineChange,
  ...rest
}: AutoResizingTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "inherit";
    const scrollHeight = el.scrollHeight;
    el.style.height = `${scrollHeight}px`;

    const minHeight = parseFloat(getComputedStyle(el).minHeight);
    onMultilineChange?.(scrollHeight > minHeight + 1);
  }, [value, onMultilineChange]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      className="min-h-11 max-h-50 flex-1 resize-none border-0 !text-base focus-visible:ring-0"
      {...rest}
    />
  );
};

export default AutoResizingTextarea;

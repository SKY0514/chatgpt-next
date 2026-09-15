"use client";

import { ArrowUp } from "lucide-react";
import { cn } from "cn";
import { Button } from "../ui/button";
import AutoResizingTextarea from "./AutoResizingTextarea";
import Empty from "./Empty";
import Message from "./Message";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
};

const DUMMY_MESSAGE = [
  { id: "1", content: "더미데이터1", role: "user" },
  {
    id: "2",
    content:
      "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis!Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis!",
    role: "assistant",
  },
  {
    id: "3",
    content:
      "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis!Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis! Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis!Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis! Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis!Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis! Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis!Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis! Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis!Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis! Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis!Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis! Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis!Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis! Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis!Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nisi harum fugit quidem odit deserunt quisquam, distinctio illum eius. Tempora repellendus esse vel laudantium iure modi sequi dolor animi est officiis!",
    role: "assistant",
  },
] as Message[];

const Chat = () => {
  const [value, setValue] = useState("");
  const [isMultiline, setIsMultiline] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView();
    }
  }, []);

  return (
    <div className="flex flex-col w-[80%] h-full mx-auto">
      {/* 채팅 영역 */}
      <div className="flex-1 py-10">
        {DUMMY_MESSAGE.length === 0 ? <Empty /> : <></>}
        {DUMMY_MESSAGE.map((message) => (
          <Message
            key={message.id}
            name="user"
            content={message.content}
            role={message.role}
          />
        ))}
      </div>

      {/* input 영역 */}
      <div className="pb-5 sticky bottom-0 bg-white">
        <form
          className={cn(
            "flex gap-4 border px-2 py-[9px] rounded-xl",
            isMultiline ? "items-end flex-col" : "items-center",
          )}
        >
          <AutoResizingTextarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onMultilineChange={setIsMultiline}
          />
          <Button type="submit" size="icon">
            <ArrowUp />
          </Button>
        </form>
      </div>
      <div ref={scrollRef} />
    </div>
  );
};

export default Chat;

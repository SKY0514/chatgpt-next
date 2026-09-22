import { streamText, UIMessage, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import type { ChatMessageMetadata } from "@/types/chat";
import { AI_MODEL } from "@/constants/chat";

export async function POST(req: Request) {
  const {
    messages,
    model,
  }: {
    messages: UIMessage[];
    model: (typeof AI_MODEL)[number]["value"];
  } = await req.json();

  const selectedModel = model || "gpt-4.1-nano";

  const result = streamText({
    model: openai(selectedModel),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse<UIMessage<ChatMessageMetadata>>({
    messageMetadata: () => ({
      model: selectedModel,
      createdAt: new Date().toISOString(),
    }),
  });
}

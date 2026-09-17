import { streamText, UIMessage, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  const {
    messages,
    model,
  }: {
    messages: UIMessage[];
    model: "gpt-4.1-nano" | "gpt-5-nano" | "gpt-4o-mini";
  } = await req.json();

  const result = streamText({
    model: openai(model || "gpt-4.1-nano"),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

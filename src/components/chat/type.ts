import type { ChatCompletionResponseMessage } from "openai";

export interface ChatMessage extends ChatCompletionResponseMessage {
  id: string;
  conversationId?: string;
  parentMessageId?: string;

  time?: string;
  name?: string;

  markdown?: string;
}

export type Command = "stopAI" | "stopTTS";

import type { ChatCompletionResponseMessage } from "openai";

export interface ChatMessage extends ChatCompletionResponseMessage {
  id: string;
  time?: string;
  token?: number;

  conversationId?: string;
  parentMessageId?: string;

  markdown?: string;
}

export type Command = "stopAI" | "stopTTS";

import type { ChatCompletionResponseMessage } from "openai";

export interface ChatItem {
  id: string;
  name: string;

  systemMessage?: string;
  conversationId?: string;

  openAIModel?: string;
  temperature?: string;
  top_p?: string;
  // max_token?: number;
  // max_message: string;
}

export interface ChatMessage extends ChatCompletionResponseMessage {
  id: string;
  time?: string;
  token?: number;
  question?: string;
  prompt?: string;
  conversationId?: string;
  markdown?: string;
}

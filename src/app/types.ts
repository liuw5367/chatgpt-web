import type { ChatConfigType } from "./store";

export interface ChatItem extends Pick<ChatConfigType, "openAIModel" | "temperature" | "top_p"> {
  id: string;
  name: string;
  selected?: boolean;

  systemMessage?: string;
  conversationId?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;

  id: string;
  time?: string;
  token?: number;
  question?: string;
  prompt?: string;
  conversationId?: string;
  markdown?: string;
}

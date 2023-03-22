import { atom } from "nanostores";
import type { ChatMessage } from "./type";

export interface ChatConfigType {
  openAIKey?: string;

  openAIHost?: string;
  openAIModel?: string;
  systemMessage?: string;
  temperature?: string;
  top_p?: string;

  unisoundAppKey?: string;
  unisoundSecret?: string;
}

export interface ConversationType {
  conversationId?: string;
}

export const chatDataAtom = atom<ChatMessage[]>([] as ChatMessage[]);

export const chatConfigAtom = atom<ChatConfigType>({});

export const conversationAtom = atom<ConversationType>({});

import { atom } from "nanostores";

import type { ChatMessage } from "./type";

const local = {
  getItem(key: string) {
    return undefined;
  },
};

export const chatDataAtom = atom(
  //
  JSON.parse(local.getItem("messages") || "[]") as ChatMessage[]
);

export interface ChatConfigType {
  openAIKey?: string;

  openAIHost?: string;
  openAIModel?: string;
  systemMessage?: string;

  unisoundAppKey?: string;
  unisoundSecret?: string;
}

export const chatConfigAtom = atom<ChatConfigType>({});

import { atom } from "nanostores";

import type { ChatItem, ChatMessage } from "./types";

export interface ChatAtomType {
  currentChat: ChatItem;
  chatList: ChatItem[];
}

export interface ChatConfigType {
  openAIKey?: string;

  openAIHost?: string;
  openAIModel?: string;
  temperature?: string;
  top_p?: string;
}

export const chatAtom = atom<ChatAtomType>({
  currentChat: { id: "-1", name: "" },
  chatList: [],
});

export const chatDataAtom = atom<ChatMessage[]>([] as ChatMessage[]);

export const chatConfigAtom = atom<ChatConfigType>({});

export const visibleAtom = atom({
  chatVisible: false,
  settingVisible: false,
  promptVisible: false,
  imageVisible: false,
});

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
  // [] as ChatMessage[],
);

export const chatConfigAtom = atom({
  visible: false,
  openAIKey: (local.getItem("openAIKey") || import.meta.env.OPENAI_API_KEY) as string | undefined,

  openAIServer: (local.getItem("openAIServer") || import.meta.env.OPENAI_API_SERVER) as string | undefined,
  systemMessage: local.getItem("systemMessage") as string | undefined,

  unisoundAppKey: (local.getItem("unisoundAppKey") || import.meta.env.UNISOUND_AI_KEY) as string | undefined,
  unisoundSecret: (local.getItem("unisoundSecret") || import.meta.env.UNISOUND_AI_SECRET) as string | undefined,
});

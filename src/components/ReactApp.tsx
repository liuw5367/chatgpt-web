import Chat from "./chat/index";
import { useEffect } from "react";
import { chatConfigAtom, chatDataAtom } from "./chat/atom";
import type { ChatMessage } from "./chat/type";
import { ConfigProvider } from "antd";

export default function App() {
  useEffect(() => {
    chatDataAtom.set(JSON.parse(localStorage.getItem("messages") || "[]") as ChatMessage[]);
    chatConfigAtom.set({
      visible: false,
      openAIKey: localStorage.getItem("openAIKey") || import.meta.env.OPENAI_API_KEY,

      openAIServer: localStorage.getItem("openAIServer") || import.meta.env.OPENAI_API_SERVER,
      openAIModel: localStorage.getItem("openAIModel") || import.meta.env.OPENAI_API_MODEL,
      systemMessage: localStorage.getItem("systemMessage") || undefined,

      unisoundAppKey: localStorage.getItem("unisoundAppKey") || import.meta.env.UNISOUND_AI_KEY,
      unisoundSecret: localStorage.getItem("unisoundSecret") || import.meta.env.UNISOUND_AI_SECRET,
    });
  }, [chatConfigAtom]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1777FF",
        },
      }}
    >
      <Chat />
    </ConfigProvider>
  );
}

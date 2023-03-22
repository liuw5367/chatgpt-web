import Chat from "./chat/index";
import { useEffect } from "react";
import { chatConfigAtom, chatDataAtom, conversationAtom } from "./chat/atom";
import type { ChatMessage } from "./chat/type";
import { ChakraProvider } from "@chakra-ui/react";
import { Header } from "./Header";
import { extendTheme } from "@chakra-ui/react";

import { SystemPrompt } from "./chat/SystemPrompt";
import { SettingPanel } from "./chat/SettingPanel";
import { ImagePanel } from "./chat/ImagePanel";

import "uno.css";
import "./markdown.css";
import "./app.css";

export default function App() {
  useEffect(() => {
    chatDataAtom.set(JSON.parse(localStorage.getItem("messages") || "[]") as ChatMessage[]);
    conversationAtom.set({
      conversationId: localStorage.getItem("conversationId"),
    });

    chatConfigAtom.set({
      openAIKey: localStorage.getItem("openAIKey") || import.meta.env.OPENAI_API_KEY,

      openAIHost: localStorage.getItem("openAIHost") || import.meta.env.OPENAI_API_HOST,
      openAIModel: localStorage.getItem("openAIModel") || import.meta.env.OPENAI_API_MODEL,
      systemMessage: localStorage.getItem("systemMessage") || undefined,

      unisoundAppKey: localStorage.getItem("unisoundAppKey") || import.meta.env.UNISOUND_AI_KEY,
      unisoundSecret: localStorage.getItem("unisoundSecret") || import.meta.env.UNISOUND_AI_SECRET,
    });
  }, []);

  const theme = extendTheme({ initialColorMode: "light", useSystemColorMode: true });

  return (
    <ChakraProvider theme={theme}>
      {loadIcons()}
      <div className={`v-screen h-screen flex flex-col`}>
        <Header />
        <div style={{ height: "calc(100% - 4rem)" }}>
          <Chat />
        </div>

        <SystemPrompt />
        <SettingPanel />
        <ImagePanel />
      </div>
    </ChakraProvider>
  );
}

/** 代码复制使用的图标。这里加载一下，不然无法显示 */
function loadIcons() {
  return (
    <>
      <div className="i-tabler-copy hidden" />
    </>
  );
}

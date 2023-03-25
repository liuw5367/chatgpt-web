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
    // 因为服务端渲染无法使用 localStorage，所以这里重新设置一次
    chatDataAtom.set(JSON.parse(localStorage.getItem("messages") || "[]") as ChatMessage[]);
    conversationAtom.set({
      conversationId: localStorage.getItem("conversationId") || undefined,
    });

    chatConfigAtom.set({
      openAIKey: localStorage.getItem("openAIKey") || undefined,
      openAIHost: localStorage.getItem("openAIHost") || undefined,
      openAIModel: localStorage.getItem("openAIModel") || undefined,
      systemMessage: localStorage.getItem("systemMessage") || undefined,
      temperature: localStorage.getItem("temperature") || undefined,
      top_p: localStorage.getItem("top_p") || undefined,
    });
  }, []);

  const theme = extendTheme({ initialColorMode: "dark", useSystemColorMode: true });

  return (
    <ChakraProvider theme={theme}>
      {loadIcons()}
      <div className={`v-screen h-screen flex flex-col overflow-hidden`}>
        <Header />
        <div className="w-full" style={{ height: "calc(100% - 4rem)" }}>
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

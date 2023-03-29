import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { useEffect } from "react";

import { chatConfigAtom, chatDataAtom, conversationAtom } from "./chat/atom";
import Chat from "./chat/index";
import type { ChatMessage } from "./chat/type";
import { Header } from "./Header";
import { ImagePanel, SettingPanel, SystemPromptPanel } from "./panels";

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
      temperature: localStorage.getItem("temperature") ?? "0.6",
      top_p: localStorage.getItem("top_p") ?? "1",
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

        <SystemPromptPanel />
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

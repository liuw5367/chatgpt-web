import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { useEffect } from "react";

import { Cache } from "../constants";
import { chatAtom, chatConfigAtom, chatDataAtom } from "./atom";
import Chat from "./chat/index";
import { Header } from "./Header";
import { ChatPanel, ImagePanel, SettingPanel, SystemPromptPanel } from "./panels";
import type { ChatItem } from "./types";
import { uuid } from "./utils";

export default function App() {
  useEffect(() => {
    // 因为服务端渲染无法使用 localStorage，所以这里重新设置一次

    const chatList: ChatItem[] = JSON.parse(localStorage.getItem(Cache.CHAT_LIST) || "[]");
    if (chatList.length === 0) {
      const chatId = uuid();
      const chatItem: ChatItem = {
        id: chatId,
        name: "New Chat",
        conversationId: localStorage.getItem("conversationId") || undefined,
      };
      chatList.push(chatItem);

      localStorage.setItem(Cache.CHAT_ID, chatId);
      localStorage.setItem(Cache.CHAT_LIST, JSON.stringify(chatList));
      const messagesJson = localStorage.getItem("messages") || "[]";
      localStorage.setItem(chatId, messagesJson);
      localStorage.removeItem("messages");
    }
    const chatId = localStorage.getItem(Cache.CHAT_ID) || "";
    const messagesJson = localStorage.getItem(chatId) || "[]";
    const chatItem = chatList.find((v) => v.id === chatId);

    chatAtom.set({ ...chatAtom.get(), chatList, currentChat: chatItem as ChatItem });
    chatDataAtom.set(JSON.parse(messagesJson) || []);

    chatConfigAtom.set({
      openAIKey: localStorage.getItem("openAIKey") || undefined,
      openAIHost: localStorage.getItem("openAIHost") || undefined,
      openAIModel: localStorage.getItem("openAIModel") || undefined,
      temperature: localStorage.getItem("temperature") ?? "0.6",
      top_p: localStorage.getItem("top_p") ?? "1",
    });
  }, []);

  const theme = extendTheme({ initialColorMode: "system", useSystemColorMode: true });

  return (
    <ChakraProvider theme={theme}>
      {loadIcons()}
      <div className={`v-screen h-screen flex flex-col overflow-hidden`}>
        <Header />
        <div className="w-full" style={{ height: "calc(100% - 4rem)" }}>
          <Chat />
        </div>

        <ChatPanel />
        <ImagePanel />
        <SettingPanel />
        <SystemPromptPanel />
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

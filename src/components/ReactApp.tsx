import "./i18n";

import { ChakraProvider, extendTheme, useBreakpointValue } from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { visibleAtom } from "./atom";
import Chat from "./chat/index";
import { Header } from "./Header";
import { ChatPanel, ImagePanel, SettingPanel, SystemPromptPanel } from "./panels";
import { loadCache } from "./storage";
import { addCodeCopy } from "./utils";

export default function App() {
  const { t } = useTranslation();
  const theme = extendTheme({ initialColorMode: "system", useSystemColorMode: true });

  useEffect(() => {
    loadCache(t("chat.new"));
    addCodeCopy();
  }, []);

  return (
    <ChakraProvider theme={theme}>
      {loadIcons()}
      <div className={`v-screen h-screen flex flex-col overflow-hidden`}>
        <Header />
        <Content />

        <ImagePanel />
        <SettingPanel />
      </div>
    </ChakraProvider>
  );
}

function Content() {
  const lg = useBreakpointValue({ base: false, lg: true }, { fallback: "base" });
  const xl = useBreakpointValue({ base: false, xl: true }, { fallback: "base" });
  const { chatVisible, promptVisible } = useStore(visibleAtom);

  const [chatVisibleState, setChatVisibleState] = useState(chatVisible);
  const [promptVisibleState, setPromptVisibleState] = useState(promptVisible);

  const [showChatSide, setShowChatSide] = useState(false);
  const [showPromptSide, setShowPromptSide] = useState(false);

  const showChatSideRef = useRef(showChatSide);
  const showPromptSideRef = useRef(showPromptSide);

  useEffect(() => {
    const showChat = !showPromptSideRef.current && chatVisible;
    const showPrompt = !showChatSideRef.current && promptVisible;
    showChatSideRef.current = showChat;
    setShowChatSide(showChat);
    showPromptSideRef.current = showPrompt;
    setShowPromptSide(showPrompt);

    // 因为drawer的阴影会闪一下，所以保证 showChatSide，chatVisible 两个 state 是同时变化的
    setChatVisibleState(chatVisible);
    setPromptVisibleState(promptVisible);
  }, [xl, lg, chatVisible, promptVisible, setShowChatSide, setShowPromptSide]);

  return (
    <div className="w-full flex" style={{ height: "calc(100% - 4rem)" }}>
      <ChatPanel chatVisible={chatVisibleState} type={xl || (lg && showChatSide) ? "side" : "drawer"} />
      <div className="w-full h-full">
        <Chat />
      </div>
      <SystemPromptPanel
        promptVisible={promptVisibleState}
        sideWidth="min-w-100 max-w-100"
        type={xl || (lg && showPromptSide) ? "side" : "drawer"}
      />
    </div>
  );
}

/** 代码复制使用的图标。这里加载一下，不然无法显示 */
const loadIcons = () => (
  <>
    <div className="i-tabler-copy hidden" />
  </>
);

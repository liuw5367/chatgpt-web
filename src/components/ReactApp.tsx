import "./i18n";

import { ChakraProvider, extendTheme, useBreakpointValue } from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { useEffect } from "react";
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
  const mdChatVisible = useBreakpointValue({ base: false, lg: true }, { fallback: "base" });
  const xlPromptVisible = useBreakpointValue({ base: false, xl: true }, { fallback: "base" });
  const { chatVisible, promptVisible } = useStore(visibleAtom);

  return (
    <div className="w-full flex" style={{ height: "calc(100% - 4rem)" }}>
      <ChatPanel type={mdChatVisible && chatVisible ? "side" : "drawer"} />
      <div className="w-full h-full">
        <Chat />
      </div>
      <SystemPromptPanel sideWidth="min-w-100 max-w-100" type={xlPromptVisible && promptVisible ? "side" : "drawer"} />
    </div>
  );
}

/** 代码复制使用的图标。这里加载一下，不然无法显示 */
const loadIcons = () => (
  <>
    <div className="i-tabler-copy hidden" />
  </>
);

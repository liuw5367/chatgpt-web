import "./i18n";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import Chat from "./chat/index";
import { Header } from "./Header";
import { ChatPanel, ImagePanel, SettingPanel, SystemPromptPanel } from "./panels";
import { loadCache } from "./storage";

export default function App() {
  const { t } = useTranslation();
  const theme = extendTheme({ initialColorMode: "system", useSystemColorMode: true });

  useEffect(() => {
    loadCache(t("chat.new"));
  }, []);

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
const loadIcons = () => (
  <>
    <div className="i-tabler-copy hidden" />
  </>
);

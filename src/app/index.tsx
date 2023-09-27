import { ChakraProvider, extendTheme, useMediaQuery } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

import Chat from './chat';
import { Header } from './Header';
import { useTranslation } from './i18n';
import { ChatPanel, ImagePanel, SettingPanel, SystemPromptPanel } from './panels';
import { loadCache } from './storage';
import { visibleStore } from './store';
import { addCodeCopy } from './utils';

export default function App() {
  const { t } = useTranslation();
  const theme = extendTheme({ initialColorMode: 'system', useSystemColorMode: true });

  useEffect(() => {
    loadCache(t('New Chat'));
    addCodeCopy();
    const loading = document.querySelector('#app-loading');
    if (loading && loading.parentNode) {
      loading.remove();
    }
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
  // 和 tailwind 保持一致
  const [lg] = useMediaQuery('(min-width: 1023.9px)');
  const [xl] = useMediaQuery('(min-width: 1279.9px)');
  const chatVisible = visibleStore((s) => s.chatVisible);
  const promptVisible = visibleStore((s) => s.promptVisible);

  const [chatVisibleState, setChatVisibleState] = useState(chatVisible);
  const [promptVisibleState, setPromptVisibleState] = useState(promptVisible);

  const [showChatSide, setShowChatSide] = useState(false);
  const [showPromptSide, setShowPromptSide] = useState(false);

  const showChatSideRef = useRef(showChatSide);
  const showPromptSideRef = useRef(showPromptSide);

  useEffect(() => {
    const lg = window.matchMedia('(min-width: 1023.9px)').matches;
    if (lg) {
      visibleStore.setState({ chatVisible: true });
    }
  }, []);

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

  const leftSide = xl || (lg && showChatSide);
  const rightSide = xl || (lg && showPromptSide);

  return (
    <div
      className="w-full flex flex-1 overflow-hidden"
      style={{ backgroundColor: 'var(--chakra-colors-chakra-body-bg)' }}
    >
      <ChatPanel chatVisible={chatVisibleState} type={leftSide ? 'side' : 'drawer'} />
      <div
        className="h-full w-full"
        style={{
          maxWidth:
            leftSide && chatVisibleState && rightSide && promptVisibleState
              ? 'calc(100% - 45rem)'
              : leftSide && chatVisibleState
              ? 'calc(100% - 20rem)'
              : rightSide && promptVisibleState
              ? 'calc(100% - 25rem)'
              : '100%',
        }}
      >
        <Chat />
      </div>
      <SystemPromptPanel
        promptVisible={promptVisibleState}
        sideWidth="min-w-100 max-w-100"
        type={rightSide ? 'side' : 'drawer'}
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

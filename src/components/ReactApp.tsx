import { useMediaQuery } from '@chakra-ui/react';
import { useStore } from '@nanostores/react';
import { useTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react';

import { visibleAtom } from './atom';
import Chat from './chat/index';
import { Header } from './Header';
import { ChatPanel, ImagePanel, SettingPanel, SystemPromptPanel } from './panels';
import { loadCache } from './storage';
import { addCodeCopy } from './utils';

export default function App() {
  const { t } = useTranslation();

  useEffect(() => {
    loadCache(t('New Chat'));
    addCodeCopy();
  }, []);

  return (
    <>
      {loadIcons()}
      <div className={`v-screen h-screen flex flex-col overflow-hidden`}>
        <Header />
        <Content />

        <ImagePanel />
        <SettingPanel />
      </div>
    </>
  );
}

function Content() {
  // 和 tailwind 保持一致
  const [lg] = useMediaQuery('(min-width: 1023.9px)');
  const [xl] = useMediaQuery('(min-width: 1279.9px)');
  const { chatVisible, promptVisible } = useStore(visibleAtom);

  const [chatVisibleState, setChatVisibleState] = useState(chatVisible);
  const [promptVisibleState, setPromptVisibleState] = useState(promptVisible);

  const [showChatSide, setShowChatSide] = useState(false);
  const [showPromptSide, setShowPromptSide] = useState(false);

  const showChatSideRef = useRef(showChatSide);
  const showPromptSideRef = useRef(showPromptSide);

  useEffect(() => {
    const lg = window.matchMedia('(min-width: 1023.9px)').matches;
    if (lg) {
      visibleAtom.set({ ...visibleAtom.get(), chatVisible: true });
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
    <div className="w-full flex flex-1 overflow-hidden">
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

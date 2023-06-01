import { Button, IconButton, Progress, useToast } from '@chakra-ui/react';
import { useStore } from '@nanostores/react';
import {
  IconBrandTelegram,
  IconClearAll,
  IconEraser,
  IconLoader3,
  IconMessage,
  IconMessagePlus,
  IconMessages,
  IconMessagesOff,
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerPause,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { useDebounceEffect } from 'ahooks';
import { useTranslation } from 'next-i18next';
import React, { createRef, useEffect, useRef, useState } from 'react';

import { AutoResizeTextarea } from '@/components';

import VoiceView, { VoiceRef } from '../ai';
import { ASRStatusEnum } from '../ai/ASRView';
import { getUnisoundKeySecret, hasUnisoundConfig } from '../ai/Config';
import { TTSStatusEnum } from '../ai/TTSView';
import { chatAtom, chatConfigAtom, chatDataAtom, visibleAtom } from '../atom';
import { saveCurrentChatValue } from '../storage';
import type { ChatMessage } from '../types';
import { getCurrentTime, removeLn, scrollToElement, uuid } from '../utils';
import { Command } from './Command';
import ErrorItem from './ErrorItem';
import { MessageItem } from './MessageItem';
import { SearchSuggestions } from './SearchSuggestions';
import { estimateTokens } from './token';
import { UsageTips } from './UsageTips';

export default function Page() {
  const { t } = useTranslation();
  const toast = useToast({ position: 'top', isClosable: true });
  const messageList = useStore(chatDataAtom);
  const chatConfig = useStore(chatConfigAtom);
  const enterSend = chatConfig.enterSend === '1';
  const { currentChat } = useStore(chatAtom);
  const { conversationId } = currentChat;
  const inputRef = createRef<HTMLTextAreaElement>();
  const [inputContent, setInputContent] = useState('');
  const composingRef = useRef(false);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');

  const [asrState, setAsrState] = useState<ASRStatusEnum>(ASRStatusEnum.NORMAL);
  const [ttsState, setTtsState] = useState<TTSStatusEnum>(TTSStatusEnum.NORMAL);
  const voiceRef = React.useRef<VoiceRef | null>();

  const [chatLoading, setChatLoading] = useState(false);
  const [chatAbortController, setAbortController] = useState<AbortController>();

  const [errorInfo, setErrorInfo] = useState<{ code: string; message?: string }>();

  const asrResultRef = useRef('');

  useEffect(() => {
    scrollToPageBottom({ behavior: 'auto' });
  }, []);

  useDebounceEffect(() => {
    const chatId = chatAtom.get().currentChat.id;
    localStorage.setItem(chatId, JSON.stringify(messageList));
  }, [messageList]);

  useEffect(() => {
    setErrorInfo(undefined);
  }, [currentChat.id]);

  function stopTTS() {
    voiceRef.current?.stopTts();
  }

  function playTTS(content: string = '') {
    voiceRef.current?.tts(content);
  }

  function handleAsrResult(result: string, changing: boolean) {
    setInputContent(asrResultRef.current + result);
    if (!changing) {
      asrResultRef.current += result;
    }
  }

  function checkUnisound() {
    const config = getUnisoundKeySecret();
    if (!config.KEY) {
      toast({ status: 'error', title: t('please enter unisound AppKey') });
      return true;
    }
    return false;
  }

  function handleTTSClick() {
    if (checkUnisound()) return;

    if (ttsState !== TTSStatusEnum.NORMAL) {
      stopTTS();
    } else {
      const data = [...messageList].filter((v) => v.role === 'assistant').reverse();
      const content = data?.[0]?.content;
      if (content) {
        voiceRef.current?.stopAsr();
        playTTS(content);
      }
    }
  }

  function handleASRClick() {
    if (checkUnisound()) return;

    stopTTS();
    if (asrState === ASRStatusEnum.RECORDING) {
      voiceRef.current?.stopAsr();
    } else {
      voiceRef.current?.asr();
    }
  }

  function stopGenerate() {
    chatAbortController?.abort();
    setChatLoading(false);
    scrollToPageBottom();
  }

  async function handleSendClick(inputValue = inputContent) {
    if (chatLoading) {
      stopGenerate();
      return;
    }
    await sendMessage(inputValue);
  }

  function buildRequestMessages(
    messageList: ChatMessage[],
    question: ChatMessage,
    conversationId: string | undefined,
    systemMessage?: string,
  ) {
    let maxModelTokens = 4095;
    /** 发送出去的内容最多可使用的 token */
    let maxTokens = 3000;

    const model = chatConfig.openAIModel || '';
    if (model.toLowerCase().includes('gpt-4')) {
      if (model.toLowerCase().includes('32k')) {
        const maxResponseTokens = 8192;
        maxModelTokens = 32768;
        maxTokens = maxModelTokens - maxResponseTokens;
      } else {
        const maxResponseTokens = 2048;
        maxModelTokens = 8192;
        maxTokens = maxModelTokens - maxResponseTokens;
      }
    }

    let tokenCount = estimateTokens(question.content) + estimateTokens(systemMessage);
    const list: ChatMessage[] = [];
    if (conversationId) {
      const conversationList = [...messageList.filter((v) => v.conversationId === conversationId)].reverse();
      conversationList.some((item) => {
        const token = tokenCount + (item.token || 0);
        if (token > maxTokens) {
          // 已超出 token 数量限制，跳出
          return true;
        }
        list.push(item);
        tokenCount = token;
        return false;
      });
    }
    list.reverse();

    console.log('messages token：', [tokenCount]);

    list.push(question);
    const messages = list.map(({ role, content }) => ({ role, content }));
    if (systemMessage) {
      messages.unshift({ role: 'system', content: systemMessage });
    }
    return { messages };
  }

  async function sendMessage(inputValue = inputContent, systemMessage = currentChat.systemMessage) {
    if (chatLoading) {
      toast({ status: 'warning', title: t('Generating') });
      return;
    }
    const content = removeLn(inputValue);
    if (!systemMessage && !content) {
      toast({ status: 'info', title: t('please enter content') });
      return;
    }
    stopTTS();
    setErrorInfo(undefined);

    const question: ChatMessage = {
      id: uuid(),
      role: 'user',
      content,
      time: getCurrentTime(),
      token: estimateTokens(content),
      prompt: systemMessage,
      conversationId,
    };
    chatDataAtom.set([...messageList, question]);
    setInputContent('');
    asrResultRef.current = '';
    scrollToPageBottom();

    setChatLoading(true);

    const abortController = new AbortController();
    setAbortController(abortController);

    let assistantMessage = '';

    function onProgress(content: string) {
      if (!content || (content === '\n' && assistantMessage.endsWith('\n'))) return;
      setCurrentAssistantMessage((draft) => {
        assistantMessage = draft + content;
        return assistantMessage;
      });
      scrollToPageBottom();
    }

    try {
      const { messages } = buildRequestMessages(messageList, question, conversationId, systemMessage);
      const response = await fetch('/api/generate', {
        method: 'POST',
        signal: abortController.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          apiKey: chatConfig.openAIKey,
          host: chatConfig.openAIHost,
          model: chatConfig.openAIModel,
          config: {
            temperature: chatConfig.temperature ? Number(chatConfig.temperature) : undefined,
            top_p: chatConfig.top_p ? Number(chatConfig.top_p) : undefined,
          },
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        if (json?.error?.code || json?.error?.message) {
          setErrorInfo(json.error as any);
          scrollToPageBottom();
        } else {
          toast({ status: 'error', title: t('toast.error.request') });
        }
        setChatLoading(false);
        return;
      }
      if (!response.body) {
        toast({ status: 'warning', title: t('No Data') });
        setChatLoading(false);
        return;
      }
      // 等待接口完全返回
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        onProgress(decoder.decode(value));
      }
      addResultItem(content, assistantMessage, systemMessage, conversationId);
    } catch (e) {
      console.log(e);
      addResultItem(content, assistantMessage, systemMessage, conversationId);
    }
  }

  function addResultItem(content: string, assistantMessage: string, prompt: string = '', conversationId?: string) {
    // 完整的返回值
    console.log([assistantMessage]);
    if (!assistantMessage) return;

    chatDataAtom.set([
      ...chatDataAtom.get(),
      {
        id: uuid(),
        role: 'assistant',
        content: assistantMessage,
        token: estimateTokens(assistantMessage),
        question: content,
        prompt,
        conversationId,
      },
    ]);
    setChatLoading(false);
    setCurrentAssistantMessage('');
    scrollToPageBottom();
  }

  function handleClearClick() {
    stopTTS();
    voiceRef.current?.stopAsr();
    stopGenerate();
    setInputContent('');
    asrResultRef.current = '';
    chatDataAtom.set([]);
  }

  async function handleRegenerate(item: ChatMessage) {
    const content = item.role === 'user' ? item.content : item.question;
    updateConversationId(item.conversationId);
    updateSystemPrompt(item.prompt);
    await sendMessage(content, item.prompt);
  }

  function handleMessageDelete(item: ChatMessage) {
    chatDataAtom.set(chatDataAtom.get().filter((v) => v.id !== item.id));
  }

  function updateSystemPrompt(prompt?: string) {
    saveCurrentChatValue('systemMessage', prompt as string);
  }

  function updateConversationId(conversationId?: string) {
    saveCurrentChatValue('conversationId', conversationId as string);
  }

  function handleConversationClick() {
    if (conversationId) {
      updateConversationId();
      toast.closeAll();
      toast({ status: 'info', title: t('conversation.off') });
    } else {
      updateConversationId(uuid());
      toast.closeAll();
      toast({ status: 'success', title: t('conversation.on'), description: t('conversation.desc') });
    }
  }

  const actions = (
    <div className="flex flex-row flex-wrap items-center justify-between space-x-0 lg:space-x-3">
      <div className="mb-4 flex flex-row items-center space-x-3">
        <Button
          onClick={() => handleSendClick()}
          colorScheme={chatLoading ? 'red' : 'teal'}
          variant={chatLoading ? 'outline' : 'solid'}
        >
          {chatLoading ? ( //
            <IconLoader3 stroke={1.5} className="rotate-img" />
          ) : (
            <IconBrandTelegram stroke={1.5} />
          )}
        </Button>
        <IconButton aria-label="Clear" onClick={handleClearClick} icon={<IconClearAll stroke={1.5} />} />
      </div>
      <div className="mb-4 flex flex-row items-center space-x-3">
        {hasUnisoundConfig() && (
          <>
            <IconButton
              aria-label="ASR" //
              onClick={handleASRClick}
              colorScheme={asrState === ASRStatusEnum.RECORDING ? 'red' : 'gray'}
              variant={asrState === ASRStatusEnum.RECORDING ? 'outline' : 'solid'}
              icon={
                asrState === ASRStatusEnum.RECORDING ? (
                  <IconMicrophoneOff stroke={1.5} />
                ) : (
                  <IconMicrophone stroke={1.5} />
                )
              }
            />
            {ttsState === TTSStatusEnum.PLAYING && (
              <IconButton
                aria-label="TTS" //
                onClick={handleTTSClick}
                colorScheme={ttsState === TTSStatusEnum.PLAYING ? 'red' : 'gray'}
                variant={ttsState === TTSStatusEnum.PLAYING ? 'outline' : 'solid'}
                icon={
                  ttsState === TTSStatusEnum.PLAYING ? (
                    <IconPlayerPause stroke={1.5} />
                  ) : (
                    <IconPlayerPlay stroke={1.5} />
                  )
                }
              />
            )}
          </>
        )}
        <IconButton
          aria-label="Conversation"
          title="Continuous conversation"
          colorScheme={conversationId ? 'green' : 'gray'}
          icon={conversationId ? <IconMessages stroke={1.5} /> : <IconMessagesOff stroke={1.5} />}
          onClick={handleConversationClick}
        />
        <IconButton
          aria-label="SystemPrompt"
          title={currentChat.systemMessage}
          colorScheme={currentChat.systemMessage ? 'telegram' : 'gray'}
          icon={currentChat.systemMessage ? <IconMessagePlus stroke={1.5} /> : <IconMessage stroke={1.5} />}
          onClick={() => {
            const values = visibleAtom.get();
            visibleAtom.set({ ...values, promptVisible: !values.promptVisible });
          }}
        />
      </div>
    </div>
  );

  const renderTips = (
    <>
      <Command
        value={inputContent}
        onPromptClick={(v) => {
          setInputContent(v);
          inputRef.current?.focus();
        }}
      />
      {chatConfig.searchSuggestions === '1' && (
        <SearchSuggestions
          value={inputContent}
          onPromptClick={(v) => {
            setInputContent(v);
            inputRef.current?.focus();
          }}
        />
      )}
    </>
  );

  const renderMessageList = (
    <div className="w-full flex flex-1 flex-col items-center overflow-x-hidden overflow-y-auto p-4">
      <div className="relative w-full flex flex-col">
        {messageList?.map((item) => (
          <MessageItem
            key={item.id}
            item={item}
            onDelete={handleMessageDelete}
            onPlay={(item) => playTTS(item.content)}
            onRegenerate={handleRegenerate}
            onRetry={(item) => {
              setInputContent(item.content);
              inputRef.current?.focus();
              updateConversationId(item.conversationId);
              updateSystemPrompt(item.prompt);
            }}
          />
        ))}
        {currentAssistantMessage && (
          <MessageItem
            key={'-1'}
            item={{
              id: '-1',
              role: 'assistant',
              content: currentAssistantMessage,
            }}
          />
        )}
        <ErrorItem error={errorInfo} onClose={() => setErrorInfo(undefined)} />
        <div id="chat-bottom" />
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col">
      {messageList && messageList.length > 0 ? (
        <>{renderMessageList}</>
      ) : (
        <div className="h-full flex flex-col items-center justify-end overflow-y-auto">
          <div className="w-full py-4 pl-8 pr-4">
            <UsageTips />
          </div>
        </div>
      )}
      {chatLoading && <Progress size="xs" isIndeterminate />}
      <div id="chat-bottom-wrapper" className="flex flex-col items-center border-t px-6 pt-3">
        <div className="w-full flex flex-col justify-end space-y-3">
          {renderTips}
          <AutoResizeTextarea
            ref={inputRef}
            minRows={2}
            maxRows={10}
            enterKeyHint={enterSend ? 'send' : undefined}
            className="placeholder:text-[14px]"
            value={inputContent === '\n' ? '' : inputContent}
            onCompositionStart={() => (composingRef.current = true)}
            onCompositionEnd={() => (composingRef.current = false)}
            placeholder={enterSend ? t('chat.enterPlaceholder') || '' : t('chat.placeholder') || ''}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                if (!inputContent?.trim()) {
                  const content = [...messageList].reverse().find((v) => v.role === 'user' && v.content)?.content;
                  if (content) {
                    setInputContent(content);
                  }
                }
                return;
              }
              if (enterSend && !composingRef.current && e.key === 'Enter') {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                  return;
                }
                handleSendClick();
                return;
              }
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleSendClick();
              }
            }}
          />
          {actions}
        </div>
      </div>
      <VoiceView
        ref={(ref) => (voiceRef.current = ref)}
        chatLoading={chatLoading}
        onAsrResultChange={handleAsrResult}
        onAsrStatusChange={setAsrState}
        onTtsStatusChange={setTtsState}
      />
    </div>
  );
}

export function scrollToPageBottom(options: ScrollIntoViewOptions = {}) {
  scrollToElement('chat-bottom', { behavior: 'smooth', block: 'end', ...options });
}

import { Button, IconButton, Progress, useToast } from '@chakra-ui/react';
import {
  IconAdjustmentsAlt,
  IconAdjustmentsPlus,
  IconBrandTelegram,
  IconClearAll,
  IconLoader3,
  IconMessages,
  IconMessagesOff,
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerPause,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { useDebounceEffect, useMemoizedFn } from 'ahooks';
import React, { createRef, useEffect, useRef, useState } from 'react';

import { AutoResizeTextarea } from '../../components';
import { localDB } from '../../utils/LocalDB';
import { useTranslation } from '../i18n';
import { chatConfigStore, chatDataStore, chatListStore, visibleStore } from '../store';
import type { ChatMessage } from '../types';
import { getCurrentTime, moveCursorToEnd, removeLn, request, scrollToElement, speakText, uuid } from '../utils';
import { modelList } from '../panels';
import { Command } from './Command';
import ErrorItem from './ErrorItem';
import { MessageItem } from './MessageItem';
import { Recognition } from './Recognition';
import { SearchSuggestions } from './SearchSuggestions';
import { estimateTokens } from './token';
import { UsageTips } from './UsageTips';
import { defaultModel } from '@/constants';

export default function Page() {
  const { t } = useTranslation();
  const toast = useToast({ position: 'top', isClosable: true });
  const messageList = chatDataStore((s) => s.data);
  const currentChat = chatListStore((s) => s.currentChat());
  const updateChat = chatListStore((s) => s.updateChat);

  const chatConfig = chatConfigStore();
  const enterSend = chatConfig.enterSend === '1';
  const inputRef = createRef<HTMLTextAreaElement>();
  const [inputContent, setInputContent] = useState('');
  const composingRef = useRef(false);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState('');

  const [recording, setRecording] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const recognitionRef = React.useRef<Recognition>(new Recognition());

  const [chatLoading, setChatLoading] = useState(false);
  const [chatAbortController, setAbortController] = useState<AbortController>();

  const [errorInfo, setErrorInfo] = useState<{ code: string; message?: string }>();

  const asrResultRef = useRef('');
  const [isGenerated, setGenerated] = useState(false);

  const stopGenerate = useMemoizedFn(() => {
    chatAbortController?.abort();
    setChatLoading(false);
  });

  useEffect(() => {
    setGenerated(false);
    stopGenerate();
  }, [currentChat.id]);

  useEffect(() => {
    recognitionRef.current?.setListener(handleAsrResult);
    scrollToPageBottom({ behavior: 'auto' });
  }, []);

  useDebounceEffect(() => {
    const chatId = chatListStore.getState().currentChat().id;
    localDB.setItem(chatId, messageList);
  }, [messageList]);

  useEffect(() => {
    setErrorInfo(undefined);
  }, [currentChat.id]);

  function stopTTS() {
    setTtsPlaying(false);
    window.speechSynthesis?.cancel();
  }

  function playTTS(content: string = '') {
    speakText(content, (value) => {
      setTtsPlaying(value);
    });
  }

  function handleAsrResult(result: string) {
    setInputContent(result);
    asrResultRef.current = result;
  }

  function handleTTSClick() {
    if (ttsPlaying) {
      stopTTS();
    }
    else {
      const data = [...messageList].filter((v) => v.role === 'assistant').reverse();
      const content = data?.[0]?.content;
      if (content) {
        recognitionRef.current?.stop();
        playTTS(content);
      }
    }
  }

  function handleASRClick() {
    stopTTS();
    if (recording) {
      recognitionRef.current?.stop();
    }
    else {
      recognitionRef.current?.start();
    }
    setRecording(!recording);
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
    let tokenCount = estimateTokens(question.content) + estimateTokens(systemMessage);
    const list: ChatMessage[] = [];
    const conversationList = conversationId ? messageList.filter((v) => v.conversationId === conversationId).reverse() : [];

    const modelId = chatConfig.openAIModel || defaultModel;
    const target = modelList.find((v) => v.value === modelId);
    if (target) {
      const maxModelTokens = target.token;

      if (maxModelTokens != null) {
        /** 发送出去的内容最多可使用的 token */
        const maxTokens = Math.floor(maxModelTokens / 4 * 3);

        conversationList.some((item) => {
          const token = tokenCount + (item.token || 0);
          if (token > maxTokens) {
            if (tokenCount > maxModelTokens) {
              // 已超出 token 数量限制，跳出
              return true;
            }
            // 没超出全部 token 数量限制，将剩余的内容放入列表，跳出
            list.push(item);
            tokenCount = token;
            return true;
          }
          list.push(item);
          tokenCount = token;
          return false;
        });
      }
    }
    else {
      list.push(...conversationList);
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
      conversationId: currentChat.conversationId,
    };
    chatDataStore.setState({ data: [...messageList, question] });
    setInputContent('');
    asrResultRef.current = '';
    scrollToElement(question.id, { block: 'start' });
    setGenerated(true);

    setChatLoading(true);

    const abortController = new AbortController();
    setAbortController(abortController);

    let assistantMessage = '';

    function onProgress(content: string) {
      if (!content || (content === '\n' && assistantMessage.endsWith('\n'))) {
        return;
      }
      setCurrentAssistantMessage((draft) => {
        assistantMessage = draft + content;
        return assistantMessage;
      });
    }

    try {
      const model = currentChat.openAIModel ?? chatConfig.openAIModel;
      const temperature = currentChat.temperature ?? chatConfig.temperature;
      const top_p = currentChat.top_p ?? chatConfig.top_p;

      const { messages } = buildRequestMessages(messageList, question, currentChat.conversationId, systemMessage);
      const response = await request('/api/generate', {
        method: 'POST',
        signal: abortController.signal,
        body: JSON.stringify({
          messages,
          apiKey: chatConfig.openAIKey,
          host: chatConfig.openAIHost,
          model,
          config: {
            temperature: temperature ? Number(temperature) : undefined,
            top_p: top_p ? Number(top_p) : undefined,
          },
        }),
      });

      if (!response.ok) {
        try {
          const json = await response.json();
          if (json?.error?.code || json?.error?.message) {
            setErrorInfo(json.error as any);
          }
          else {
            toast({ status: 'error', title: t('toast.error.request') });
          }
        }
        catch {
          setErrorInfo({ code: `${response.status}`, message: response.statusText });
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
      const decoder = new TextDecoder('utf8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        onProgress(decoder.decode(value));
      }
      addResultItem(content, assistantMessage, systemMessage, currentChat.conversationId);
    }
    catch (error) {
      console.log(error);
      addResultItem(content, assistantMessage, systemMessage, currentChat.conversationId);
    }
  }

  function addResultItem(content: string, assistantMessage: string, prompt: string = '', conversationId?: string) {
    // 完整的返回值
    console.log([assistantMessage]);
    if (!assistantMessage) {
      return;
    }

    chatDataStore.setState((state) => ({
      data: [
        ...state.data,
        {
          id: uuid(),
          role: 'assistant',
          content: assistantMessage,
          token: estimateTokens(assistantMessage),
          question: content,
          prompt,
          conversationId,
        },
      ],
    }));
    setChatLoading(false);
    setCurrentAssistantMessage('');
  }

  function handleClearClick() {
    stopTTS();
    recognitionRef.current?.stop();
    stopGenerate();
    setInputContent('');
    asrResultRef.current = '';
    chatDataStore.setState({ data: [] });
  }

  async function handleRegenerate(item: ChatMessage) {
    const content = item.role === 'user' ? item.content : item.question;
    updateConversationId(item.conversationId);
    updateSystemPrompt(item.prompt);
    await sendMessage(content, item.prompt);
  }

  function handleMessageDelete(item: ChatMessage) {
    chatDataStore.setState((state) => ({ data: state.data.filter((v) => v.id !== item.id) }));
  }

  function updateSystemPrompt(prompt?: string) {
    updateChat(currentChat.id, { systemMessage: prompt });
  }

  function updateConversationId(conversationId?: string) {
    updateChat(currentChat.id, { conversationId });
  }

  function handleConversationClick() {
    if (currentChat.conversationId) {
      updateConversationId();
      toast.closeAll();
      toast({ status: 'info', title: t('conversation.off') });
    }
    else {
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
          {chatLoading
            ? (<IconLoader3 stroke={1.5} className="rotate-img" />)
            : (<IconBrandTelegram stroke={1.5} />)}
        </Button>
        <IconButton aria-label="Clear" onClick={handleClearClick} icon={<IconClearAll stroke={1.5} />} />
      </div>
      <div className="mb-4 flex flex-row items-center space-x-3">
        {ttsPlaying && (
          <IconButton
            aria-label="TTS" //
            onClick={handleTTSClick}
            colorScheme={ttsPlaying ? 'red' : 'gray'}
            variant={ttsPlaying ? 'outline' : 'solid'}
            icon={ttsPlaying ? <IconPlayerPause stroke={1.5} /> : <IconPlayerPlay stroke={1.5} />}
          />
        )}
        <IconButton
          aria-label="ASR" //
          onClick={handleASRClick}
          colorScheme={recording ? 'red' : 'gray'}
          variant={recording ? 'outline' : 'solid'}
          icon={recording ? <IconMicrophoneOff stroke={1.5} /> : <IconMicrophone stroke={1.5} />}
        />
        <IconButton
          aria-label="Conversation"
          title="Continuous conversation"
          colorScheme={currentChat.conversationId ? 'green' : 'gray'}
          icon={currentChat.conversationId ? <IconMessages stroke={1.5} /> : <IconMessagesOff stroke={1.5} />}
          onClick={handleConversationClick}
        />
        <IconButton
          aria-label="SystemPrompt"
          title={currentChat.systemMessage}
          colorScheme={currentChat.systemMessage ? 'telegram' : 'gray'}
          icon={currentChat.systemMessage ? <IconAdjustmentsPlus stroke={1.5} /> : <IconAdjustmentsAlt stroke={1.5} />}
          onClick={() => {
            visibleStore.setState((state) => ({ promptVisible: !state.promptVisible }));
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

  function renderItem(item: ChatMessage | undefined, index: number, isList = false) {
    if (!item) {
      return;
    }

    const length = messageList.length;

    if (chatLoading) {
      if (isList) {
        // 列表：加载中并且最后一个是问题
        if (index === length - 1 && item.role === 'user') {
          return null;
        }
      }
      else if (index === length - 2) {
        return null;
      }
    }
    else if (isList && index >= length - 2) {
      return null;
    }

    return (
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
    );
  }

  const renderMessageList = (
    <div className="w-full flex flex-1 flex-col items-center overflow-x-hidden overflow-y-auto p-4">
      <div className="relative w-full flex flex-col">
        {messageList?.map((item, index) => renderItem(item, index, true))}

        <div style={{ minHeight: isGenerated ? 'calc(100vh - 64px - 143px - 64px)' : undefined }}>
          {

            renderItem(messageList[messageList.length - 2], messageList.length - 2)
          }
          {

            renderItem(messageList[messageList.length - 1], messageList.length - 1)
          }
          {currentAssistantMessage && (
            <MessageItem
              item={{
                id: '-1',
                role: 'assistant',
                content: currentAssistantMessage,
              }}
            />
          )}
          <ErrorItem error={errorInfo} onClose={() => setErrorInfo(undefined)} />
        </div>

        <div id="chat-bottom" />
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col">
      {messageList && messageList.length > 0
        ? (
          <>{renderMessageList}</>
          )
        : (
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
                    moveCursorToEnd(e.target as HTMLTextAreaElement);
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
    </div>
  );
}

export function scrollToPageBottom(options: ScrollIntoViewOptions = {}) {
  scrollToElement('chat-bottom', { behavior: 'smooth', block: 'end', ...options });
}

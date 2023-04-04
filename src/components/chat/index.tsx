import { Button, IconButton, Progress, useToast } from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
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
} from "@tabler/icons-react";
import { useDebounceEffect } from "ahooks";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { chatAtom, chatConfigAtom, chatDataAtom, visibleAtom } from "../atom";
import { AutoResizeTextarea } from "../AutoResizeTextarea";
import { saveCurrentChatValue } from "../storage";
import type { ChatMessage } from "../types";
import { getCurrentTime, removeLn, scrollToElement, uuid } from "../utils";
import VoiceView, { VoiceRef } from "./ai";
import { ASRStatusEnum } from "./ai/ASRView";
import { getUnisoundKeySecret, hasUnisoundConfig } from "./ai/Config";
import { TTSStatusEnum } from "./ai/TTSView";
import { Command } from "./Command";
import ErrorItem from "./ErrorItem";
import { MessageItem } from "./MessageItem";
import { estimateTokens } from "./token";

export default function Page() {
  const { t } = useTranslation();
  const toast = useToast({ position: "top", isClosable: true });
  const messageList = useStore(chatDataAtom);
  const chatConfig = useStore(chatConfigAtom);
  const { currentChat } = useStore(chatAtom);
  const { conversationId } = currentChat;
  const [inputContent, setInputContent] = useState("");
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState("");

  const [asrState, setAsrState] = useState<ASRStatusEnum>(ASRStatusEnum.NORMAL);
  const [ttsState, setTtsState] = useState<TTSStatusEnum>(TTSStatusEnum.NORMAL);
  const voiceRef = React.useRef<VoiceRef | null>();

  const [chatLoading, setChatLoading] = useState(false);
  const [chatAbortController, setAbortController] = useState<AbortController>();

  const [errorInfo, setErrorInfo] = useState<{ code: string; message?: string }>();

  useEffect(() => {
    scrollToPageBottom({ behavior: "auto" });
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

  function playTTS(content: string = "") {
    voiceRef.current?.tts(content);
  }

  function handleAsrResult(result: string) {
    setInputContent(result);
  }

  function checkUnisound() {
    const config = getUnisoundKeySecret();
    if (!config.KEY) {
      toast({ status: "error", title: t("toast.empty.unisound") });
      return true;
    }
    return false;
  }

  function handleTTSClick() {
    if (checkUnisound()) return;

    if (ttsState !== TTSStatusEnum.NORMAL) {
      stopTTS();
    } else {
      const data = [...messageList].filter((v) => v.role === "assistant").reverse();
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
    systemMessage?: string
  ) {
    let maxModelTokens = 4095;
    /** 发送出去的内容最多可使用的 token */
    let maxTokens = 3000;

    const model = chatConfig.openAIModel || "";
    if (model.toLowerCase().includes("gpt-4")) {
      if (model.toLowerCase().includes("32k")) {
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

    console.log("messages token：", [tokenCount]);

    list.push(question);
    const messages = list.map(({ role, content }) => ({ role, content }));
    if (systemMessage) {
      messages.unshift({ role: "system", content: systemMessage });
    }
    return { messages };
  }

  async function sendMessage(inputValue = inputContent, systemMessage = currentChat.systemMessage) {
    if (chatLoading) {
      toast({ status: "warning", title: t("toast.generating") });
      return;
    }
    const content = removeLn(inputValue);
    if (!systemMessage && !content) {
      toast({ status: "info", title: t("toast.empty.content") });
      return;
    }
    stopTTS();
    setErrorInfo(undefined);

    const question: ChatMessage = {
      id: uuid(),
      role: "user",
      content,
      time: getCurrentTime(),
      token: estimateTokens(content),
      prompt: systemMessage,
      conversationId,
    };
    chatDataAtom.set([...messageList, question]);
    setInputContent("");
    scrollToPageBottom();

    setChatLoading(true);

    const abortController = new AbortController();
    setAbortController(abortController);

    let assistantMessage = "";

    function onProgress(content: string) {
      if (!content || (content === "\n" && assistantMessage.endsWith("\n"))) return;
      setCurrentAssistantMessage((draft) => {
        assistantMessage = draft + content;
        return assistantMessage;
      });
      scrollToPageBottom();
    }

    try {
      const { messages } = buildRequestMessages(messageList, question, conversationId, systemMessage);
      const response = await fetch("/api/generate", {
        method: "POST",
        signal: abortController.signal,
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
          toast({ status: "error", title: t("toast.error.request") });
        }
        setChatLoading(false);
        return;
      }
      if (!response.body) {
        toast({ status: "warning", title: t("toast.empty.data") });
        setChatLoading(false);
        return;
      }
      // 等待接口完全返回
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
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

  function addResultItem(content: string, assistantMessage: string, prompt: string = "", conversationId?: string) {
    // 完整的返回值
    console.log([assistantMessage]);
    if (!assistantMessage) return;

    chatDataAtom.set([
      ...chatDataAtom.get(),
      {
        id: uuid(),
        role: "assistant",
        content: assistantMessage,
        token: estimateTokens(assistantMessage),
        question: content,
        prompt,
        conversationId,
      },
    ]);
    setChatLoading(false);
    setCurrentAssistantMessage("");
    scrollToPageBottom();
  }

  function handleClearClick() {
    stopTTS();
    voiceRef.current?.stopAsr();
    stopGenerate();
    setInputContent("");
    chatDataAtom.set([]);
  }

  async function handleRegenerate(item: ChatMessage) {
    const content = item.role === "user" ? item.content : item.question;
    updateConversationId(item.conversationId);
    updateSystemPrompt(item.prompt);
    await sendMessage(content, item.prompt);
  }

  function handleMessageDelete(item: ChatMessage) {
    chatDataAtom.set(chatDataAtom.get().filter((v) => v.id !== item.id));
  }

  function updateSystemPrompt(prompt?: string) {
    saveCurrentChatValue("systemMessage", prompt as string);
  }

  function updateConversationId(conversationId?: string) {
    saveCurrentChatValue("conversationId", conversationId as string);
  }

  function handleConversationClick() {
    if (conversationId) {
      updateConversationId();
      toast.closeAll();
      toast({ status: "info", title: t("conversation.off") });
    } else {
      updateConversationId(uuid());
      toast.closeAll();
      toast({ status: "success", title: t("conversation.on"), description: t("conversation.desc") });
    }
  }

  const actions = (
    <div className="flex flex-row flex-wrap items-center justify-between space-x-0 lg:space-x-3">
      <div className="mb-4 flex flex-row items-center space-x-3">
        <Button
          onClick={() => handleSendClick()}
          colorScheme={chatLoading ? "red" : "teal"}
          variant={chatLoading ? "outline" : "solid"}
        >
          {chatLoading ? ( //
            <IconLoader3 stroke={1.5} className="rotate-img" />
          ) : (
            <IconBrandTelegram stroke={1.5} />
          )}
        </Button>
        <IconButton
          aria-label="Eraser"
          onClick={() => setInputContent("")}
          colorScheme="gray"
          variant="solid"
          icon={<IconEraser stroke={1.5} />}
        />
        <IconButton aria-label="Clear" onClick={handleClearClick} icon={<IconClearAll stroke={1.5} />} />
      </div>
      <div className="mb-4 flex flex-row items-center space-x-3">
        {hasUnisoundConfig() && (
          <>
            <IconButton
              aria-label="ASR" //
              onClick={handleASRClick}
              colorScheme={asrState === ASRStatusEnum.RECORDING ? "red" : "gray"}
              variant={asrState === ASRStatusEnum.RECORDING ? "outline" : "solid"}
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
                colorScheme={ttsState === TTSStatusEnum.PLAYING ? "red" : "gray"}
                variant={ttsState === TTSStatusEnum.PLAYING ? "outline" : "solid"}
                icon={
                  ttsState !== TTSStatusEnum.NORMAL ? <IconPlayerPause stroke={1.5} /> : <IconPlayerPlay stroke={1.5} />
                }
              />
            )}
          </>
        )}
        <IconButton
          aria-label="Conversation"
          title="Continuous conversation"
          colorScheme={conversationId ? "green" : "gray"}
          icon={conversationId ? <IconMessages stroke={1.5} /> : <IconMessagesOff stroke={1.5} />}
          onClick={handleConversationClick}
        />
        <IconButton
          aria-label="SystemPrompt"
          title={currentChat.systemMessage}
          colorScheme={currentChat.systemMessage ? "telegram" : "gray"}
          icon={currentChat.systemMessage ? <IconMessagePlus stroke={1.5} /> : <IconMessage stroke={1.5} />}
          onClick={() => visibleAtom.set({ ...visibleAtom.get(), promptVisible: true })}
        />
      </div>
    </div>
  );

  const pageWidth = "md:max-w-160 lg:max-w-200 xl:max-w-240";

  return (
    <div className="w-full h-full flex flex-col">
      <div className={`w-full flex-1 p-4 pb-0 flex flex-col items-center overflow-y-auto overflow-x-hidden`}>
        <div className={`relative w-full flex flex-col ${pageWidth}`}>
          {messageList?.map((item) => (
            <MessageItem
              key={item.id}
              item={item}
              onDelete={handleMessageDelete}
              onPlay={(item) => playTTS(item.content)}
              onRegenerate={handleRegenerate}
              onRetry={(item) => {
                setInputContent(item.content);
                updateConversationId(item.conversationId);
                updateSystemPrompt(item.prompt);
              }}
            />
          ))}
          {currentAssistantMessage && (
            <MessageItem
              key={"-1"}
              item={{
                id: "-1",
                role: "assistant",
                content: currentAssistantMessage,
              }}
            />
          )}
          <ErrorItem error={errorInfo} onClose={() => setErrorInfo(undefined)} />
          <div id="chat-bottom" />
          <Command value={inputContent} width={pageWidth} onPromptClick={(prompt) => setInputContent(prompt)} />
        </div>
      </div>
      {chatLoading && <Progress size="xs" isIndeterminate />}
      <div id="chat-bottom-wrapper" className={`px-6 pt-4 border-t flex flex-col items-center`}>
        <div className={`w-full flex flex-col justify-end space-y-3 ${pageWidth}`}>
          <AutoResizeTextarea
            minRows={2}
            maxRows={10}
            className="placeholder:text-[14px]"
            value={inputContent}
            placeholder={t("chat.placeholder") || ""}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                handleSendClick();
              } else if (e.key === "ArrowUp") {
                if (!inputContent?.trim()) {
                  const content = [...messageList].reverse().find((v) => v.role === "user" && v.content)?.content;
                  if (content) {
                    setInputContent(content);
                  }
                }
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
  scrollToElement("chat-bottom", { behavior: "smooth", block: "end", ...options });
}

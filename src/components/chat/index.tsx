import { useDebounceEffect, useUpdateEffect } from "ahooks";
import { useStore } from "@nanostores/react";
import React, { useEffect, useRef, useState } from "react";
import { Button, IconButton, Textarea, useToast } from "@chakra-ui/react";
import {
  IconEraser,
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerPause,
  IconPlayerPlay,
  IconClearAll,
  IconBrandTelegram,
  IconLoader3,
  IconMessage,
  IconMessagePlus,
  IconMessages,
  IconMessagesOff,
} from "@tabler/icons-react";

import { visibleAtom } from "../atom";
import { chatConfigAtom, chatDataAtom, conversationAtom } from "./atom";
import { getCurrentTime, removeLn, scrollToElement, uuid } from "./utils";
import VoiceView, { VoiceRef } from "./ai";
import { ASRStatusEnum } from "./ai/ASRView";
import { TTSStatusEnum } from "./ai/TTSView";
import type { ChatMessage } from "./type";
import { MessageItem } from "./MessageItem";
import { estimateTokens } from "./token";
import { getUnisoundKeySecret, hasUnisoundConfig } from "./ai/Config";

export default function Page() {
  const { conversationId } = useStore(conversationAtom);
  const [inputContent, setInputContent] = useState("");
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState("");

  const [asrState, setAsrState] = useState<ASRStatusEnum>(ASRStatusEnum.NORMAL);
  const [ttsState, setTtsState] = useState<TTSStatusEnum>(TTSStatusEnum.NORMAL);
  const voiceRef = React.useRef<VoiceRef | null>();

  const messageList = useStore(chatDataAtom);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatAbortController, setAbortController] = useState<AbortController>();

  const chatConfig = useStore(chatConfigAtom);

  const toast = useToast({ position: "top", duration: 2000 });
  /** 页面第一次加载，因为是从 localstorage 中获取的，导致多触发了一次 */
  const promptFlag = useRef(true);

  useEffect(() => {
    scrollToPageBottom({ behavior: "auto" });
  }, []);

  useDebounceEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messageList));
  }, [messageList]);

  useUpdateEffect(() => {
    if (promptFlag.current) {
      promptFlag.current = false;
      return;
    }
    const { conversationId } = conversationAtom.get();
    if (!promptFlag.current && conversationId) {
      toast({
        status: "info",
        title: "System Prompt 变化，将开启新的对话",
        description: "若是点击重新生成按钮触发，将延续对应的对话",
      });
    }
  }, [chatConfig.systemMessage]);

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
      toast({ status: "error", title: "Please enter unisound APPKEY" });
      return true;
    }
    if (!config.SECRET) {
      toast({ status: "error", title: "Please enter unisound SECRET" });
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
      const content = data?.[0].content;
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
        const token = tokenCount + item.token || 0;
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
    const max_tokens = maxModelTokens - tokenCount;
    return { max_tokens, messages };
  }

  async function sendMessage(inputValue = inputContent, systemMessage = chatConfig.systemMessage) {
    if (chatLoading) {
      toast({ status: "warning", title: "Generating..." });
      return;
    }
    const content = removeLn(inputValue);
    if (!systemMessage && !content) {
      toast({ status: "info", title: "Please enter content" });
      return;
    }
    stopTTS();

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
      const { messages, max_tokens } = buildRequestMessages(messageList, question, conversationId, systemMessage);
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
            max_tokens,
          },
        }),
      });

      if (!response.ok || !response.body) {
        toast({ status: "error", title: "Request Error" });
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

  function updateSystemPrompt(prompt?: string) {
    chatConfigAtom.set({ ...chatConfigAtom.get(), systemMessage: prompt });
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

  function updateConversationId(id?: string) {
    if (id) {
      localStorage.setItem("conversationId", id);
    } else {
      localStorage.removeItem("conversationId");
    }
    conversationAtom.set({ ...conversationAtom.get(), conversationId: id });
  }

  function handleConversationClick() {
    if (conversationId) {
      updateConversationId();
      toast.closeAll();
      toast({ status: "info", title: "已关闭连续对话" });
    } else {
      updateConversationId(uuid());
      toast.closeAll();
      toast({ status: "success", title: "已开启连续对话", description: "该对话不会和之前的消息关联" });
    }
  }

  const actions = (
    <div className="flex flex-row flex-wrap items-center justify-between lg:justify-start space-x-0 lg:space-x-3">
      <div className="mb-4 flex flex-row items-center space-x-3">
        <Button
          onClick={() => handleSendClick()}
          colorScheme={chatLoading ? "red" : "blue"}
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
            <IconButton
              aria-label="TTS" //
              onClick={handleTTSClick}
              colorScheme={ttsState === TTSStatusEnum.PLAYING ? "red" : "gray"}
              variant={ttsState === TTSStatusEnum.PLAYING ? "outline" : "solid"}
              icon={
                ttsState !== TTSStatusEnum.NORMAL ? <IconPlayerPause stroke={1.5} /> : <IconPlayerPlay stroke={1.5} />
              }
            />
          </>
        )}
        <IconButton
          aria-label="Conversation"
          title="Continuous conversation"
          colorScheme={conversationId ? "teal" : "gray"}
          icon={conversationId ? <IconMessages stroke={1.5} /> : <IconMessagesOff stroke={1.5} />}
          onClick={handleConversationClick}
        />
        <IconButton
          aria-label="Prompt"
          title={chatConfig.systemMessage}
          colorScheme={chatConfig.systemMessage ? "whatsapp" : "gray"}
          icon={chatConfig.systemMessage ? <IconMessagePlus stroke={1.5} /> : <IconMessage stroke={1.5} />}
          onClick={() => visibleAtom.set({ ...visibleAtom.get(), promptVisible: true })}
        />
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className={`w-full flex-1 p-4 pb-0 overflow-y-auto overflow-x-hidden`}>
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
        <div id="chat-bottom" />
      </div>

      <div className="px-6 pt-4 border-t flex flex-col justify-end space-y-3">
        <Textarea
          rows={2}
          className="resize-none placeholder:text-[14px]"
          value={inputContent}
          placeholder="Shortcuts: ⬆️ / Ctrl + ↩ / ⌘ + ↩"
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

        <VoiceView
          ref={(ref) => (voiceRef.current = ref)}
          chatLoading={chatLoading}
          onAsrResultChange={handleAsrResult}
          onAsrStatusChange={setAsrState}
          onTtsStatusChange={setTtsState}
        />
      </div>
    </div>
  );
}

function scrollToPageBottom(options: ScrollIntoViewOptions = {}) {
  scrollToElement("chat-bottom", { behavior: "smooth", block: "end", ...options });
}

import { useDebounceEffect, useUpdateEffect } from "ahooks";
import { useStore } from "@nanostores/react";
import React, { useEffect, useState } from "react";
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

export default function Page() {
  const { conversationId } = useStore(conversationAtom);
  const [inputContent, setInputContent] = useState("");
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState("");

  const [asrState, setAsrState] = useState<ASRStatusEnum>(ASRStatusEnum.NORMAL);
  const [ttsState, setTtsState] = useState<TTSStatusEnum>(TTSStatusEnum.NORMAL);
  const voiceRef = React.useRef<VoiceRef | null>();

  const dataSource = useStore(chatDataAtom);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatAbortController, setAbortController] = useState<AbortController>();

  const chatConfig = useStore(chatConfigAtom);

  const toast = useToast({ position: "top" });

  useEffect(() => {
    scrollToPageBottom({ behavior: "auto" });
  }, []);

  useDebounceEffect(() => {
    localStorage.setItem("messages", JSON.stringify(dataSource));
  }, [dataSource]);

  useUpdateEffect(() => {
    const { conversationId } = conversationAtom.get();
    if (conversationId) {
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
    if (!chatConfig.unisoundAppKey) {
      toast({ status: "error", title: "Please enter  unisound APPKEY" });
      return true;
    }
    if (!chatConfig.unisoundSecret) {
      toast({ status: "error", title: "Please enter  unisound SECRET" });
      return true;
    }
    return false;
  }

  function handleTTSClick() {
    if (checkUnisound()) return;

    if (ttsState !== TTSStatusEnum.NORMAL) {
      stopTTS();
    } else {
      const data = [...dataSource].filter((v) => v.role === "assistant").reverse();
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
    if (!chatConfig.openAIKey) {
      toast({ status: "error", title: "Please enter OPENAI_KEY" });
      return;
    }

    if (chatLoading) {
      stopGenerate();
      return;
    }
    await sendMessage(inputValue);
  }

  function buildRequestMessages(
    messages: ChatMessage[],
    question: ChatMessage,
    conversationId: string | undefined,
    systemMessage?: string
  ) {
    let count = 0;
    if (systemMessage) {
      count += estimateTokens(systemMessage);
    }
    if (question.content) {
      count += estimateTokens(question.content);
    }

    const maxToken = 3000;
    const list: ChatMessage[] = [];
    if (conversationId) {
      const conversationList = [...messages.filter((v) => v.conversationId === conversationId)].reverse();
      conversationList.some((item) => {
        const token = count + item.token;
        if (token > maxToken) {
          return true;
        }
        list.push(item);
        count = token;
        return false;
      });
    }
    list.reverse();
    console.log(["token", count]);

    if (systemMessage) {
      list.unshift({ role: "system", content: systemMessage });
    }
    list.push(question);
    return list.map(({ role, content }) => ({ role, content }));
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
    chatDataAtom.set([...dataSource, question]);
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
      const response = await fetch("/api/generate", {
        method: "POST",
        signal: abortController.signal,
        body: JSON.stringify({
          messages: buildRequestMessages(dataSource, question, conversationId, systemMessage),
          apiKey: chatConfig.openAIKey,
          host: chatConfig.openAIHost,
          model: chatConfig.openAIModel,
        }),
      });

      if (!response.ok || !response.body) {
        toast({ status: "warning", title: "Request Error" });
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

  function updateSystemPrompt(prompt: string = "") {
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
    if (conversationId) {
      localStorage.setItem("conversationId", id);
    } else {
      localStorage.removeItem("conversationId");
    }
    conversationAtom.set({ ...conversationAtom.get(), conversationId: id });
  }

  function handleConversationClick() {
    if (conversationId) {
      updateConversationId();
      toast({ status: "info", title: "已关闭连续对话" });
    } else {
      updateConversationId(uuid());
      toast({ status: "success", title: "已开启连续对话", description: "该对话不会和之前的消息关联" });
    }
  }

  const actions = (
    <>
      <div className="flex flex-row items-center space-x-3">
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
      <div className="flex flex-row items-center space-x-3">
        {chatConfig.unisoundAppKey && chatConfig.unisoundSecret && (
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
    </>
  );

  return (
    <div className="w-full h-full flex flex-col">
      <div className={`flex-1 p-4 pb-0 overflow-auto`}>
        {dataSource.map((item) => (
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

      <div className="px-6 py-4 border-t flex flex-col justify-end space-y-3">
        <Textarea
          rows={2}
          className="resize-none placeholder:text-[14px]"
          value={inputContent}
          placeholder="Shortcuts: Ctrl + Enter / Command + Enter"
          onChange={(e) => setInputContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              handleSendClick();
            } else if (e.key === "ArrowUp") {
              if (!inputContent?.trim()) {
                const content = [...dataSource].reverse().find((v) => v.role === "user" && v.content)?.content;
                if (content) {
                  setInputContent(content);
                }
              }
            }
          }}
        />
        <div className="flex flex-row flex-wrap items-center justify-between lg:justify-start space-x-3">{actions}</div>

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

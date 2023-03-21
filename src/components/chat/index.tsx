import { useDebounceEffect } from "ahooks";
import { useStore } from "@nanostores/react";
import React, { useEffect, useState } from "react";
import { Button, IconButton, Textarea, useToast, Spinner } from "@chakra-ui/react";
import {
  IconEraser,
  IconMicrophone,
  IconMicrophoneOff,
  IconPlayerPause,
  IconPlayerPlay,
  IconClearAll,
  IconBrandTelegram,
  IconLoader3,
  IconMessages,
} from "@tabler/icons-react";

import { visibleAtom } from "./../atom";
import { chatConfigAtom, chatDataAtom } from "./atom";
import { getCurrentTime, removeLn, scrollToElement, uuid } from "./utils";
import VoiceView, { VoiceRef } from "./ai";
import { ASRStatusEnum } from "./ai/ASRView";
import { TTSStatusEnum } from "./ai/TTSView";
import type { ChatMessage, Command } from "./type";
import { MessageItem } from "./MessageItem";
import { estimateTokens } from "./token";

export default function Page() {
  const [conversationId, setConversationId] = useState<string>();
  const [parentMessageId, setParentMessageId] = useState<string>();
  const [inputContent, setInputContent] = useState("");
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState("");
  const [contextEnable, setContextEnable] = useState(false);

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

  function handleCommandChange(command: Command) {
    console.log("!! command", [command]);
    if (command === "stopAI") {
      stopGenerate();
    } else if (command === "stopTTS") {
      stopTTS();
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
    };
    const messages = [...dataSource, question];
    chatDataAtom.set(messages);
    setInputContent("");

    setChatLoading(true);
    scrollToPageBottom();
    setTimeout(scrollToPageBottom, 50);

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
    const requestMessages = (contextEnable ? messages : [question]).map(({ role, content }) => ({ role, content }));
    if (systemMessage) {
      requestMessages.unshift({
        role: "system",
        content: systemMessage,
      });
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        signal: abortController.signal,
        body: JSON.stringify({
          messages: requestMessages,
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
      addResultItem(content, assistantMessage, systemMessage);
    } catch (e) {
      console.log(e);
      addResultItem(content, assistantMessage, systemMessage);
    }
  }

  function addResultItem(content: string, assistantMessage: string, prompt: string = "") {
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

  function handleRegenerate(item: ChatMessage) {
    const content = item.role === "user" ? item.content : item.question;
    updateSystemPrompt(item.prompt);
    sendMessage(content, item.prompt);
  }

  function handleMessageDelete(item: ChatMessage) {
    chatDataAtom.set(chatDataAtom.get().filter((v) => v.id !== item.id));
  }

  const actions = (
    <>
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
      <IconButton
        aria-label="ASR" //
        onClick={handleASRClick}
        colorScheme={asrState === ASRStatusEnum.RECORDING ? "red" : "gray"}
        variant={asrState === ASRStatusEnum.RECORDING ? "outline" : "solid"}
        icon={
          asrState === ASRStatusEnum.RECORDING ? <IconMicrophoneOff stroke={1.5} /> : <IconMicrophone stroke={1.5} />
        }
      />
      <IconButton
        aria-label="TTS" //
        onClick={handleTTSClick}
        colorScheme={ttsState === TTSStatusEnum.PLAYING ? "red" : "gray"}
        variant={ttsState === TTSStatusEnum.PLAYING ? "outline" : "solid"}
        icon={ttsState !== TTSStatusEnum.NORMAL ? <IconPlayerPause stroke={1.5} /> : <IconPlayerPlay stroke={1.5} />}
      />
      <IconButton aria-label="Clear" onClick={handleClearClick} icon={<IconClearAll stroke={1.5} />} />
      <IconButton
        aria-label="Prompt"
        title={chatConfig.systemMessage}
        colorScheme={chatConfig.systemMessage ? "teal" : "gray"}
        icon={<IconMessages stroke={1.5} />}
        onClick={() => visibleAtom.set({ ...visibleAtom.get(), promptVisible: true })}
      />
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
            }
          }}
        />
        <div className="flex flex-row items-center space-x-3">{actions}</div>

        <VoiceView
          ref={(ref) => (voiceRef.current = ref)}
          chatLoading={chatLoading}
          onAsrResultChange={handleAsrResult}
          onAsrStatusChange={setAsrState}
          onTtsStatusChange={setTtsState}
          onCommandChange={handleCommandChange}
        />
      </div>
    </div>
  );
}

function scrollToPageBottom(options: ScrollIntoViewOptions = {}) {
  scrollToElement("chat-bottom", { behavior: "smooth", block: "end", ...options });
}

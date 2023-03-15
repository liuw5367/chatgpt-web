import {
  AudioMutedOutlined,
  AudioOutlined,
  ClearOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  RetweetOutlined,
  SendOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useDebounceEffect } from "ahooks";
import { useStore } from "@nanostores/react";
import React, { useState } from "react";

import { getCurrentTime, scrollToElement, uuid } from "./utils";
import VoiceView, { VoiceRef } from "./ai";
import { ASRStatusEnum } from "./ai/ASRView";
import { TTSStatusEnum } from "./ai/TTSView";
import { chatConfigAtom, chatDataAtom } from "./atom";
import SettingPanel from "./SettingPanel";
import type { ChatMessage, Command } from "./type";
import { Button, IconButton, Textarea, useToast } from "@chakra-ui/react";
import { MessageItem } from "./MessageItem";

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

  useDebounceEffect(() => {
    localStorage.setItem("messages", JSON.stringify(dataSource));
  }, [dataSource]);

  function stopAI() {
    // if (chatLoading) {
    //   addResultItem(currentAssistantMessage);
    // }
    chatAbortController?.abort();
    setChatLoading(false);
  }

  function stopTTS() {
    voiceRef.current?.stopTts();
  }

  function playTTS(content: string = "") {
    voiceRef.current?.tts(content);
  }

  function handleAsrResult(result: string, changing: boolean) {
    setInputContent(result);
    // if (!changing && result && result.length > 1) {
    //   handleChatGPTClick(result);
    // }
  }

  function handleTTSClick() {
    if (!chatConfig.unisoundAppKey) {
      toast({ status: "error", title: "请在设置中输入 unisound APPKEY" });
      return;
    }
    if (!chatConfig.unisoundSecret) {
      toast({ status: "error", title: "请在设置中输入 unisound SECRET" });
      return;
    }

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
    if (!chatConfig.unisoundAppKey) {
      toast({ status: "error", title: "请在设置中输入 unisound APPKEY" });
      return;
    }
    if (!chatConfig.unisoundSecret) {
      toast({ status: "error", title: "请在设置中输入 unisound SECRET" });
      return;
    }
    stopTTS();
    voiceRef.current?.asr();
  }

  function handleCommandChange(command: Command) {
    console.log("!! command", [command]);
    if (command === "stopAI") {
      stopAI();
    } else if (command === "stopTTS") {
      stopTTS();
    }
  }

  async function handleChatGPTClick(content = inputContent) {
    if (!chatConfig.openAIKey) {
      toast({ status: "error", title: "请在设置中输入 OPENAI_KEY" });
      return;
    }

    if (chatLoading) {
      stopAI();
      return;
    }
    if (!content) return;
    stopTTS();

    const question: ChatMessage = {
      id: uuid(),
      role: "user",
      content,
      time: getCurrentTime(),
    };
    const messages = [...dataSource, question];
    chatDataAtom.set(messages);
    setInputContent("");
    scrollToBottom();

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
      scrollToBottom();
    }
    const requestMessages = (contextEnable ? messages : [question]).map(({ role, content }) => ({ role, content }));
    if (chatConfig.systemMessage) {
      requestMessages.unshift({
        role: "system",
        content: chatConfig.systemMessage,
      });
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          messages: requestMessages,
          openAIKey: chatConfig.openAIKey,
          openAIServer: chatConfig.openAIServer,
          openAIModel: chatConfig.openAIModel,
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        toast({ status: "warning", title: "请求异常" });
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
      addResultItem(assistantMessage);
    } catch (e) {
      console.log(e);
      addResultItem(assistantMessage);
    }
  }

  function addResultItem(assistantMessage: string) {
    // AI 完整的返回值
    console.log([assistantMessage]);
    if (!assistantMessage) return;

    chatDataAtom.set([
      ...chatDataAtom.get(),
      {
        id: uuid(),
        role: "assistant",
        content: assistantMessage,
      },
    ]);
    // playTTS(assistantMessage);
    setCurrentAssistantMessage("");
    scrollToBottom();
    setChatLoading(false);
  }

  function scrollToBottom(id?: string) {
    scrollToElement(id || "chat-bottom");
  }

  function handleClearClick() {
    stopTTS();
    if (asrState === ASRStatusEnum.RECORDING) {
      setTimeout(() => voiceRef.current?.asr(), 200);
    }
    voiceRef.current?.stopAsr();
    stopAI();
    setInputContent("");
    chatDataAtom.set([]);
  }

  function handleNewChatClick() {
    handleClearClick();
    setConversationId(undefined);
    setParentMessageId(undefined);
  }

  return (
    <div className="w-full h-full flex flex-col bg-cover bg-no-repeat relative">
      <div className={`flex-1 p-4 pb-0 overflow-auto`}>
        {dataSource.map((item) => (
          <MessageItem key={item.id} item={item} />
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

      <div className="p-6 border-t flex flex-col justify-end space-y-3">
        <Textarea
          rows={3}
          className="resize-none"
          placeholder="请输入内容"
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              handleChatGPTClick();
            }
          }}
        />
        <div className="flex flex-row items-center space-x-3">
          <Button
            onClick={() => handleChatGPTClick()}
            colorScheme={chatLoading ? "red" : "blue"}
            variant={chatLoading ? "outline" : "solid"}
            leftIcon={chatLoading ? <LoadingOutlined /> : undefined}
          >
            {chatLoading ? "取消" : "发送"}
          </Button>
          <IconButton
            aria-label="ASR" //
            onClick={handleASRClick}
            variant={asrState === ASRStatusEnum.RECORDING ? "outline" : "solid"}
            icon={asrState === ASRStatusEnum.RECORDING ? <AudioMutedOutlined /> : <AudioOutlined />}
          />
          <IconButton
            aria-label="TTS" //
            onClick={handleTTSClick}
            variant={ttsState === TTSStatusEnum.PLAYING ? "outline" : "solid"}
            icon={
              ttsState === TTSStatusEnum.GENERATING ? (
                <LoadingOutlined />
              ) : ttsState === TTSStatusEnum.PLAYING ? (
                <PauseCircleOutlined />
              ) : (
                <PlayCircleOutlined />
              )
            }
          />
          <IconButton aria-label="清屏" onClick={handleClearClick} icon={<ClearOutlined />} />
          {/* <Button title="新对话" className="px-3" onClick={handleNewChatClick}>
              <ReloadOutlined />
            </Button>
            <Button
              title="上下文开关"
              className="px-3"
              type={contextEnable ? 'primary' : 'default'}
              danger={contextEnable}
              ghost={contextEnable}
              onClick={() => setContextEnable(!contextEnable)}
            >
              <RetweetOutlined />
            </Button> */}

          <IconButton
            aria-label="设置"
            icon={<SettingOutlined />}
            onClick={() => {
              const draft = chatConfigAtom.get();
              chatConfigAtom.set({ ...draft, visible: !draft.visible });
            }}
          />
        </div>
        <VoiceView
          ref={(ref) => (voiceRef.current = ref)}
          chatLoading={chatLoading}
          onAsrResultChange={handleAsrResult}
          onAsrStatusChange={setAsrState}
          onTtsStatusChange={setTtsState}
          onCommandChange={handleCommandChange}
        />
      </div>
      {chatConfig.visible && (
        <div className="absolute bottom-6 w-full z-50">
          <SettingPanel />
        </div>
      )}
    </div>
  );
}

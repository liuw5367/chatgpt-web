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
import { Input, message } from "antd";
import { useStore } from "@nanostores/react";
import React, { useState } from "react";

import { getCurrentTime, removeLn, scrollToElement, uuid } from "./utils";

import VoiceView, { VoiceRef } from "./ai";
import { ASRStatusEnum } from "./ai/ASRView";
import { TTSStatusEnum } from "./ai/TTSView";
import { chatConfigAtom, chatDataAtom } from "./atom";
import SettingPanel from "./SettingPanel";
import type { ChatMessage, Command } from "./type";
import classNames from "classnames";

import MarkdownIt from "markdown-it";
// @ts-ignore
import mdKatex from "markdown-it-katex";
import mdHighlight from "markdown-it-highlightjs";

export default function Page() {
  const [conversationId, setConversationId] = useState<string>();
  const [parentMessageId, setParentMessageId] = useState<string>();
  const [isComposing, setComposing] = useState(false);
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
      message.error("请在设置中输入 unisound APPKEY");
      return;
    }
    if (!chatConfig.unisoundSecret) {
      message.error("请在设置中输入 unisound SECRET");
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
      message.error("请在设置中输入 unisound APPKEY");
      return;
    }
    if (!chatConfig.unisoundSecret) {
      message.error("请在设置中输入 unisound SECRET");
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
      message.error("请在设置中输入 OPENAI_KEY");
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
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        message.warning("请求错误");
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

  function renderItem(item: ChatMessage) {
    const isUser = item.role === "user";
    let content = item.content;
    if (!isUser) {
      content = MarkdownIt().use(mdKatex).use(mdHighlight).render(item.content);
    }

    return (
      <div
        key={item.id} //
        id={item.id}
        className={`mb-3 flex flex-col ${isUser ? "items-end" : ""}`}
      >
        {item.time && <div className={`mb-1 px-2 text-xs text-gray-500`}>{item.time}</div>}
        <div className={` shadow rounded-lg p-3 ${isUser ? "bg-light-blue-100" : "bg-green-50"}`}>
          <div className="markdown-body" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-cover bg-no-repeat">
      <div className={`flex-1 overflow-auto p-4 pb-0 flex-1`}>
        {dataSource.map((item) => renderItem(item))}
        {currentAssistantMessage &&
          renderItem({
            id: "-1",
            role: "assistant",
            content: currentAssistantMessage,
          })}
        <div className="h-[200px]" />
        <div id="chat-bottom" />
      </div>
      <div className="absolute bottom-0 w-full">
        {chatConfig.visible && <SettingPanel />}
        <div className="shadow-lg m-4 flex items-center space-x-3 bg-sky-50 rounded-lg p-2">
          <Input.TextArea
            className="flex-1 border-none"
            bordered={false}
            value={inputContent}
            onChange={(e) => setInputContent(removeLn(e.target.value))}
            placeholder="请输入内容"
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            onKeyDown={(e) => !isComposing && e.key === "Enter" && handleChatGPTClick()}
            autoSize={{ minRows: 1, maxRows: 6 }}
          />
          <div className="h-full flex flex-w items-center space-x-2">
            <button
              title="发送"
              onClick={() => handleChatGPTClick()}
              className={classNames({
                ["action-btn"]: true,
                ["action-primary"]: true,
                ["action-btn-red"]: chatLoading,
              })}
            >
              {chatLoading ? <LoadingOutlined /> : <SendOutlined />}
            </button>
            <button
              title="ASR"
              onClick={handleASRClick}
              className={classNames({
                ["action-btn"]: true,
                ["action-btn-red"]: asrState === ASRStatusEnum.RECORDING,
              })}
            >
              {asrState === ASRStatusEnum.NORMAL && <AudioOutlined />}
              {asrState === ASRStatusEnum.RECORDING && <AudioMutedOutlined />}
            </button>
            <button
              title="TTS"
              onClick={handleTTSClick}
              className={classNames({
                ["action-btn"]: true,
                ["action-btn-red"]: ttsState === TTSStatusEnum.PLAYING,
              })}
            >
              {ttsState === TTSStatusEnum.NORMAL && <PlayCircleOutlined />}
              {ttsState === TTSStatusEnum.GENERATING && <LoadingOutlined />}
              {ttsState === TTSStatusEnum.PLAYING && <PauseCircleOutlined />}
            </button>
            <button
              title="清屏"
              onClick={handleClearClick}
              className={classNames({
                ["action-btn"]: true,
              })}
            >
              <ClearOutlined />
            </button>
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
            <SettingOutlined
              className="p-1"
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
      </div>
    </div>
  );
}

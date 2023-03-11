import "dayjs/locale/zh-cn";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import { ConfigProvider, message, notification } from "antd";
import Chat from "./chat/index";
import { useEffect } from "react";
import { chatConfigAtom, chatDataAtom } from "./chat/atom";
import type { ChatMessage } from "./chat/type";

dayjs.locale("zh-cn");
notification.config({ duration: 2 });
message.config({ duration: 2 });

export default function Page() {
  useEffect(() => {
    chatDataAtom.set(JSON.parse(localStorage.getItem("messages") || "[]") as ChatMessage[]);
    chatConfigAtom.set({
      visible: false,
      openAIKey: localStorage.getItem("openAIKey") || import.meta.env.OPENAI_API_KEY || undefined,

      openAIServer: localStorage.getItem("openAIServer") || import.meta.env.OPENAI_API_SERVER || undefined,
      systemMessage: localStorage.getItem("systemMessage") || undefined,

      unisoundAppKey: localStorage.getItem("unisoundAppKey") || import.meta.env.UNISOUND_AI_KEY || undefined,
      unisoundSecret: localStorage.getItem("unisoundSecret") || import.meta.env.UNISOUND_AI_SECRET || undefined,
    });
  }, [chatConfigAtom]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#1777FF",
        },
      }}
    >
      <Chat />
    </ConfigProvider>
  );
}

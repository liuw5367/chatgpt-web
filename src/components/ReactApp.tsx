import Chat from "./chat/index";
import { useEffect } from "react";
import { chatConfigAtom, chatDataAtom } from "./chat/atom";
import type { ChatMessage } from "./chat/type";
import { ChakraProvider } from "@chakra-ui/react";
import { Header } from "./Header";
import { extendTheme } from "@chakra-ui/react";

import "uno.css";
import "./app.css";
import "./markdown.css";

export default function App() {
  useEffect(() => {
    chatDataAtom.set(JSON.parse(localStorage.getItem("messages") || "[]") as ChatMessage[]);
    chatConfigAtom.set({
      visible: false,
      openAIKey: localStorage.getItem("openAIKey") || import.meta.env.OPENAI_API_KEY,

      openAIHost: localStorage.getItem("openAIHost") || import.meta.env.OPENAI_API_SERVER,
      openAIModel: localStorage.getItem("openAIModel") || import.meta.env.OPENAI_API_MODEL,
      systemMessage: localStorage.getItem("systemMessage") || undefined,

      unisoundAppKey: localStorage.getItem("unisoundAppKey") || import.meta.env.UNISOUND_AI_KEY,
      unisoundSecret: localStorage.getItem("unisoundSecret") || import.meta.env.UNISOUND_AI_SECRET,
    });
  }, []);

  const theme = extendTheme({ initialColorMode: "light", useSystemColorMode: true });

  return (
    <ChakraProvider theme={theme}>
      {loadIcons()}
      <div className={`v-screen h-screen flex flex-col`}>
        <Header />
        <Chat />
      </div>
    </ChakraProvider>
  );
}

function loadIcons() {
  return (
    <>
      <div className="i-tabler-copy hidden" />
    </>
  );
}

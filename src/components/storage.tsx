import { Cache } from "../constants";
import { chatAtom, ChatAtomType, chatConfigAtom, chatDataAtom } from "./atom";
import type { ChatItem } from "./types";
import { uuid } from "./utils";

/**
 * 因为服务端渲染无法使用 localStorage，所以这里重新设置一次
 */
export function loadCache(newChatName: string) {
  const chatList: ChatItem[] = JSON.parse(localStorage.getItem(Cache.CHAT_LIST) || "[]");
  if (chatList.length === 0) {
    const chatId = uuid();
    const chatItem: ChatItem = {
      id: chatId,
      name: newChatName,
      conversationId: localStorage.getItem("conversationId") || undefined,
    };
    chatList.push(chatItem);

    localStorage.setItem(Cache.CHAT_ID, chatId);
    localStorage.setItem(Cache.CHAT_LIST, JSON.stringify(chatList));
    const messagesJson = localStorage.getItem("messages") || "[]";
    localStorage.setItem(chatId, messagesJson);
    localStorage.removeItem("messages");
  }
  const chatId = localStorage.getItem(Cache.CHAT_ID) || "";

  const chatItem = chatList.find((v) => v.id === chatId);
  chatAtom.set({ ...chatAtom.get(), chatList, currentChat: chatItem as ChatItem });

  const messagesJson = localStorage.getItem(chatId) || "[]";
  chatDataAtom.set(JSON.parse(messagesJson) || []);

  chatConfigAtom.set({
    openAIKey: localStorage.getItem("openAIKey") || undefined,
    openAIHost: localStorage.getItem("openAIHost") || undefined,
    openAIModel: localStorage.getItem("openAIModel") || undefined,
    temperature: localStorage.getItem("temperature") ?? "0.6",
    top_p: localStorage.getItem("top_p") ?? "1",
  });
}

export function saveChatAtom(data: ChatAtomType) {
  localStorage.setItem(Cache.CHAT_ID, data.currentChat.id);
  localStorage.setItem(Cache.CHAT_LIST, JSON.stringify(data.chatList));
  chatAtom.set(data);
}

export function saveCurrentChatValue(key: keyof ChatItem, value: string) {
  const draft = chatAtom.get();
  const { currentChat, chatList } = draft;

  currentChat[key] = value;

  const chatItem = chatList.find((v) => v.id === currentChat.id);
  if (chatItem) {
    chatItem[key] = value;
  }

  saveChatAtom({ ...draft, chatList, currentChat });
}

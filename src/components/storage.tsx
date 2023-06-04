import { localDB } from '@/utils/LocalDB';

import { CacheKeys } from '../constants';
import { chatAtom, ChatAtomType, chatConfigAtom, chatDataAtom } from './atom';
import type { ChatItem } from './types';
import { uuid } from './utils';

/**
 * 因为服务端渲染无法使用 localStorage，所以这里重新设置一次
 */
export async function loadCache(newChatName: string) {
  await moveCacheData2DB();
  const chatList: ChatItem[] = JSON.parse(localStorage.getItem(CacheKeys.CHAT_LIST) || '[]');
  if (chatList.length === 0) {
    const chatId = uuid();
    const chatItem: ChatItem = {
      id: chatId,
      name: newChatName,
      conversationId: localStorage.getItem('conversationId') || undefined,
    };
    chatList.push(chatItem);

    localStorage.setItem(CacheKeys.CHAT_ID, chatId);
    localStorage.setItem(CacheKeys.CHAT_LIST, JSON.stringify(chatList));
    const messagesJson = localStorage.getItem('messages') || '[]';
    await localDB.setItem(chatId, JSON.parse(messagesJson));
    localStorage.removeItem('messages');
  }
  const chatId = localStorage.getItem(CacheKeys.CHAT_ID) || '';

  const chatItem = chatList.find((v) => v.id === chatId);
  chatAtom.set({ ...chatAtom.get(), chatList, currentChat: chatItem as ChatItem });

  const messagesJson = (await localDB.getItem(chatId)) || [];
  chatDataAtom.set(messagesJson || []);

  chatConfigAtom.set({
    openAIKey: localStorage.getItem('openAIKey') || undefined,
    openAIHost: localStorage.getItem('openAIHost') || undefined,
    openAIModel: localStorage.getItem('openAIModel') || undefined,
    temperature: localStorage.getItem('temperature') ?? '0.6',
    top_p: localStorage.getItem('top_p') ?? '1',
    searchSuggestions: localStorage.getItem('searchSuggestions') ?? '1',
    enterSend: localStorage.getItem('searchSuggestions') ?? '',

    unisoundAppKey: localStorage.getItem('unisoundAppKey') || undefined,
    unisoundSecret: localStorage.getItem('unisoundSecret') || undefined,
  });
}

async function moveCacheData2DB() {
  const cacheKeys: string[] = [];
  const idLength = uuid().length;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      key.length === idLength &&
      !key.includes('-') &&
      !key.includes('_') &&
      !key.includes('{') &&
      !key.includes('}') &&
      !key.includes('[') &&
      !key.includes('.')
    ) {
      cacheKeys.push(key);
    }
  }

  cacheKeys.forEach((key) => {
    const data = localStorage.getItem(key);
    if (data) {
      localDB.setItem(key, JSON.parse(data || '[]'));
      localStorage.removeItem(key);
    }
  });
}

export function saveChatAtom(data: ChatAtomType) {
  localStorage.setItem(CacheKeys.CHAT_ID, data.currentChat.id);
  localStorage.setItem(CacheKeys.CHAT_LIST, JSON.stringify(data.chatList));
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

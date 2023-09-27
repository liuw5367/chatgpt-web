import { isEmpty } from 'lodash';

import { CacheKeys } from '../constants';
import { localDB } from '../utils/LocalDB';
import type { ChatConfigType } from './store';
import { chatConfigStore, chatDataStore, chatListStore } from './store';
import type { ChatItem } from './types';
import { uuid } from './utils';

/**
 * 读取历史版本缓存
 */
export async function loadCache(newChatName: string) {
  const oldChatListCache = localStorage.getItem(CacheKeys.CHAT_LIST);
  if (oldChatListCache) {
    const chatList: ChatItem[] = JSON.parse(localStorage.getItem(CacheKeys.CHAT_LIST) || '[]');
    if (chatList.length === 0) {
      const chatId = uuid();
      const chatItem: ChatItem = { id: chatId, name: newChatName };
      chatList.push(chatItem);
    }
    chatListStore.getState().saveChatList(chatList);

    localStorage.removeItem(CacheKeys.CHAT_LIST);
    localStorage.removeItem('chat-id');
  }

  const chatList = chatListStore.getState().chatList;
  const chatId = chatList.find((v) => v.selected)?.id || chatList[0].id;

  const messagesJson = (await localDB.getItem(chatId)) || [];
  chatDataStore.setState({ data: messagesJson });

  const oldConfigCache =
    !isEmpty(localStorage.getItem('temperature')) ||
    !isEmpty(localStorage.getItem('accessCode')) ||
    !isEmpty(localStorage.getItem('openAIKey'));

  if (oldConfigCache) {
    const config: ChatConfigType = {
      accessCode: localStorage.getItem('accessCode') || undefined,
      openAIKey: localStorage.getItem('openAIKey') || undefined,
      openAIHost: localStorage.getItem('openAIHost') || undefined,
      openAIModel: localStorage.getItem('openAIModel') || undefined,
      temperature: localStorage.getItem('temperature') ?? '0.6',
      top_p: localStorage.getItem('top_p') ?? '1',
      searchSuggestions: localStorage.getItem('searchSuggestions') ?? '1',
      enterSend: localStorage.getItem('enterSend') ?? '',

      unisoundAppKey: localStorage.getItem('unisoundAppKey') || undefined,
      unisoundSecret: localStorage.getItem('unisoundSecret') || undefined,
    };
    chatConfigStore.setState({ ...config });

    localStorage.removeItem('accessCode');
    localStorage.removeItem('openAIKey');
    localStorage.removeItem('openAIHost');
    localStorage.removeItem('openAIModel');
    localStorage.removeItem('temperature');
    localStorage.removeItem('top_p');
    localStorage.removeItem('searchSuggestions');
    localStorage.removeItem('enterSend');
    localStorage.removeItem('unisoundAppKey');
    localStorage.removeItem('unisoundSecret');
  }
}

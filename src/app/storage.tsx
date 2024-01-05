import { CacheKeys } from '../constants';
import { localDB } from '../utils/LocalDB';
import { chatDataStore, chatListStore } from './store';
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
}

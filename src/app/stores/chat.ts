import { produce } from 'immer';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { translate } from '../utils/i18n';
import type { ChatItem, ChatMessage } from '../types';
import { uuid } from '../utils';
import { localDB } from '../utils/LocalDB';
import { usePanelVisibleStore } from './panel';

export const useChatDataStore = create<{ data: ChatMessage[] }>(() => ({
  data: [],
}));

interface ChatState {
  chatList: ChatItem[];
}

interface ChatAction {
  currentChat: () => ChatItem;
  saveChatList: (value: ChatItem[]) => void;
  updateChat: (id: string, value: Partial<ChatItem>) => void;
  setCurrentChat: (id: string) => void;
}

export const useChatListStore = create<ChatState & ChatAction, [['zustand/persist', ChatState & ChatAction]]>(
  persist(
    (set, get) => ({
      chatList: [],
      currentChat: () => {
        const { chatList } = get();
        let chat = chatList.find((v) => v.selected)!;
        if (!chat && chatList.length > 0) {
          chat = chatList[0];
        }
        if (!chat) {
          chat = { id: uuid(), name: translate('New Chat'), selected: true };
          set({ chatList: [chat] });
        }
        return chat;
      },
      async setCurrentChat(chatId) {
        set({
          chatList: produce(get().chatList, (draft) => {
            draft.forEach((item) => {
              item.selected = item.id === chatId;
            });
          }),
        });

        // 切换对话，更新消息列表
        const messages = (await localDB.getItem(chatId)) || [];
        useChatDataStore.setState({ data: messages });
        usePanelVisibleStore.setState({ chatTab: 'prompt' });
      },
      saveChatList: (value) => {
        set({
          chatList: produce(value, (draft) => {
            const selected = draft.find((v) => v.selected);
            if (!selected && draft.length > 0) {
              draft[0].selected = true;
            }
          }),
        });
      },
      updateChat: (id, value) => {
        set((state) => ({
          chatList: produce(state.chatList, (draft) => {
            const index = draft.findIndex((v) => v.id === id);
            draft[index] = { ...draft[index], ...value };
          }),
        }));
      },
    }),
    {
      name: 'persist-chat',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

import { produce } from 'immer';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { translate } from './i18n';
import type { ChatItem, ChatMessage } from './types';
import { uuid } from './utils';

export interface ChatAtomType {
  currentChat: ChatItem;
  chatList: ChatItem[];
}

export interface ChatConfigType {
  accessCode?: string;
  openAIKey?: string;

  openAIHost?: string;
  openAIModel?: string;
  temperature?: string;
  top_p?: string;

  searchSuggestions?: string;
  enterSend?: string;

  asrLanguage?: string;
}

export const chatConfigStore = create<ChatConfigType, [['zustand/persist', ChatConfigType]]>(
  persist(
    (set, get) => ({
      temperature: '0.6',
      top_p: '1',
      asrLanguage: 'cmn-Hans-CN',
    }),
    {
      name: 'persist-chat-config',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const chatDataStore = create<{ data: ChatMessage[] }>((setState, getState, store) => ({
  data: [],
}));

interface VisibleState {
  chatVisible: boolean;
  promptVisible: boolean;
  settingVisible: boolean;
  imageVisible: boolean;
}

export const visibleStore = create<VisibleState>((setState, getState, store) => ({
  chatVisible: false,
  promptVisible: false,
  settingVisible: false,
  imageVisible: false,
}));

interface ChatState {
  chatList: Array<ChatItem>;
}

interface ChatAction {
  currentChat: () => ChatItem;
  saveChatList: (value: ChatItem[]) => void;
  updateChat: (id: string, value: Partial<ChatItem>) => void;
}

export const chatListStore = create<ChatState & ChatAction, [['zustand/persist', ChatState & ChatAction]]>(
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
          const id = uuid();
          const item: ChatItem = { id, name: `${translate('New Chat')} ${id.slice(0, 6)}` };
          set({ chatList: [item] });
          chat = item;
        }
        return chat;
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

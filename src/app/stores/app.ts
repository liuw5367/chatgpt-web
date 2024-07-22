import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ModelSettingState } from './model';

export interface AppSetting {
  accessCode?: string;
  searchSuggestions?: string;
  enterSend?: string;
  asrLanguage?: string;

  //
  provider: keyof ModelSettingState;
  modelId?: string;
  baseURL?: string;
  temperature?: string;
  top_p?: string;

  /**
   * @deprecated
   */
  openAIKey?: string;
  /**
   * @deprecated
   */
  openAIHost?: string;
  /**
   * @deprecated
   */
  openAIModel?: string;
}

export const useAppSettingStore = create<AppSetting, [['zustand/persist', AppSetting]]>(
  persist(
    (set, get) => ({
      asrLanguage: 'cmn-Hans-CN',
      provider: 'openai',
    }),
    {
      name: 'persist-chat-config',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

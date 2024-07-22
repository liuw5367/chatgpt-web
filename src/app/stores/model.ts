import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CallSettings {
  /**
   * Maximum number of tokens to generate.
   */
  maxTokens?: number;
  /**
   * Temperature setting. This is a number between 0 (almost no randomness) and 1 (very random).
   *
   * It is recommended to set either `temperature` or `topP`, but not both.
   *
   * @default 0
   */
  temperature?: number;
  /**
   * Nucleus sampling. This is a number between 0 and 1.
   *
   * E.g. 0.1 would mean that only tokens with the top 10% probability mass are considered.
   *
   * It is recommended to set either `temperature` or `topP`, but not both.
   */
  topP?: number;
  /**
   * Presence penalty setting. It affects the likelihood of the model to repeat information that is already in the prompt.
   *
   * The presence penalty is a number between -1 (increase repetition) and 1 (maximum penalty, decrease repetition). 0 means no penalty.
   *
   * @default 0
   */
  presencePenalty?: number;
  /**
   * Frequency penalty setting. It affects the likelihood of the model to repeatedly use the same words or phrases.
   *
   * The frequency penalty is a number between -1 (increase repetition and 1 (maximum penalty, decrease repetition). 0 means no penalty.
   *
   * @default 0
   */
  frequencyPenalty?: number;
  /**
   * The seed (integer) to use for random sampling. If set and supported by the model, calls will generate deterministic results.
   */
  seed?: number;
}

export interface CacheModelSettings extends CallSettings {
  defaultBaseURL?: string;
  baseURL?: string;
  apiKey?: string;
  model?: string;
}

export interface ModelSettingState {
  openai?: CacheModelSettings;
  azure?: CacheModelSettings;
  anthropic?: CacheModelSettings;
  google?: CacheModelSettings;
  mistral?: CacheModelSettings;

  groq?: CacheModelSettings;
  perplexity?: CacheModelSettings;
  fireworks?: CacheModelSettings;

  ollama?: CacheModelSettings;
}

export const useModelSettingStore = create<ModelSettingState, [['zustand/persist', ModelSettingState]]>(
  persist(
    (set, get) => ({

    }),
    {
      name: 'settings-model',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

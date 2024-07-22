import type { SettingItemType } from './panels';
import type { ModelSettingState } from './stores';

export interface ModelItem {
  label: string;
  value: string;
  token?: number;
}

export const supportModels: Record<keyof ModelSettingState, {
  models: ModelItem[];
  settings?: SettingItemType[];
}> = {
  openai: {
    settings: [
      { type: 'number', label: 'temperature', value: 'temperature', placeholder: '', desc: 'settings.temperature' },
      { type: 'number', label: 'top_p', value: 'top_p', placeholder: '', desc: 'settings.top_p' },
    ],
    models: [
      { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo', token: 16385 },
      { label: 'gpt-4o', value: 'gpt-4o', token: 128000 },
      { label: 'gpt-4o-mini', value: 'gpt-4o-mini', token: 128000 },
      { label: 'gpt-4', value: 'gpt-4', token: 8192 },
      { label: 'gpt-4-turbo', value: 'gpt-4-turbo', token: 128000 },
      { label: 'gpt-4-32k', value: 'gpt-4-32k', token: 32768 },
    ],
  },

  azure: {
    models: [

    ],
  },

  anthropic: {
    models: [
      { label: 'claude-3-opus-20240229', value: 'claude-3-opus-20240229', token: undefined },
      { label: 'claude-3-sonnet-20240229', value: 'claude-3-sonnet-20240229', token: undefined },
      { label: 'claude-3-haiku-20240307', value: 'claude-3-haiku-20240307', token: undefined },
    ],
  },

  google: {
    models: [
      { label: 'models/gemini-1.5-pro-latest', value: 'models/gemini-1.5-pro-latest', token: undefined },
      { label: 'models/gemini-pro', value: 'models/gemini-pro', token: undefined },
      { label: 'models/gemini-pro-vision', value: 'models/gemini-pro-vision', token: undefined },
    ],
  },

  mistral: {
    models: [
      { label: 'open-mistral-7b', value: 'open-mistral-7b', token: undefined },
      { label: 'open-mixtral-8x7b', value: 'open-mixtral-8x7b', token: undefined },
      { label: 'mistral-small-latest', value: 'mistral-small-latest', token: undefined },
      { label: 'mistral-medium-latest', value: 'mistral-medium-latest', token: undefined },
      { label: 'mistral-large-latest', value: 'mistral-large-latest', token: undefined },
    ],
  },

  //
  groq: {
    models: [
      { label: 'llama3-8b-8192', value: 'llama3-8b-8192', token: undefined },
      { label: 'llama3-70b-8192', value: 'llama3-70b-8192', token: undefined },
      { label: 'mixtral-8x7b-32768', value: 'mixtral-8x7b-32768', token: undefined },
      { label: 'gemma-7b-it', value: 'gemma-7b-it', token: undefined },
    ],
  },

  perplexity: {
    models: [
      { label: 'llama-3-sonar-small-32k-chat', value: 'llama-3-sonar-small-32k-chat', token: undefined },
      { label: 'llama-3-sonar-small-32k-online', value: 'llama-3-sonar-small-32k-online', token: undefined },
      { label: 'llama-3-sonar-large-32k-chat', value: 'llama-3-sonar-large-32k-chat', token: undefined },
      { label: 'llama-3-sonar-large-32k-online', value: 'llama-3-sonar-large-32k-online', token: undefined },
      { label: 'llama-3-8b-instruct', value: 'llama-3-8b-instruct', token: undefined },
      { label: 'llama-3-70b-instruct', value: 'llama-3-70b-instruct', token: undefined },
      { label: 'mixtral-8x7b-instruct', value: 'mixtral-8x7b-instruct', token: undefined },
    ],
  },

  fireworks: {
    models: [
      { label: 'accounts/fireworks/models/stable-diffusion-xl-1024-v1-0', value: 'accounts/fireworks/models/stable-diffusion-xl-1024-v1-0', token: undefined },
      { label: 'accounts/fireworks/models/playground-v2-1024px-aesthetic', value: 'accounts/fireworks/models/playground-v2-1024px-aesthetic', token: undefined },
      { label: 'accounts/fireworks/models/playground-v2-5-1024px-aesthetic', value: 'accounts/fireworks/models/playground-v2-5-1024px-aesthetic', token: undefined },
      { label: 'accounts/fireworks/models/SSD-1B', value: 'accounts/fireworks/models/SSD-1B', token: undefined },
      { label: 'accounts/fireworks/models/japanese-stable-diffusion-xl', value: 'accounts/fireworks/models/japanese-stable-diffusion-xl', token: undefined },
      { label: 'accounts/fireworks/models/firellava-13b', value: 'accounts/fireworks/models/firellava-13b', token: undefined },
      { label: 'accounts/fireworks/models/firefunction-v1', value: 'accounts/fireworks/models/firefunction-v1', token: undefined },
      { label: 'accounts/fireworks/models/mixtral-8x7b-instruct', value: 'accounts/fireworks/models/mixtral-8x7b-instruct', token: undefined },
      { label: 'accounts/fireworks/models/mixtral-8x22b-instruct', value: 'accounts/fireworks/models/mixtral-8x22b-instruct', token: undefined },
      { label: 'accounts/fireworks/models/llama-v3-70b-instruct', value: 'accounts/fireworks/models/llama-v3-70b-instruct', token: undefined },
      { label: 'accounts/fireworks/models/bleat-adapter', value: 'accounts/fireworks/models/bleat-adapter', token: undefined },
      { label: 'accounts/fireworks/models/chinese-llama-2-lora-7b', value: 'accounts/fireworks/models/chinese-llama-2-lora-7b', token: undefined },
      { label: 'accounts/fireworks/models/dbrx-instruct', value: 'accounts/fireworks/models/dbrx-instruct', token: undefined },
      { label: 'accounts/fireworks/models/gemma-7b-it', value: 'accounts/fireworks/models/gemma-7b-it', token: undefined },
      { label: 'accounts/fireworks/models/hermes-2-pro-mistral-7b', value: 'accounts/fireworks/models/hermes-2-pro-mistral-7b', token: undefined },
      { label: 'accounts/fireworks/models/llama-2-13b-fp16-french', value: 'accounts/fireworks/models/llama-2-13b-fp16-french', token: undefined },
      { label: 'accounts/fireworks/models/llama-2-13b-guanaco-peft', value: 'accounts/fireworks/models/llama-2-13b-guanaco-peft', token: undefined },
      { label: 'accounts/fireworks/models/llama2-7b-summarize', value: 'accounts/fireworks/models/llama2-7b-summarize', token: undefined },
      { label: 'accounts/fireworks/models/llama-guard-2-8b', value: 'accounts/fireworks/models/llama-guard-2-8b', token: undefined },
      { label: 'accounts/fireworks/models/llama-v2-13b', value: 'accounts/fireworks/models/llama-v2-13b', token: undefined },
      { label: 'accounts/fireworks/models/llama-v2-13b-chat', value: 'accounts/fireworks/models/llama-v2-13b-chat', token: undefined },
      { label: 'accounts/fireworks/models/llama-v2-13b-code', value: 'accounts/fireworks/models/llama-v2-13b-code', token: undefined },
      { label: 'accounts/fireworks/models/llama-v2-13b-code-instruct', value: 'accounts/fireworks/models/llama-v2-13b-code-instruct', token: undefined },
      { label: 'accounts/fireworks/models/llama-v2-34b-code', value: 'accounts/fireworks/models/llama-v2-34b-code', token: undefined },
      { label: 'accounts/fireworks/models/llama-v2-34b-code-instruct', value: 'accounts/fireworks/models/llama-v2-34b-code-instruct', token: undefined },
      { label: 'accounts/fireworks/models/llama-v2-70b-chat', value: 'accounts/fireworks/models/llama-v2-70b-chat', token: undefined },
      { label: 'accounts/fireworks/models/llama-v2-70b-code-instruct', value: 'accounts/fireworks/models/llama-v2-70b-code-instruct', token: undefined },
      { label: 'accounts/fireworks/models/llama-v2-7b', value: 'accounts/fireworks/models/llama-v2-7b', token: undefined },
      { label: 'accounts/fireworks/models/llama-v2-7b-chat', value: 'accounts/fireworks/models/llama-v2-7b-chat', token: undefined },
      { label: 'accounts/fireworks/models/llama-v3-70b-instruct-hf', value: 'accounts/fireworks/models/llama-v3-70b-instruct-hf', token: undefined },
      { label: 'accounts/fireworks/models/llama-v3-8b-instruct', value: 'accounts/fireworks/models/llama-v3-8b-instruct', token: undefined },
      { label: 'accounts/fireworks/models/llama-v3-8b-instruct-hf', value: 'accounts/fireworks/models/llama-v3-8b-instruct-hf', token: undefined },
      { label: 'accounts/fireworks/models/llava-yi-34b', value: 'accounts/fireworks/models/llava-yi-34b', token: undefined },
      { label: 'accounts/fireworks/models/mistral-7b', value: 'accounts/fireworks/models/mistral-7b', token: undefined },
      { label: 'accounts/fireworks/models/mistral-7b-instruct-4k', value: 'accounts/fireworks/models/mistral-7b-instruct-4k', token: undefined },
      { label: 'accounts/fireworks/models/mistral-7b-instruct-v0p2', value: 'accounts/fireworks/models/mistral-7b-instruct-v0p2', token: undefined },
      { label: 'accounts/fireworks/models/mixtral-8x22b-hf', value: 'accounts/fireworks/models/mixtral-8x22b-hf', token: undefined },
      { label: 'accounts/fireworks/models/mixtral-8x22b-instruct-hf', value: 'accounts/fireworks/models/mixtral-8x22b-instruct-hf', token: undefined },
      { label: 'accounts/fireworks/models/mixtral-8x7b', value: 'accounts/fireworks/models/mixtral-8x7b', token: undefined },
      { label: 'accounts/fireworks/models/mixtral-8x7b-instruct-hf', value: 'accounts/fireworks/models/mixtral-8x7b-instruct-hf', token: undefined },
      { label: 'accounts/fireworks/models/mythomax-l2-13b', value: 'accounts/fireworks/models/mythomax-l2-13b', token: undefined },
      { label: 'accounts/fireworks/models/nous-hermes-2-mixtral-8x7b-dpo-fp8', value: 'accounts/fireworks/models/nous-hermes-2-mixtral-8x7b-dpo-fp8', token: undefined },
      { label: 'accounts/fireworks/models/openorca-7b', value: 'accounts/fireworks/models/openorca-7b', token: undefined },
      { label: 'accounts/fireworks/models/qwen1p5-72b-chat', value: 'accounts/fireworks/models/qwen1p5-72b-chat', token: undefined },
      { label: 'accounts/fireworks/models/starcoder-16b', value: 'accounts/fireworks/models/starcoder-16b', token: undefined },
      { label: 'accounts/fireworks/models/starcoder-7b', value: 'accounts/fireworks/models/starcoder-7b', token: undefined },
      { label: 'accounts/fireworks/models/traditional-chinese-qlora-llama2', value: 'accounts/fireworks/models/traditional-chinese-qlora-llama2', token: undefined },
      { label: 'accounts/fireworks/models/yi-34b-200k-capybara', value: 'accounts/fireworks/models/yi-34b-200k-capybara', token: undefined },
      { label: 'accounts/fireworks/models/zephyr-7b-beta', value: 'accounts/fireworks/models/zephyr-7b-beta', token: undefined },
    ],
  },

  //
  ollama: {
    models: [
      { label: 'llama2', value: 'llama2', token: undefined },
      { label: 'llama2:7b', value: 'llama2:7b', token: undefined },
      { label: 'llama2:13b', value: 'llama2:13b', token: undefined },
      { label: 'llama2:70b', value: 'llama2:70b', token: undefined },
      { label: 'llama3', value: 'llama3', token: undefined },
      { label: 'llama3:8b', value: 'llama3:8b', token: undefined },
      { label: 'llama3:70b', value: 'llama3:70b', token: undefined },
      { label: 'llava', value: 'llava', token: undefined },
      { label: 'llava:7b', value: 'llava:7b', token: undefined },
      { label: 'llava:13b', value: 'llava:13b', token: undefined },
      { label: 'llava:34b', value: 'llava:34b', token: undefined },
      { label: 'mistral', value: 'mistral', token: undefined },
      { label: 'mistral:7b', value: 'mistral:7b', token: undefined },
      { label: 'mixtral', value: 'mixtral', token: undefined },
      { label: 'mixtral:8x7b', value: 'mixtral:8x7b', token: undefined },
      { label: 'mixtral:8x22b', value: 'mixtral:8x22b', token: undefined },
      { label: 'openhermes', value: 'openhermes', token: undefined },
      { label: 'openhermes:v2.5', value: 'openhermes:v2.5', token: undefined },
      { label: 'phi3', value: 'phi3', token: undefined },
      { label: 'phi3:3.8b', value: 'phi3:3.8b', token: undefined },
    ],
  },
};

export const allProviders = Object.keys(supportModels).map((provider) => ({ label: provider, value: provider }));

export const allModels = Object.values(supportModels).map((v) => v.models).flat();

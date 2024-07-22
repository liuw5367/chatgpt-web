import type { ModelSettingState } from './stores';

export interface ChatItem {
  id: string;
  name: string;
  selected?: boolean;

  systemMessage?: string;
  conversationId?: string;

  provider?: keyof ModelSettingState;
  modelId?: string;
  temperature?: string;
  top_p?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;

  id: string;
  time?: string;
  token?: number;
  question?: string;
  prompt?: string;
  conversationId?: string;
  markdown?: string;
}

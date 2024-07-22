import { isEmpty } from 'lodash';
import { useAppSettingStore, useChatDataStore, useChatListStore, useModelSettingStore } from '../stores';
import { localDB } from './LocalDB';
import { uuid } from './index';

/**
 * 读取历史版本缓存
 */
export async function loadCache(newChatName: string) {
  const chatList = useChatListStore.getState().chatList;
  if (isEmpty(chatList)) {
    chatList.push(
      { id: uuid(), name: newChatName, selected: true },
    );
  }
  const chatId = chatList.find((v) => v.selected)?.id || chatList[0].id;

  const messagesJson = (await localDB.getItem(chatId)) || [];
  useChatDataStore.setState({ data: messagesJson });

  loadSettings();
}

function loadSettings() {
  const old = useAppSettingStore.getState();
  if (useModelSettingStore.getState().openai) {
    return;
  }

  const { openAIHost, openAIKey, openAIModel, temperature, top_p } = old;

  useModelSettingStore.setState({
    openai: {
      defaultBaseURL: 'https://api.openai.com/v1',
      baseURL: openAIHost ? `${openAIHost}v1` : undefined,
      apiKey: openAIKey,
      model: openAIModel,

      temperature: temperature != null ? Number(temperature) : undefined,
      topP: top_p != null ? Number(top_p) : undefined,
    },

    azure: {
      defaultBaseURL: 'https://{resourceName}.openai.azure.com/openai/deployments',
    },

    anthropic: {
      defaultBaseURL: 'https://api.anthropic.com/v1',
    },

    google: {
      defaultBaseURL: 'https://generativelanguage.googleapis.com/v1beta',
    },

    mistral: {
      defaultBaseURL: 'https://api.mistral.ai/v1',
    },

    groq: {
      defaultBaseURL: 'https://api.groq.com/openai/v1',
    },

    perplexity: {
      defaultBaseURL: 'https://api.perplexity.ai/',
    },

    fireworks: {
      defaultBaseURL: 'https://api.fireworks.ai/inference/v1',
    },
  });

  useAppSettingStore.setState({
    openAIHost: undefined,
    openAIKey: undefined,
    openAIModel: undefined,
    temperature: undefined,
    top_p: undefined,
  });
}

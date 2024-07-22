import { create } from 'zustand';

interface VisibleState {
  chatListVisible: boolean;
  chatTab: 'prompt' | 'info';
  chatSettingVisible: boolean;
  settingVisible: boolean;
  imageVisible: boolean;
}

function initState(): VisibleState {
  return {
    settingVisible: false,

    chatListVisible: false,

    chatTab: 'prompt',
    chatSettingVisible: false,

    imageVisible: false,
  };
}

export const usePanelVisibleStore = create<VisibleState>(() => initState());

export function showChatPromotPanel() {
  usePanelVisibleStore.setState({ chatSettingVisible: true, chatTab: 'prompt' });
}

export function showChatInfoPanel() {
  usePanelVisibleStore.setState({ chatSettingVisible: true, chatTab: 'info' });
}

export function closeAllPanel() {
  usePanelVisibleStore.setState(initState());
}

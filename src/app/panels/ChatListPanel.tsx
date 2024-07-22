import { Button, IconButton, Link } from '@chakra-ui/react';
import {
  IconBrandGithub,
  IconEdit,
  IconLanguageHiragana,
  IconPlus,
} from '@tabler/icons-react';

import { SimpleDrawer } from '../../components';
import { useTranslation } from '../utils/i18n';
import { Logo } from '../components/Logo';
import { showChatInfoPanel, useChatListStore, usePanelVisibleStore } from '../stores';
import type { ChatItem } from '../types';
import { uuid } from '../utils';
import { scrollToPageBottom } from '../chat';

interface Props {
  type?: 'side' | 'drawer';
  sideWidth?: string;
  chatVisible: boolean;
}

export function ChatListPanel(props: Props) {
  const { chatVisible, type, sideWidth } = props;
  const { t, changeLanguage, language } = useTranslation();
  const chatList = useChatListStore((s) => s.chatList);
  const setCurrentChat = useChatListStore((s) => s.setCurrentChat);

  function handleClose() {
    if (type === 'side') {
      return;
    }
    usePanelVisibleStore.setState({ chatListVisible: false });
  }

  function handleChatAddClick() {
    const id = uuid();
    const item: ChatItem = { id, name: `${t('New Chat')} ${id.slice(0, 6)}` };
    useChatListStore.setState(({ chatList }) => ({ chatList: [item, ...chatList] }));
    setCurrentChat(item.id);
  }

  function handleEdit(item: ChatItem) {
    showChatInfoPanel();
    handleClose();
  }

  function handleItemClick(item: ChatItem) {
    setCurrentChat(item.id);
    handleClose();
    scrollToPageBottom();
  }

  function handleChangeLanguage() {
    changeLanguage(language === 'en' ? 'zh' : 'en');
  }

  return (
    <SimpleDrawer
      type={type}
      sideWidth={sideWidth}
      isOpen={chatVisible}
      size="sm"
      placement="left"
      onClose={handleClose}
      header={
        type === 'side'
          ? null
          : (
            <div className="flex items-center font-medium space-x-2">
              <Logo />
            </div>
            )
      }
      footer={(
        <div className="w-full flex flex-row items-center justify-between">
          <div className="flex flex-row items-center">
            <Link href="https://github.com/liuw5367/chatgpt-web" isExternal>
              <IconButton aria-label="Github" variant="ghost" icon={<IconBrandGithub stroke={1.5} />} />
            </Link>
            <Button
              aria-label="ChangeLanguage"
              variant="ghost"
              onClick={handleChangeLanguage}
              leftIcon={<IconLanguageHiragana stroke={1.5} />}
            >
              {t('language')}
            </Button>
          </div>

          <Button
            aria-label="ChangeLanguage"
            variant="outline"
            leftIcon={<IconPlus stroke={1.5} size="1.3rem" />}
            onClick={handleChatAddClick}
          >
            {t('New Chat')}
          </Button>
        </div>
      )}
    >
      <div className="w-full flex flex-col gap-3">
        {chatList.map((chat) => {
          return (
            <ChatItemView
              key={chat.id}
              selected={chat.selected}
              chat={chat}
              onEdit={() => handleEdit(chat)}
              onClick={() => handleItemClick(chat)}
            />
          );
        })}
      </div>
    </SimpleDrawer>
  );
}

interface ItemProps {
  selected?: boolean;
  chat: ChatItem;
  onClick: () => void;
  onEdit: () => void;
}

function ChatItemView(props: ItemProps) {
  const { selected, chat, onEdit, onClick } = props;

  return (
    <div
      key={chat.id}
      onClick={onClick}
      className={`transition-all text-[14px] w-full flex flex-row items-center min-h-14 pl-3 pr-1 rounded-lg space-x-2 border cursor-pointer hover:bg-teal-700/5 hover:border-teal-700/80 ${
        selected && 'border-teal-700 text-teal-700 border-2 font-medium bg-teal-700/5'
      }`}
    >
      <div className="flex-1 truncate">{chat.name}</div>

      {selected && (
      <IconButton
        aria-label="Edit"
        variant="ghost"
        icon={<IconEdit size="0.90rem" className="opacity-64" />}
        size="xs"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit?.();
        }}
      />
      )}

    </div>
  );
}

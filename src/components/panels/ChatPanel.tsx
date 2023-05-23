import { Button, IconButton, Input } from '@chakra-ui/react';
import { useStore } from '@nanostores/react';
import {
  IconCheck,
  IconEdit,
  IconLanguageHiragana,
  IconMessage,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';

import { chatAtom, chatDataAtom, visibleAtom } from '../atom';
import { scrollToPageBottom } from '../chat';
import { Logo } from '../Logo';
import SimpleDrawer from '../SimpleDrawer';
import { saveChatAtom } from '../storage';
import type { ChatItem } from '../types';
import { uuid } from '../utils';

interface Props {
  type?: 'side' | 'drawer';
  sideWidth?: string;
  chatVisible: boolean;
}

export function ChatPanel(props: Props) {
  const { chatVisible, type, sideWidth } = props;
  const { t, i18n } = useTranslation();
  const { chatList, currentChat } = useStore(chatAtom);
  const { id: chatId } = currentChat;

  function updateChatList(chatList: ChatItem[]) {
    saveChatAtom({ ...chatAtom.get(), chatList });
  }

  function updateChatId(item: ChatItem) {
    saveChatAtom({ ...chatAtom.get(), currentChat: item });
    const chatId = item.id;
    // 切换对话，更新消息列表
    const messages = JSON.parse(localStorage.getItem(chatId) || '[]');
    chatDataAtom.set(messages);
  }

  function handleClose() {
    if (type === 'side') return;
    visibleAtom.set({ ...visibleAtom.get(), chatVisible: false });
  }

  function handleChatAddClick() {
    const id = uuid();
    const item: ChatItem = { id, name: t('New Chat') + ' ' + id.substring(0, 6) };
    updateChatList([item, ...chatList]);
  }

  function handleNameChange(item: ChatItem, value: string) {
    item.name = value;
    if (currentChat.id === item.id) {
      currentChat.name = value;
    }
    updateChatList([...chatList]);
  }

  function handleDelete(item: ChatItem) {
    if (chatList.length === 1) {
      const id = uuid();
      const item: ChatItem = { id, name: t('New Chat') };
      updateChatList([item]);
      updateChatId(item);
      handleClose();
    } else {
      const list = chatList.filter((chat) => chat.id !== item.id);
      updateChatList(list);
      if (item.id === chatId) {
        updateChatId(list[0]);
        handleClose();
      }
    }
  }

  function handleChangeLanguage() {
    i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en');
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
        type === 'side' ? null : (
          <div className="flex items-center font-medium space-x-2">
            <Logo />
          </div>
        )
      }
      footer={
        <div className="w-full flex flex-row items-center justify-between">
          <Button
            aria-label="ChangeLanguage"
            variant="ghost"
            leftIcon={<IconLanguageHiragana stroke={1.5} />}
            onClick={handleChangeLanguage}
          >
            {t('language')}
          </Button>

          <Button
            aria-label="ChangeLanguage"
            variant="outline"
            leftIcon={<IconPlus stroke={1.5} size="1.3rem" />}
            onClick={handleChatAddClick}
          >
            {t('New Chat')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {chatList.map((chat) => {
          return (
            <ChatItemView
              key={chat.id}
              chatId={chatId}
              chat={chat}
              onNameChange={handleNameChange}
              onDelete={handleDelete}
              onClick={() => {
                if (chat.id === currentChat.id) {
                  handleClose();
                  return;
                }
                updateChatId(chat);
                scrollToPageBottom();
                handleClose();
              }}
            />
          );
        })}
      </div>
    </SimpleDrawer>
  );
}

interface ItemProps {
  chatId?: string;
  chat: ChatItem;
  onNameChange: (chat: ChatItem, value: string) => void;
  onDelete: (chat: ChatItem) => void;
  onClick: () => void;
}

function ChatItemView(props: ItemProps) {
  const { chatId, chat, onClick, onNameChange, onDelete } = props;
  const selected = chat.id === chatId;
  const [changed, setChanged] = useState(chat.name);
  const [isEditing, setEditing] = useState(false);

  return (
    <div
      key={chat.id}
      onClick={isEditing ? undefined : onClick}
      className={`w-full flex flex-row items-center min-h-16 pl-3 pr-1 rounded-lg space-x-2 border cursor-pointer ${
        selected && 'border-teal-700 text-teal-700 border-2'
      }`}
    >
      <IconMessage stroke={1.5} className="min-w-6" />
      <div className="flex-1" style={{ maxWidth: 'calc(100% - 95px)' }}>
        {isEditing ? (
          <Input
            value={changed}
            focusBorderColor="teal.600"
            onChange={(e) => setChanged(e.target.value)}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />
        ) : (
          <div className="w-full flex items-center truncate">{chat.name}</div>
        )}
      </div>
      <div className="min-w-13 flex flex-row space-x-1">
        {isEditing && (
          <IconButton
            aria-label="Save"
            variant="ghost"
            icon={<IconCheck size="1.0rem" className="opacity-64" />}
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setEditing(false);
              onNameChange?.(chat, changed);
            }}
          />
        )}
        {isEditing && (
          <IconButton
            aria-label="close"
            variant="ghost"
            icon={<IconX size="1.0rem" className="opacity-64" />}
            size="xs"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditing(false);
              setChanged(chat.name);
            }}
          />
        )}
        {!isEditing && (
          <IconButton
            aria-label="Edit"
            variant="ghost"
            icon={<IconEdit size="0.90rem" className="opacity-64" />}
            size="xs"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditing(true);
            }}
          />
        )}
        {!isEditing && (
          <IconButton
            aria-label="Delete"
            variant="ghost"
            icon={<IconTrash size="0.90rem" className="opacity-64" />}
            size="xs"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(chat);
            }}
          />
        )}
      </div>
    </div>
  );
}

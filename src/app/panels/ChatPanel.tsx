import { Button, IconButton, Input, Link } from '@chakra-ui/react';
import {
  IconBrandGithub,
  IconCheck,
  IconEdit,
  IconLanguageHiragana,
  IconPlus,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { produce } from 'immer';
import { useState } from 'react';

import { SimpleDrawer } from '../../components';
import { localDB } from '../../utils/LocalDB';
import { scrollToPageBottom } from '../chat';
import { useTranslation } from '../i18n';
import { Logo } from '../Logo';
import { chatDataStore, chatListStore, visibleStore } from '../store';
import type { ChatItem } from '../types';
import { isMobile, uuid } from '../utils';

interface Props {
  type?: 'side' | 'drawer';
  sideWidth?: string;
  chatVisible: boolean;
}

export function ChatPanel(props: Props) {
  const { chatVisible, type, sideWidth } = props;
  const { t, changeLanguage, language } = useTranslation();
  const chatList = chatListStore((s) => s.chatList);
  const currentChat = chatListStore((s) => s.currentChat());

  async function updateChatMessage(item: ChatItem) {
    const chatId = item.id;
    // 切换对话，更新消息列表
    const messages = (await localDB.getItem(chatId)) || [];
    chatDataStore.setState({ data: messages });
  }

  function handleClose() {
    if (type === 'side') return;
    visibleStore.setState({ chatVisible: false });
  }

  function handleChatAddClick() {
    const id = uuid();
    const item: ChatItem = { id, name: t('New Chat') + ' ' + id.slice(0, 6) };
    chatListStore.setState(({ chatList }) => ({ chatList: [item, ...chatList] }));
  }

  function handleNameChange(item: ChatItem, name: string) {
    chatListStore.getState().updateChat(item.id, { name });
  }

  function handleDelete(item: ChatItem) {
    if (chatList.length === 1) {
      const id = uuid();
      const item: ChatItem = { id, name: t('New Chat'), selected: true };
      chatListStore.setState({ chatList: [item] });
      updateChatMessage(item);
      handleClose();
    } else {
      const list = chatList.filter((chat) => chat.id !== item.id);
      if (item.id === currentChat.id) {
        list[0].selected = true;
        handleClose();
      }
      chatListStore.setState({ chatList: list });
    }
  }

  function handleItemClick(item: ChatItem) {
    console.log(item, currentChat);
    handleClose();
    if (item.id === currentChat.id) return;

    chatListStore.setState(({ chatList }) => ({
      chatList: produce(chatList, (draft) => {
        for (const v of draft) {
          v.selected = v.id === item.id;
        }
      }),
    }));
    updateChatMessage(item);
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
        type === 'side' ? null : (
          <div className="flex items-center font-medium space-x-2">
            <Logo />
          </div>
        )
      }
      footer={
        <div className="w-full flex flex-row items-center justify-between">
          <div className="flex flex-row items-center">
            <Link href="https://www.yuque.com/home-repo/zdl71c/mavy1dcmhfhtrkgr?singleDoc#" isExternal>
            <Button variant="ghost">{t('about')}</Button>
            </Link>
            <Button
              aria-label="ChangeLanguage"
              variant="ghost"
              onClick={handleChangeLanguage}
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
      }
    >
      <div className="w-full flex flex-col gap-3">
        {chatList.map((chat) => {
          return (
            <ChatItemView
              key={chat.id}
              selected={currentChat.id === chat.id}
              chat={chat}
              onNameChange={handleNameChange}
              onDelete={handleDelete}
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
  onNameChange: (chat: ChatItem, value: string) => void;
  onDelete: (chat: ChatItem) => void;
  onClick: () => void;
}

function ChatItemView(props: ItemProps) {
  const { selected, chat, onClick, onNameChange, onDelete } = props;
  const [changed, setChanged] = useState(chat.name);
  const [isEditing, setEditing] = useState(false);
  const [mobileFlag] = useState(isMobile());
  const [hovered, setHovered] = useState(mobileFlag);

  function handleCancel() {
    setEditing(false);
    setChanged(chat.name);
  }

  function handleSave() {
    setEditing(false);
    onNameChange?.(chat, changed);
  }

  return (
    <div
      key={chat.id}
      onClick={isEditing ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(mobileFlag)}
      className={`transition-all text-[14px] w-full flex flex-row items-center min-h-14 pl-3 pr-1 rounded-lg space-x-2 border cursor-pointer hover:bg-teal-700/5 hover:border-teal-700/80 ${
        selected && 'border-teal-700 text-teal-700 border-2 font-medium bg-teal-700/5'
      }`}
    >
      {isEditing ? (
        <div className="flex-1">
          <Input
            size="sm"
            value={changed}
            focusBorderColor="teal.600"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                e.preventDefault();
                handleSave();
              }
            }}
            onChange={(e) => setChanged(e.target.value)}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />
        </div>
      ) : (
        <div className={`flex-1 truncate`}>{chat.name}</div>
      )}
      {((selected && hovered) || isEditing) && (
        <div className="flex flex-row space-x-1">
          {isEditing ? (
            <>
              <IconButton
                aria-label="Save"
                variant="ghost"
                icon={<IconCheck size="1.0rem" className="opacity-64" />}
                size="xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave();
                }}
              />
              <IconButton
                aria-label="Cancel"
                variant="ghost"
                icon={<IconX size="1.0rem" className="opacity-64" />}
                size="xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancel();
                }}
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

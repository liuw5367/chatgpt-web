import { Button, IconButton, Input, Link } from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import {
  IconBrandGithub,
  IconCheck,
  IconEdit,
  IconLanguageHiragana,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { localDB } from "../../utils/LocalDB";
import { chatAtom, chatDataAtom, visibleAtom } from "../atom";
import { scrollToPageBottom } from "../chat";
import { Logo } from "../Logo";
import SimpleDrawer from "../SimpleDrawer";
import { saveChatAtom } from "../storage";
import type { ChatItem } from "../types";
import { uuid } from "../utils";

interface Props {
  type?: "side" | "drawer";
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

  async function updateChatId(item: ChatItem) {
    saveChatAtom({ ...chatAtom.get(), currentChat: item });
    const chatId = item.id;
    // 切换对话，更新消息列表
    const messages = (await localDB.getItem(chatId)) || [];
    chatDataAtom.set(messages);
  }

  function handleClose() {
    if (type === "side") return;
    visibleAtom.set({ ...visibleAtom.get(), chatVisible: false });
  }

  function handleChatAddClick() {
    const id = uuid();
    const item: ChatItem = { id, name: t("New Chat") + " " + id.substring(0, 6) };
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
      const item: ChatItem = { id, name: t("New Chat") };
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
    i18n.changeLanguage(i18n.language === "en" ? "zh" : "en");
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
        type === "side" ? null : (
          <div className="flex items-center font-medium space-x-2">
            <Logo />
          </div>
        )
      }
      footer={
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
              {t("language")}
            </Button>
          </div>

          <Button
            aria-label="ChangeLanguage"
            variant="outline"
            leftIcon={<IconPlus stroke={1.5} size="1.3rem" />}
            onClick={handleChatAddClick}
          >
            {t("New Chat")}
          </Button>
        </div>
      }
    >
      <div className="w-full flex flex-col gap-3">
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
  const [hovered, setHovered] = useState(false);

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
      onMouseLeave={() => setHovered(false)}
      className={`transition-all text-[14px] w-full flex flex-row items-center min-h-14 pl-3 pr-1 rounded-lg space-x-2 border cursor-pointer hover:bg-teal-700/5 hover:border-teal-700/80 ${
        selected && "border-teal-700 text-teal-700 border-2 font-medium bg-teal-700/5"
      }`}
    >
      {isEditing ? (
        <div className="flex-1">
          <Input
            size="sm"
            value={changed}
            focusBorderColor="teal.600"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
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

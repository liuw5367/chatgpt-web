import { IconButton, Input } from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { IconCheck, IconEdit, IconMessage, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { useState } from "react";

import { Cache } from "../../constants";
import { chatAtom, chatDataAtom, visibleAtom } from "../atom";
import { Logo } from "../Logo";
import SimpleDrawer from "../SimpleDrawer";
import type { ChatItem } from "../types";
import { uuid } from "../utils";

export function ChatPanel() {
  const { chatVisible } = useStore(visibleAtom);
  const { chatList, currentChat } = useStore(chatAtom);
  const { id: chatId } = currentChat;

  function updateChatList(chatList: ChatItem[]) {
    chatAtom.set({ ...chatAtom.get(), chatList });
    localStorage.setItem(Cache.CHAT_LIST, JSON.stringify(chatList));
  }

  function updateChatId(item: ChatItem) {
    const chatId = item.id;
    chatAtom.set({ ...chatAtom.get(), currentChat: { ...item } });
    localStorage.setItem(Cache.CHAT_ID, chatId);
    const messages = JSON.parse(localStorage.getItem(chatId) || "[]");
    chatDataAtom.set(messages);
  }

  function handleClose() {
    visibleAtom.set({ ...visibleAtom.get(), chatVisible: false });
  }

  function handleChatAddClick() {
    const id = uuid();
    const item: ChatItem = { id, name: "New Chat " + id.substring(0, 5) };
    updateChatList([item, ...chatList]);
  }

  function handleNameChange(item: ChatItem, value: string) {
    item.name = value;
    updateChatList([...chatList]);
  }

  function handleDelete(item: ChatItem) {
    if (chatList.length === 1) {
      const id = uuid();
      const item: ChatItem = { id, name: "New Chat " + id.substring(0, 5) };
      updateChatList([item]);
      updateChatId(item);
    } else {
      const list = chatList.filter((chat) => chat.id !== item.id);
      updateChatList(list);
      updateChatId(list[0]);
    }
    handleClose();
  }

  return (
    <SimpleDrawer
      isOpen={chatVisible}
      size="sm"
      placement="left"
      onClose={handleClose}
      header={
        <div className="flex items-center space-x-2 font-medium">
          <Logo />
        </div>
      }
      footer={
        <div className="w-full flex flex-row items-center p-4 rounded-lg space-x-2 border" onClick={handleChatAddClick}>
          <IconPlus stroke={1.5} size="1.3rem" />
          <div>New Chat</div>
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
                updateChatId(chat);
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
  const { chatId, chat, onClick, onNameChange, onDelete, showDelete } = props;
  const selected = chat.id === chatId;
  const [changed, setChanged] = useState(chat.name);
  const [isEditing, setEditing] = useState(false);

  return (
    <div
      key={chat.id}
      onClick={isEditing ? undefined : onClick}
      className={`w-full flex flex-row items-center min-h-16 pl-4 pr-2 rounded-lg space-x-2 border ${
        selected && "bg-teal-600 text-white border-[teal-600]"
      }`}
    >
      <IconMessage stroke={1.5} className="min-w-6" />
      <div className="flex-1" style={{ maxWidth: "calc(100% - 95px)" }}>
        {isEditing ? (
          <Input
            value={changed}
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
            icon={<IconCheck size="1.0rem" className="opacity-64 hover:text-black" />}
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
            icon={<IconX size="1.0rem" className="opacity-64 hover:text-black" />}
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
            icon={<IconEdit size="0.90rem" className="opacity-64  hover:text-black" />}
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
            icon={<IconTrash size="0.90rem" className="opacity-64  hover:text-black" />}
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

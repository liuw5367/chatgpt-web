import { Avatar, Badge, Button, IconButton, useClipboard, useColorMode } from "@chakra-ui/react";
import {
  IconClipboard,
  IconClipboardCheck,
  IconPlayerPlay,
  IconReload,
  IconRobot,
  IconTrash,
  IconUser,
} from "@tabler/icons-react";
import { renderMarkdown } from "./markdown";
import type { ChatMessage } from "./type";

interface Props {
  item: ChatMessage;
  onDelete?: (v: ChatMessage) => void;
  onPlay?: (v: ChatMessage) => void;
  onRegenerate?: (v: ChatMessage) => void;
  onRetry?: (v: ChatMessage) => void;
}

export function MessageItem(props: Props) {
  const { item, onDelete, onPlay, onRetry, onRegenerate } = props;

  const { colorMode } = useColorMode();
  const { setValue: setClipboard, onCopy, hasCopied } = useClipboard(item.content);

  const isUser = item.role === "user";
  if (!isUser && !item.markdown) {
    item.markdown = renderMarkdown(item.content);
  }

  const prompt = (
    <Badge
      colorScheme="green"
      title={item.prompt}
      className={`cursor-pointer ${!isUser && "ml-2"}`}
      onClick={() => {
        setClipboard(item.prompt || "");
        onCopy();
      }}
    >
      Prompt
    </Badge>
  );

  const actions = (
    <div className={`absolute bottom-0 mt-1 flex ${isUser ? "justify-end right-10" : "left-7"}`}>
      <div className="-mb-8 flex items-center space-x-1">
        {!isUser && item.prompt && prompt}
        <IconButton
          aria-label="Copy"
          variant="ghost"
          icon={
            hasCopied ? (
              <IconClipboardCheck size="1rem" className="opacity-64" />
            ) : (
              <IconClipboard size="1rem" className="opacity-64" />
            )
          }
          size="xs"
          onClick={() => {
            setClipboard(item.content);
            onCopy();
          }}
        />
        <IconButton
          aria-label="TTS"
          variant="ghost"
          icon={<IconPlayerPlay size="1rem" className="opacity-64" />}
          size="xs"
          onClick={() => onPlay?.(item)}
        />
        <IconButton
          aria-label="Delete"
          variant="ghost"
          icon={<IconTrash size="0.90rem" className="opacity-64" />}
          size="xs"
          onClick={() => onDelete?.(item)}
        />
        {(item.role === "user" || (item.role === "assistant" && item.question)) && (
          <IconButton
            aria-label="Retry"
            variant="ghost"
            icon={<IconReload size="0.90rem" className="opacity-64" />}
            size="xs"
            onClick={() => {
              if (item.role === "user") {
                onRetry?.(item);
              } else {
                onRegenerate?.(item);
              }
            }}
          />
        )}
        {item.token != null && (
          <Button size="xs" aria-label="Token" title="Token">
            {item.token}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div
      key={item.id} //
      id={item.id}
      className={`mb-10 flex flex-col ${isUser && "items-end"} space-y-1`}
    >
      {(item.time || item.prompt) && (
        <div className={`flex items-center space-x-2 text-xs text-gray-500`}>
          {isUser && item.prompt && prompt}
          {item.time && <span>{item.time}</span>}
        </div>
      )}
      <div className={`flex flex-row space-x-2 relative ${isUser && "flex-row-reverse"}`}>
        <Avatar
          size="sm"
          className={`mt-1 ${isUser ? "!bg-blue-800/60 ml-2" : "!bg-teal-600"}`}
          icon={isUser ? <IconUser size="1.3rem" stroke={1.5} /> : <IconRobot size="1.3rem" stroke={1.5} />}
        />
        <div
          className={`flex-1 overflow-hidden rounded-lg py-2 px-3
              ${colorMode === "light" ? "bg-[#EDF2F7]" : "bg-[#021627]"}
              ${isUser && "whitespace-pre-wrap"}`}
        >
          {isUser ? (
            <>{item.content}</>
          ) : (
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: item.markdown || "" }} />
          )}
        </div>
        {item.id !== "-1" && actions}
      </div>
    </div>
  );
}

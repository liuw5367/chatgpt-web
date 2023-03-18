import { Avatar, IconButton, useClipboard, useColorMode } from "@chakra-ui/react";
import { IconClipboard, IconClipboardCheck, IconPlayerPlay, IconRobot, IconTrash, IconUser } from "@tabler/icons-react";
import { renderMarkdown } from "./markdown";
import type { ChatMessage } from "./type";

interface Props {
  item: ChatMessage;
  onDelete?: (v: ChatMessage) => void;
  onPlay?: (v: ChatMessage) => void;
}

export function MessageItem(props: Props) {
  const { item, onDelete, onPlay } = props;

  const { colorMode } = useColorMode();
  const { setValue: setClipboard, onCopy, hasCopied } = useClipboard(item.content);

  const isUser = item.role === "user";
  if (!isUser && !item.markdown) {
    item.markdown = renderMarkdown(item.content);
  }

  return (
    <div
      key={item.id} //
      id={item.id}
      className={`mb-10 flex flex-col ${isUser && "items-end"} space-y-1`}
    >
      {item.time && <div className={`text-xs text-gray-500`}>{item.time}</div>}
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
        <div className={`absolute bottom-0 mt-1 flex ${isUser ? "justify-end right-12" : "left-10"}`}>
          <div className="-mb-8 flex items-center space-x-1">
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
          </div>
        </div>
      </div>
    </div>
  );
}

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
      className={`mb-3 flex flex-col ${isUser && "items-end"} space-y-1`}
    >
      <div className={`flex flex-row space-x-2 ${isUser && "flex-row-reverse"}`}>
        <Avatar
          size="sm"
          className={`mt-1 ${isUser ? "!bg-blue-800/60 ml-2" : "!bg-teal-600"}`}
          icon={isUser ? <IconUser size="1.3rem" stroke={1.5} /> : <IconRobot size="1.3rem" stroke={1.5} />}
        />
        <div className="flex-1 ">
          <div
            className={`overflow-hidden rounded-lg py-2 px-3
              ${colorMode === "light" ? "bg-[#EDF2F7]" : "bg-[#021627]"}
              ${isUser && "whitespace-pre-wrap"}`}
          >
            {isUser ? (
              <>{item.content}</>
            ) : (
              <div className="markdown-body" dangerouslySetInnerHTML={{ __html: item.markdown || "" }} />
            )}
          </div>
          {item.id !== "-1" && (
            <div className={`mt-1 flex ${isUser && "justify-end"}`}>
              <div className="flex items-center space-x-1">
                <div className={`text-xs text-gray-500`}>{item.time}</div>
                <IconButton
                  aria-label="Copy"
                  variant="ghost"
                  icon={hasCopied ? <IconClipboardCheck size="1rem" /> : <IconClipboard size="1rem" />}
                  size="xs"
                  onClick={() => {
                    setClipboard(item.content);
                    onCopy();
                  }}
                />
                <IconButton
                  aria-label="TTS"
                  variant="ghost"
                  icon={<IconPlayerPlay size="1rem" />}
                  size="xs"
                  onClick={() => onPlay?.(item)}
                />
                <IconButton
                  aria-label="Delete"
                  variant="ghost"
                  icon={<IconTrash size="0.90rem" />}
                  size="xs"
                  onClick={() => onDelete?.(item)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

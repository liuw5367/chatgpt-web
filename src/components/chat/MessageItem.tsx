import { Avatar, useColorMode } from "@chakra-ui/react";
import { IconRobot, IconUser } from "@tabler/icons-react";
import { renderMarkdown } from "./markdown";
import type { ChatMessage } from "./type";

interface Props {
  item: ChatMessage;
}

export function MessageItem(props: Props) {
  const { item } = props;

  const { colorMode } = useColorMode();

  const isUser = item.role === "user";
  let content = item.content;
  if (!isUser) {
    content = renderMarkdown(item.content);
  }

  return (
    <div
      key={item.id} //
      id={item.id}
      className={`mb-3 flex flex-col ${isUser && "items-end"} space-y-1`}
    >
      <div className={`text-xs text-gray-500`}>{item.time}</div>
      <div className={`flex flex-row space-x-2 ${isUser && "flex-row-reverse"}`}>
        <Avatar
          size="sm"
          className={`mt-1 ${isUser ? "!bg-blue-800/60 ml-2" : "!bg-teal-600"}`}
          icon={isUser ? <IconUser size="1.3rem" stroke={1.5} /> : <IconRobot size="1.3rem" stroke={1.5} />}
        />
        <div
          className={`flex-1 overflow-hidden rounded-lg py-2 px-3
              ${colorMode === "light" ? "bg-[#EDF2F7]" : "bg-[#021627]"}
              ${isUser && "whitespace-pre"}`}
        >
          <div className="markdown-body" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    </div>
  );
}

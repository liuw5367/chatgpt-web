import {
  Avatar,
  Badge,
  Button,
  IconButton,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Tooltip,
  useClipboard,
  useColorMode,
} from '@chakra-ui/react';
import {
  IconClipboard,
  IconClipboardCheck,
  IconCode,
  IconMarkdown,
  IconMessages,
  IconPlayerPlay,
  IconReload,
  IconRobot,
  IconTrash,
  IconUserHeart,
} from '@tabler/icons-react';
import { useState } from 'react';

import { hasUnisoundConfig } from '@/components/ai/Config';

import type { ChatMessage } from '../types';
import { renderMarkdown } from './markdown';
import { estimateTokens } from './token';

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
  const { onCopy: onContentCopy, hasCopied: hasContentCopied } = useClipboard(item.content || item.prompt || '');
  const { onCopy: onPromptCopy, hasCopied: hasPromptCopied } = useClipboard(item.prompt || '');

  const [showOriginContent, setShowOriginContent] = useState(false);

  const isUser = item.role === 'user';
  if (!isUser && !item.markdown) {
    item.markdown = renderMarkdown(item.content);
  }

  const renderPrompt = (placement: 'top' | 'top-start' = 'top-start') => (
    <Popover placement={placement}>
      <PopoverTrigger>
        <Badge colorScheme="green" title={item.prompt} className={`text-[14px] cursor-pointer`} onClick={onPromptCopy}>
          Prompt
        </Badge>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader fontWeight="semibold">System Prompt</PopoverHeader>
        {/* <PopoverArrow /> */}
        <PopoverCloseButton />
        <PopoverBody className="text-[14px]">
          {item.prompt} Tokens: [{estimateTokens(item.prompt)}]
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );

  const renderConversation = (conversationId: string) => (
    <Tooltip
      placement="top-start"
      label={'conversationId: ' + conversationId}
      aria-label="tooltip"
      bg="gray.600"
      className="rounded"
    >
      <Badge
        colorScheme="teal"
        title={'conversationId: ' + conversationId}
        className={`text-[14px] cursor-pointer !flex flex-row items-center gap-1`}
      >
        <IconMessages size="0.8rem" />
        {conversationId.substring(conversationId.length - 4, conversationId.length)}
      </Badge>
    </Tooltip>
  );

  const actions = (
    <div className={`absolute bottom-0 mt-1 flex ${isUser ? 'justify-end right-10' : 'left-8'}`}>
      <div className="-mb-8 flex items-center space-x-1">
        {!item.conversationId ? null : renderConversation(item.conversationId)}
        {item.prompt && renderPrompt(isUser ? 'top' : 'top-start')}
        {!isUser && (
          <IconButton
            aria-label="OriginContent"
            variant="ghost"
            size="xs"
            onClick={() => setShowOriginContent(!showOriginContent)}
            icon={
              showOriginContent ? (
                <IconMarkdown size="1rem" className="opacity-64" />
              ) : (
                <IconCode size="1rem" className="opacity-64" />
              )
            }
          />
        )}
        <IconButton
          aria-label="Copy"
          variant="ghost"
          size="xs"
          onClick={onContentCopy}
          icon={
            hasContentCopied || hasPromptCopied ? (
              <IconClipboardCheck size="1rem" className="opacity-64" />
            ) : (
              <IconClipboard size="1rem" className="opacity-64" />
            )
          }
        />
        {hasUnisoundConfig() && (
          <IconButton
            aria-label="TTS"
            variant="ghost"
            icon={<IconPlayerPlay size="1rem" className="opacity-64" />}
            size="xs"
            onClick={() => onPlay?.(item)}
          />
        )}
        {(item.role === 'user' || (item.role === 'assistant' && item.question)) && (
          <IconButton
            aria-label="Retry"
            variant="ghost"
            icon={<IconReload size="0.90rem" className="opacity-64" />}
            size="xs"
            onClick={() => {
              if (item.role === 'user') {
                onRetry?.(item);
              } else {
                onRegenerate?.(item);
              }
            }}
          />
        )}
        <IconButton
          aria-label="Delete"
          variant="ghost"
          icon={<IconTrash size="0.90rem" className="opacity-64" />}
          size="xs"
          onClick={() => onDelete?.(item)}
        />
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
      className={`mb-10 flex flex-col ${isUser && 'items-end'} space-y-1`}
    >
      {item.time && <span className="text-xs text-gray-500">{item.time}</span>}
      <div className={`flex flex-row space-x-2 relative`} style={{ maxWidth: 'calc(100vw - 2rem)' }}>
        {!isUser && (
          <Avatar size="sm" className={`mt-1 !bg-teal-600`} icon={<IconRobot size="1.3rem" stroke={1.5} />} />
        )}

        <div
          className={`flex-1 overflow-hidden rounded-lg py-2 px-3
              ${colorMode === 'light' ? 'bg-[#EDF2F7]' : 'bg-[#021627]'}
              ${isUser && 'whitespace-pre-wrap'}`}
        >
          {isUser || showOriginContent ? (
            <div dangerouslySetInnerHTML={{ __html: item.content || item.prompt || '' }} />
          ) : (
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: item.markdown || '' }} />
          )}
        </div>

        {isUser && (
          <Avatar
            size="sm"
            className={`mt-1 ml-2 !bg-blue-800/60 `}
            icon={<IconUserHeart size="1.2rem" stroke={1.5} />}
          />
        )}
        {item.id !== '-1' && actions}
      </div>
    </div>
  );
}

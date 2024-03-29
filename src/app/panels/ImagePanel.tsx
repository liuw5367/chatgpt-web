import {
  Button,
  CloseButton,
  IconButton,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  SimpleGrid,
  useToast,
} from '@chakra-ui/react';
import {
  IconClearAll,
  IconEraser,
  IconExternalLink,
  IconHistory,
  IconInfoSquare,
  IconLoader3,
} from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';

import { AutoResizeTextarea, SimpleDrawer } from '../../components';
import { CacheKeys } from '../../constants';
import { useTranslation } from '../i18n';
import { chatConfigStore, visibleStore } from '../store';
import { request } from '../utils';

interface ImageItem {
  prompt: string;
  url: string;
}

export function ImagePanel() {
  const { t } = useTranslation();
  const toast = useToast({ position: 'top', isClosable: true });

  const chatConfig = chatConfigStore();
  const imageVisible = visibleStore((s) => s.imageVisible);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController>();
  const [historyList, setHistoryList] = useState<ImageItem[]>([]);
  const [imageList, setImageList] = useState<ImageItem[]>([]);

  useEffect(() => {
    if (imageVisible) {
      setHistoryList(JSON.parse(localStorage.getItem(CacheKeys.IMAGE_LIST) || '[]'));
    }
  }, [imageVisible]);

  useEffect(() => {
    return () => {
      abortController?.abort();
    };
  }, [abortController]);

  function handleClose() {
    visibleStore.setState({ imageVisible: false });
  }

  async function handleSend() {
    if (!prompt?.trim()) {
      toast({ status: 'info', title: t('please enter prompt') });
      return;
    }
    setLoading(true);
    try {
      const controller = new AbortController();
      setAbortController(controller);

      const response = await request('/api/image', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          apiKey: chatConfig.openAIKey,
          config: { prompt },
        }),
      });

      const json = await response.json();
      if (json.error?.code) {
        toast({ status: 'error', title: json.error.code, description: json.error.message });
      }
      else {
        if (json.data && Array.isArray(json.data)) {
          const data = json.data.map(({ url }: any) => ({ prompt, url }));
          setImageList(data);
          addToHistory(data);
        }
      }
    }
    catch (error: any) {
      toast({ status: 'error', title: error.name, description: error.message });
    }
    setLoading(false);
    setAbortController(undefined);
  }

  function updateHistory(data: ImageItem[]) {
    setHistoryList(data);
    localStorage.setItem(CacheKeys.IMAGE_LIST, JSON.stringify(data));
  }

  function handleClearClick() {
    updateHistory([]);
  }

  function addToHistory(data: ImageItem[]) {
    updateHistory([...data, ...historyList]);
  }

  function deleteImage(url: string) {
    updateHistory(historyList.filter((item) => item.url !== url));
  }

  let displayList = imageList;
  if (displayList == null || displayList.length === 0) {
    displayList = historyList;
  }

  return (
    <SimpleDrawer isOpen={imageVisible} onClose={handleClose} size="lg" header={t('Image Create')}>
      <div className="h-full w-full flex flex-col space-y-3">
        <AutoResizeTextarea
          className="!min-h-[84px]"
          minRows={3}
          maxRows={10}
          placeholder={t('please enter prompt') ?? ''}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex flex-row justify-between space-x-3">
          <div className="flex flex-row space-x-3">
            <IconButton
              title="History"
              aria-label="History"
              onClick={() => setImageList([])}
              colorScheme="gray"
              variant="solid"
              icon={<IconHistory stroke={1.5} />}
            />
            {imageList.length === 0 && historyList.length > 0 && (
              <IconButton
                title="Clear History"
                aria-label="Clear"
                onClick={handleClearClick}
                icon={<IconClearAll stroke={1.5} />}
              />
            )}
          </div>
          <div className="flex flex-row space-x-3">
            <IconButton
              title="Clear TextArea"
              aria-label="Eraser"
              onClick={() => setPrompt('')}
              colorScheme="gray"
              variant="solid"
              icon={<IconEraser stroke={1.5} />}
            />
            <Button
              title="Send"
              colorScheme={loading ? 'red' : 'teal'}
              variant={loading ? 'outline' : 'solid'}
              onClick={handleSend}
              leftIcon={loading ? <IconLoader3 stroke={1.5} className="rotate-img" /> : undefined}
            >
              {loading ? t('Generating') : t('Generate')}
            </Button>
          </div>
        </div>
        <SimpleGrid columns={2} spacing={2} className="pb-4">
          {displayList?.map(({ url, prompt }) => (
            <div key={url} className="relative aspect-square w-full rounded bg-black/20">
              <img src={url} alt="" className="aspect-square w-full rounded" />
              <div className="absolute right-1 top-1">
                <CloseButton size="sm" onClick={() => deleteImage(url)} />
              </div>
              <div className="absolute bottom-1 right-1 space-x-1">
                {imageList.length === 0 && (
                  <Popover placement="top">
                    <PopoverTrigger>
                      <IconButton
                        size="sm"
                        aria-label="Info"
                        colorScheme="blackAlpha"
                        icon={<IconInfoSquare stroke={1.5} />}
                      />
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverHeader fontWeight="semibold">Prompt</PopoverHeader>
                      {/* <PopoverArrow /> */}
                      <PopoverCloseButton />
                      <PopoverBody className="text-[14px]">{prompt}</PopoverBody>
                    </PopoverContent>
                  </Popover>
                )}

                <IconButton
                  size="sm"
                  aria-label="OpenExternal"
                  icon={<IconExternalLink stroke={1.5} />}
                  colorScheme="blackAlpha"
                  onClick={() => window.open(url, '_blank')}
                />
              </div>
            </div>
          ))}
        </SimpleGrid>
      </div>
    </SimpleDrawer>
  );
}

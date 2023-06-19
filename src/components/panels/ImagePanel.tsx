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
} from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { IconEraser, IconExternalLink, IconHistory, IconInfoSquare, IconLoader3 } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CacheKeys } from "../../constants";
import { chatConfigAtom, visibleAtom } from "../atom";
import { AutoResizeTextarea } from "../AutoResizeTextarea";
import SimpleDrawer from "../SimpleDrawer";

type ImageItem = { prompt: string; url: string };

export function ImagePanel() {
  const { t } = useTranslation();
  const toast = useToast({ position: "top", isClosable: true });

  const chatConfig = useStore(chatConfigAtom);
  const { imageVisible } = useStore(visibleAtom);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController>();
  const [historyList, setHistoryList] = useState<ImageItem[]>([]);
  const [imageList, setImageList] = useState<ImageItem[]>([]);

  useEffect(() => {
    if (imageVisible) {
      setHistoryList(JSON.parse(localStorage.getItem(CacheKeys.IMAGE_LIST) || "[]"));
    }
  }, [imageVisible]);

  useEffect(() => {
    return () => {
      abortController?.abort();
    };
  }, [abortController]);

  function handleClose() {
    visibleAtom.set({ ...visibleAtom.get(), imageVisible: false });
  }

  async function handleSend() {
    if (!prompt?.trim()) {
      toast({ status: "info", title: t("please enter prompt") });
      return;
    }
    setLoading(true);
    try {
      const controller = new AbortController();
      setAbortController(controller);

      const response = await fetch("/api/image", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: chatConfig.openAIKey,
          config: { prompt },
        }),
      });

      const json = await response.json();
      if (json.error?.code) {
        toast({ status: "error", title: json.error.code, description: json.error.message });
      } else {
        if (json.data && Array.isArray(json.data)) {
          const data = json.data.map(({ url }: any) => ({ prompt, url }));
          setImageList(data);
          addToHistory(data);
        }
      }
    } catch (e: any) {
      toast({ status: "error", title: e.name, description: e.message });
    }
    setLoading(false);
    setAbortController(undefined);
  }

  function updateHistory(data: ImageItem[]) {
    setHistoryList(data);
    localStorage.setItem(CacheKeys.IMAGE_LIST, JSON.stringify(data));
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
    <SimpleDrawer isOpen={imageVisible} onClose={handleClose} size="lg" header={t("Image Create")}>
      <div className="h-full w-full flex flex-col space-y-3">
        <AutoResizeTextarea
          className="!min-h-[84px]"
          minRows={3}
          maxRows={10}
          placeholder={t("please enter prompt") ?? ""}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex flex-row justify-between space-x-3">
          <IconButton
            aria-label="History"
            onClick={() => setImageList([])}
            colorScheme="gray"
            variant="solid"
            icon={<IconHistory stroke={1.5} />}
          />
          <div className="flex flex-row space-x-3">
            <IconButton
              aria-label="Eraser"
              onClick={() => setPrompt("")}
              colorScheme="gray"
              variant="solid"
              icon={<IconEraser stroke={1.5} />}
            />
            <Button
              colorScheme={loading ? "red" : "teal"}
              variant={loading ? "outline" : "solid"}
              onClick={handleSend}
              leftIcon={loading ? <IconLoader3 stroke={1.5} className="rotate-img" /> : undefined}
            >
              {loading ? t("Generating") : t("Generate")}
            </Button>
          </div>
        </div>
        <SimpleGrid columns={2} spacing={2} className="pb-4">
          {displayList?.map(({ url, prompt }) => (
            <div key={url} className="relative aspect-square w-full rounded bg-black/20">
              <img src={url} alt={url} className="aspect-square w-full rounded" />
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
                  onClick={() => window.open(url, "_blank")}
                />
              </div>
            </div>
          ))}
        </SimpleGrid>
      </div>
    </SimpleDrawer>
  );
}

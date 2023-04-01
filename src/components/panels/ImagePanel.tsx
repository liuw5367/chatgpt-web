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
import { IconEraser, IconExternalLink, IconHistory, IconInfoSquare } from "@tabler/icons-react";
import React, { useEffect, useState } from "react";

import { Cache } from "../../constants";
import { chatConfigAtom, visibleAtom } from "../atom";
import { AutoResizeTextarea } from "../AutoResizeTextarea";
import SimpleDrawer from "../SimpleDrawer";

type ImageItem = { prompt: string; url: string };

export function ImagePanel() {
  const toast = useToast({ position: "top", duration: 3000 });

  const chatConfig = useStore(chatConfigAtom);
  const { imageVisible } = useStore(visibleAtom);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatAbortController, setAbortController] = useState<AbortController>();
  const [historyList, setHistoryList] = useState<ImageItem[]>(
    JSON.parse(localStorage.getItem(Cache.IMAGE_LIST) || "[]")
  );
  const [imageList, setImageList] = useState<ImageItem[]>([]);

  useEffect(() => {
    return () => {
      chatAbortController?.abort();
    };
  }, []);

  function handleClose() {
    visibleAtom.set({ ...visibleAtom.get(), imageVisible: false });
  }

  async function handleSend() {
    if (!prompt?.trim()) {
      toast({ status: "info", title: "please enter prompt" });
      return;
    }
    setLoading(true);
    try {
      const abortController = new AbortController();
      setAbortController(abortController);

      const response = await fetch("/api/image", {
        method: "POST",
        signal: abortController.signal,
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
          const data = json.data.map(({ url }) => ({ prompt, url }));
          setImageList(data);
          addToHistory(data);
        }
      }
    } catch (e) {
      toast({ status: "error", title: e.toString() });
    }
    setLoading(false);
    setAbortController(undefined);
  }

  function updateHistory(data: ImageItem[]) {
    setHistoryList(data);
    localStorage.setItem(Cache.IMAGE_LIST, JSON.stringify(data));
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
    <SimpleDrawer isOpen={imageVisible} onClose={handleClose} size="lg" header={<>Image Create</>}>
      <div className="w-full h-full flex flex-col space-y-3">
        <AutoResizeTextarea
          className="min-h-[84px]"
          minRows={3}
          maxRows={10}
          placeholder="please enter prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex flex-row space-x-3 justify-between">
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
            <Button colorScheme="teal" onClick={handleSend} isLoading={loading} loadingText="Generating">
              Generate
            </Button>
          </div>
        </div>
        <SimpleGrid columns={2} spacing={2} className="pb-4">
          {displayList?.map(({ url, prompt }) => (
            <div key={url} className="w-full rounded bg-black/20 relative aspect-square">
              <img src={url} alt={url} className="w-full rounded aspect-square" />
              <div className="absolute top-1 right-1">
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

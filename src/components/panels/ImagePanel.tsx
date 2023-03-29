import { Button, Textarea, useToast, SimpleGrid, IconButton } from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { chatConfigAtom } from "../chat/atom";
import React, { useState, useEffect } from "react";
import { visibleAtom } from "../atom";
import { IconEraser } from "@tabler/icons-react";
import SimpleDrawer from "../SimpleDrawer";

export function ImagePanel() {
  const toast = useToast({ position: "top", duration: 2000 });

  const chatConfig = useStore(chatConfigAtom);
  const { imageVisible } = useStore(visibleAtom);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatAbortController, setAbortController] = useState<AbortController>();
  const [imageList, setImageList] = useState<string[]>([]);

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
      toast({ status: "info", title: "please enter content" });
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
      if (json.error) {
        toast({ status: "error", title: json.error });
      } else {
        if (json.data && Array.isArray(json.data)) {
          setImageList(json.data.map((v) => v.url));
        }
      }
    } catch (e) {
      toast({ status: "error", title: e.toString() });
    }
    setLoading(false);
    setAbortController(undefined);
  }

  return (
    <SimpleDrawer isOpen={imageVisible} onClose={handleClose} size="lg" header={<>Image Create</>}>
      <div className="w-full h-full flex flex-col space-y-3">
        <Textarea
          className="min-h-[84px]"
          rows={3}
          placeholder="please enter prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="flex flex-row space-x-3 justify-end">
          <IconButton
            aria-label="Eraser"
            onClick={() => setPrompt("")}
            colorScheme="gray"
            variant="solid"
            icon={<IconEraser stroke={1.5} />}
          />
          <Button colorScheme="teal" onClick={handleSend} isLoading={loading}>
            Generate
          </Button>
        </div>
        <SimpleGrid columns={2} spacing={2} className="pb-4">
          {imageList?.map((url) => (
            <img
              key={url}
              src={url}
              alt={url}
              className="w-full rounded bg-black/20"
              onClick={() => {
                window.open(url, "_blank");
              }}
            />
          ))}
        </SimpleGrid>
      </div>
    </SimpleDrawer>
  );
}

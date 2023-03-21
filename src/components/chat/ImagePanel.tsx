import {
  Button,
  Textarea,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  useToast,
  SimpleGrid,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { chatConfigAtom } from "./atom";
import { useState, useEffect } from "react";
import { visibleAtom } from "../atom";

export function ImagePanel() {
  const toast = useToast({ position: "top" });

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
    setLoading(true);
    try {
      const abortController = new AbortController();
      setAbortController(abortController);

      const response = await fetch("/api/image", {
        method: "POST",
        signal: abortController.signal,
        body: JSON.stringify({
          apiKey: chatConfig.openAIKey,
          config: { prompt },
        }),
      });

      const json = await response.json();

      if (json.data) {
        setImageList(json.data.map((v) => v.url));
      } else {
        toast({ status: "error", title: "Request Error" });
      }
    } catch (e) {
      toast({ status: "error", title: "Request Error" });
    }
    setLoading(false);
    setAbortController(undefined);
  }

  const content = (
    <div className="w-full h-full flex flex-col space-y-3">
      <Textarea
        className="min-h-[84px]"
        rows={3}
        placeholder=""
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <div>
        <Button colorScheme="teal" onClick={handleSend} isLoading={loading}>
          Send
        </Button>
      </div>
      <SimpleGrid columns={2} spacing={2} className="pb-4">
        {imageList?.map((url) => (
          <img src={url} key={url} className="w-full rounded" />
        ))}
      </SimpleGrid>
    </div>
  );

  return (
    <Drawer isOpen={imageVisible} size="lg" placement="right" onClose={handleClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Image Create</DrawerHeader>

        <DrawerBody>{content}</DrawerBody>

        {/* <DrawerFooter>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Close
          </Button>
        </DrawerFooter> */}
      </DrawerContent>
    </Drawer>
  );
}

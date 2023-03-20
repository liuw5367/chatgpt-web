import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { chatConfigAtom } from "./atom";
import {
  Input,
  Textarea,
  useToast,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Button,
} from "@chakra-ui/react";

export default function SettingPanel() {
  const toast = useToast({ position: "top" });
  const chatConfig = useStore(chatConfigAtom);

  const [config, setConfig] = useState({ ...chatConfig });

  useEffect(() => {
    if (chatConfig.visible) {
      setConfig({ ...chatConfig });
    }
  }, [chatConfig.visible]);

  function handleSaveClick() {
    const draft = chatConfigAtom.get();
    const result = { ...draft, ...config, visible: false };
    Object.entries(result).forEach(([key, value]) => {
      if (typeof value !== "boolean") {
        if (value == null || value.trim() === "") {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, value.trim());
        }
      }
    });
    chatConfigAtom.set(result);
    toast({ status: "success", title: "Success" });
  }

  type ConfigType = typeof chatConfig;
  type ListItemType = {
    type?: string;
    label: string;
    value: keyof ConfigType;
    placeholder: string;
  };

  const list: ListItemType[] = [
    {
      label: "OPENAI_HOST",
      value: "openAIHost",
      placeholder: "https://api.openai.com",
    },
    {
      label: "OPENAI_KEY",
      value: "openAIKey",
      placeholder: "Please enter OPENAI_KEY",
    },
    {
      label: "OPENAI_MODEL",
      value: "openAIModel",
      placeholder: "gpt-3.5-turbo",
    },
    {
      label: "Unisound_APPKEY",
      value: "unisoundAppKey",
      placeholder: "Please enter ai.unisound.com APPKEY",
    },
    {
      label: "Unisound_SECRET",
      value: "unisoundSecret",
      placeholder: "Please enter ai.unisound.com SECRET",
    },
  ];

  return (
    <Drawer
      isOpen={!!chatConfig.visible}
      size="sm"
      placement="right"
      onClose={() => chatConfigAtom.set({ ...chatConfigAtom.get(), visible: false })}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Settings</DrawerHeader>

        <DrawerBody>
          <div className="flex flex-col space-y-4">
            {list.map((item) => {
              return (
                <div key={item.value}>
                  <div className="mb-1 text-sm flex">{item.label}:</div>
                  {item.type === "textarea" ? (
                    <Textarea
                      size="sm"
                      className="flex-1"
                      rows={4}
                      placeholder={item.placeholder}
                      // @ts-expect-error
                      value={config[item.value] || ""}
                      onChange={(e) => setConfig((draft) => ({ ...draft, [item.value]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      size="sm"
                      className="flex-1"
                      placeholder={item.placeholder}
                      // @ts-expect-error
                      value={config[item.value] || ""}
                      onChange={(e) => setConfig((draft) => ({ ...draft, [item.value]: e.target.value }))}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </DrawerBody>

        <DrawerFooter>
          <Button
            variant="outline"
            mr={3}
            onClick={() => chatConfigAtom.set({ ...chatConfigAtom.get(), visible: false })}
          >
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSaveClick}>
            Save
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

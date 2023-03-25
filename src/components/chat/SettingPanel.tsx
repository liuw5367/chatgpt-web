import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { chatConfigAtom } from "./atom";
import { visibleAtom } from "../atom";
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
import { PasswordInput } from "../PasswordInput";

export function SettingPanel() {
  const toast = useToast({ position: "top", duration: 2000 });
  const chatConfig = useStore(chatConfigAtom);
  const { settingVisible } = useStore(visibleAtom);

  const [config, setConfig] = useState({ ...chatConfig });
  const [balance, setBalance] = useState("");
  const [chatAbortController, setAbortController] = useState<AbortController>();

  useEffect(() => {
    return () => {
      chatAbortController?.abort();
    };
  }, []);

  useEffect(() => {
    if (settingVisible) {
      const data = chatConfigAtom.get();
      setConfig({ ...data });
      requestBalance();
    }
  }, [settingVisible]);

  async function requestBalance() {
    try {
      const abortController = new AbortController();
      setAbortController(abortController);

      const response = await fetch("/api/balance", {
        method: "POST",
        signal: abortController.signal,
        body: JSON.stringify({
          apiKey: chatConfig.openAIKey,
          config: { prompt },
        }),
      });

      const json = await response.json();
      if (json.error) {
        toast({ status: "error", title: json.error });
      } else {
        const { total_available } = json;
        if (total_available != null && total_available !== "") {
          setBalance("$" + total_available);
        }
      }
    } catch (e) {
      toast({ status: "error", title: e.toString() });
    }
  }

  function handleClose() {
    visibleAtom.set({ ...visibleAtom.get(), settingVisible: false });
  }

  function handleSaveClick() {
    const draft = chatConfigAtom.get();
    const result = { ...draft, ...config };
    Object.entries(result).forEach(([key, value]) => {
      if (value == null || value.trim() === "") {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value.trim());
      }
    });
    chatConfigAtom.set(result);
    handleClose();
    toast({ status: "success", title: "Success" });
  }

  type ConfigType = typeof chatConfig;
  type ListItemType = {
    type?: "textarea" | "password";
    label: string;
    value: keyof ConfigType;
    placeholder: string;
    desc?: string;
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
      type: "password",
      placeholder: "Please enter OPENAI_KEY",
    },
    {
      label: "OPENAI_MODEL",
      value: "openAIModel",
      placeholder: "gpt-3.5-turbo",
    },
    {
      label: "temperature",
      value: "temperature",
      placeholder: "Defaults to 1. ",
      desc:
        "What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.\n" +
        "\n" +
        "We generally recommend altering this or top_p but not both.",
    },
    {
      label: "top_p",
      value: "top_p",
      placeholder: "Defaults to 1. ",
      desc:
        "An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.\n" +
        "\n" +
        "We generally recommend altering this or temperature but not both.",
    },
    {
      label: "Unisound_APPKEY",
      value: "unisoundAppKey",
      type: "password",
      placeholder: "Please enter ai.unisound.com APPKEY",
    },
    {
      label: "Unisound_SECRET",
      value: "unisoundSecret",
      type: "password",
      placeholder: "Please enter ai.unisound.com SECRET",
    },
  ];

  return (
    <Drawer isOpen={settingVisible} size="md" placement="right" onClose={handleClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Settings</DrawerHeader>

        <DrawerBody>
          <div className="flex flex-col space-y-4">
            {list.map((item) => {
              return (
                <div key={item.value} className="space-y-1">
                  <div>
                    <span>{item.label}:&nbsp;</span>
                    {item.label === "OPENAI_KEY" && <span>{balance}</span>}
                  </div>
                  {item.desc && <div className="text-sm text-gray-500/80">{item.desc}</div>}
                  {item.type === "textarea" ? (
                    <Textarea
                      className="flex-1"
                      rows={4}
                      placeholder={item.placeholder}
                      value={config[item.value] || ""}
                      onChange={(e) => setConfig((draft) => ({ ...draft, [item.value]: e.target.value }))}
                    />
                  ) : item.type === "password" ? (
                    <PasswordInput
                      className="flex-1"
                      placeholder={item.placeholder}
                      value={config[item.value] || ""}
                      onChange={(e) => setConfig((draft) => ({ ...draft, [item.value]: e.target.value }))}
                    />
                  ) : (
                    <Input
                      className="flex-1"
                      placeholder={item.placeholder}
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
          <Button variant="outline" mr={3} onClick={handleClose}>
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

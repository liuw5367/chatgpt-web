import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  useToast,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";

import { APP_VERSION } from "../../constants";
import { visibleAtom } from "../atom";
import { chatConfigAtom } from "../chat/atom";
import { PasswordInput } from "../PasswordInput";
import SimpleDrawer from "../SimpleDrawer";

type ListItemType<T = string> = {
  type?: "password" | "number";
  label: string;
  value: T;
  placeholder: string;
  desc?: string;
  max?: number;
};

const openAIList: ListItemType[] = [
  { label: "OpenAI Host", value: "openAIHost", placeholder: "https://api.openai.com" },
  { label: "OpenAI Key", value: "openAIKey", type: "password", placeholder: "please enter OPENAI_KEY" },
  { label: "OpenAI Model", value: "openAIModel", placeholder: "gpt-3.5-turbo" },
];

const chatConfigList: ListItemType[] = [
  {
    type: "number",
    label: "temperature",
    value: "temperature",
    max: 2,
    placeholder: "",
    desc:
      "Defaults to 1. What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.\n" +
      "\n" +
      "We generally recommend altering this or top_p but not both.",
  },
  {
    type: "number",
    label: "top_p",
    value: "top_p",
    max: 1,
    placeholder: "",
    desc:
      "Defaults to 1. An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.\n" +
      "\n" +
      "We generally recommend altering this or temperature but not both.",
  },
];

const voiceList: ListItemType[] = [
  { label: "Unisound APPKEY", value: "unisoundAppKey", type: "password", placeholder: "https://ai.unisound.com" },
  { label: "Unisound SECRET", value: "unisoundSecret", type: "password", placeholder: "https://ai.unisound.com" },
];

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

  function renderItem(item: ListItemType) {
    return (
      <Item
        key={item.value}
        item={item}
        balance={balance}
        value={config[item.value] || ""}
        onChange={(value) => setConfig((draft) => ({ ...draft, [item.value]: value }))}
      />
    );
  }

  return (
    <SimpleDrawer
      isOpen={settingVisible}
      onClose={handleClose}
      size="md"
      header={
        <div className="space-x-4">
          <span>Settings</span>
          <span className="text-sm font-normal">{APP_VERSION}</span>
        </div>
      }
      footer={
        <>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSaveClick}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col space-y-4">
        {openAIList.map((item) => renderItem(item))}
        {chatConfigList.map((item) => renderItem(item))}
        {voiceList.map((item) => renderItem(item))}
      </div>
    </SimpleDrawer>
  );
}

interface ItemProps {
  item: ListItemType;
  value: string;
  onChange: (v: string) => void;
  balance?: string;
}

function Item({ item, value, onChange, balance }: ItemProps) {
  return (
    <FormControl>
      <FormLabel>
        <span>{item.label}</span>
        {item.label === "OpenAI Key" && <span>&nbsp;{balance}</span>}
      </FormLabel>
      {item.type === "password" ? (
        <PasswordInput
          className="flex-1"
          placeholder={item.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : item.type === "number" ? (
        <NumberInput className="flex-1" min={0} max={item.max} step={0.1} value={value} onChange={(v) => onChange(v)}>
          <NumberInputField placeholder={item.placeholder} />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      ) : (
        <Input
          className="flex-1"
          placeholder={item.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {item.desc && <FormHelperText>{item.desc}</FormHelperText>}
    </FormControl>
  );
}

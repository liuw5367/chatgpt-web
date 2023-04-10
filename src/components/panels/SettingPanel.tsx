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
  Switch,
  useToast,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { APP_VERSION } from "../../constants";
import { chatConfigAtom, visibleAtom } from "../atom";
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

const voiceList: ListItemType[] = [
  { label: "Unisound AppKey", value: "unisoundAppKey", placeholder: "https://ai.unisound.com" },
  { label: "Unisound SECRET", value: "unisoundSecret", type: "password", placeholder: "https://ai.unisound.com" },
];

export function SettingPanel() {
  const { t } = useTranslation();
  const toast = useToast({ position: "top", isClosable: true });
  const chatConfig = useStore(chatConfigAtom);
  const { settingVisible } = useStore(visibleAtom);

  const [config, setConfig] = useState({ ...chatConfig });
  const [balance, setBalance] = useState("");
  const [abortController, setAbortController] = useState<AbortController>();

  useEffect(() => {
    return () => {
      abortController?.abort();
    };
  }, [abortController]);

  useEffect(() => {
    if (settingVisible) {
      const data = chatConfigAtom.get();
      setConfig({ ...data });
      // requestBalance();
    }
  }, [settingVisible]);

  /**
   * @deprecated 接口已无法使用
   */
  async function requestBalance() {
    try {
      const controller = new AbortController();
      setAbortController(controller);

      const response = await fetch("/api/balance", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          apiKey: chatConfig.openAIKey,
          config: { prompt },
        }),
      });

      const json = await response.json();
      if (json.error?.code) {
        // toast({ status: "error", title: json.error.code, description: json.error.message });
      } else {
        const { total_available } = json;
        if (total_available != null && total_available !== "") {
          setBalance("$" + total_available);
        }
      }
    } catch (e) {
      // toast({ status: "error", title: e.toString() });
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
    toast({ status: "success", title: t("toast.success") });
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

  const chatConfigList: ListItemType[] = [
    {
      type: "switch",
      label: t("settings.SearchSuggestions"),
      value: "searchSuggestions",
      placeholder: "",
    },
    {
      type: "switch",
      label: t("settings.EnterSend"),
      value: "enterSend",
      placeholder: "",
    },
    { label: "OpenAI Key", value: "openAIKey", type: "password", placeholder: "please enter OPENAI_KEY" },
    { label: "OpenAI Host", value: "openAIHost", placeholder: "https://api.openai.com" },
    { label: "OpenAI Model", value: "openAIModel", placeholder: "gpt-3.5-turbo" },
    {
      type: "number",
      label: "temperature",
      value: "temperature",
      max: 2,
      placeholder: "",
      desc: t("settings.temperature"),
    },
    {
      type: "number",
      label: "top_p",
      value: "top_p",
      max: 1,
      placeholder: "",
      desc: t("settings.top_p"),
    },
  ];

  return (
    <SimpleDrawer
      isOpen={settingVisible}
      onClose={handleClose}
      size="md"
      header={
        <div className="space-x-4">
          <span>{t("settings.title")}</span>
          <span className="text-sm font-normal">{APP_VERSION}</span>
        </div>
      }
      footer={
        <>
          <Button variant="outline" mr={3} onClick={handleClose}>
            {t("actions.cancel")}
          </Button>
          <Button colorScheme="teal" onClick={handleSaveClick}>
            {t("actions.save")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col space-y-4">
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
  const horizontal = item.type === "switch";

  return (
    <FormControl className={`${horizontal && "flex flex-row"}`}>
      <FormLabel className={`${horizontal && "flex-1"}`}>
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
      ) : item.type === "switch" ? (
        <Switch colorScheme="teal" isChecked={value === "1"} onChange={(e) => onChange(e.target.checked ? "1" : "0")} />
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

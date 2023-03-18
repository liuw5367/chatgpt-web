import { useStore } from "@nanostores/react";
import { useState } from "react";

import { chatConfigAtom } from "./atom";
import {
  CloseButton,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  Textarea,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { IconArchive } from "@tabler/icons-react";

export default function SettingPanel() {
  const toast = useToast({ position: "top" });
  const chatConfig = useStore(chatConfigAtom);

  const [config, setConfig] = useState({ ...chatConfig });
  const [systemMessage, setSystemMessage] = useState(chatConfig.systemMessage);

  const { colorMode } = useColorMode();

  function handleSystemRoleSave() {
    const draft = chatConfigAtom.get();
    draft.systemMessage = systemMessage ? systemMessage : undefined;
    localStorage.setItem("systemMessage", draft.systemMessage || "");
    chatConfigAtom.set(draft);
    toast({ status: "success", title: "Success" });
  }

  function handleCloseClick() {
    chatConfigAtom.set({ ...chatConfigAtom.get(), visible: false });
  }

  type ConfigType = typeof chatConfig;
  type ListItemType = {
    label: string;
    value: keyof ConfigType;
    placeholder: string;
  };

  const list: ListItemType[] = [
    {
      label: "OPENAI_SERVER",
      value: "openAIServer",
      placeholder: "https://api.openai.com/v1/chat/completions",
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
    <div
      className={`mx-6 rounded-lg shadow-2xl px-3 pt-3 pb-4 border
        ${colorMode === "light" ? "bg-white" : "bg-[#021627]"}
      `}
    >
      <div className="flex justify-end">
        <CloseButton size="md" onClick={handleCloseClick} />
      </div>
      <div className="space-y-4">
        <div>AI 背景设定：</div>
        <div className="flex space-x-2 items-end">
          <Textarea
            className="flex-1"
            placeholder="systemMessage. 例如：你是一个翻译工具，请将给出的内容翻译成中文，此外不要输出其他多余的内容"
            value={systemMessage}
            onChange={(e) => setSystemMessage(e.target.value)}
            rows={4}
            size="sm"
          />
          <IconButton aria-label="Save" size="sm" icon={<IconArchive size="1rem" />} onClick={handleSystemRoleSave} />
        </div>
        {list.map((item) => {
          return (
            <div key={item.value} className="flex space-x-2">
              <InputGroup size="sm">
                <InputLeftAddon children={item.label} />
                <Input
                  type="tel"
                  placeholder={item.placeholder}
                  // @ts-expect-error
                  value={config[item.value] || ""}
                  onChange={(e) => setConfig((draft) => ({ ...draft, [item.value]: e.target.value }))}
                />
              </InputGroup>
              <IconButton
                aria-label="Save"
                size="sm"
                icon={<IconArchive size="1rem" />}
                onClick={() => {
                  const draft = chatConfigAtom.get();
                  const value = config[item.value];
                  // @ts-expect-error
                  draft[item.value] = value ? value : undefined;
                  // @ts-expect-error
                  localStorage.setItem(item.value, value || "");
                  chatConfigAtom.set(draft);
                  toast({ status: "success", title: "Success" });
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

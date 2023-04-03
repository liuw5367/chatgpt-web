import { Button, IconButton, Select, Textarea, useToast } from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { IconEraser } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Cache } from "../../constants";
import { chatAtom, visibleAtom } from "../atom";
import { estimateTokens } from "../chat/token";
import promptsEn from "../prompts/en.json";
import { openPrompts } from "../prompts/openprompts";
import promptsOther from "../prompts/other.json";
import promptsShortcut from "../prompts/shortcuts";
import promptsZh from "../prompts/zh.json";
import SimpleDrawer from "../SimpleDrawer";

type OptionType = { act: string; prompt: string; desc?: string; remark?: string };
type TemplateType = { label: string; value: OptionType[] };

const templateOptions: TemplateType[] = [
  { label: "Shortcut", value: promptsShortcut },
  { label: "openPrompts", value: openPrompts },
  { label: "中文", value: promptsZh },
  { label: "英文", value: promptsEn },
  { label: "其他", value: promptsOther },
];

export function SystemPromptPanel() {
  const { t } = useTranslation();
  const toast = useToast({ position: "top", isClosable: true });
  const { currentChat } = useStore(chatAtom);
  const { systemMessage = "" } = currentChat;
  const { promptVisible } = useStore(visibleAtom);

  const [prompt, setPrompt] = useState(systemMessage);
  const [template, setTemplate] = useState("Shortcut");
  const [options, setOptions] = useState(promptsShortcut);
  const [desc, setDesc] = useState("");
  const [remark, setRemark] = useState("");

  const [token, setToken] = useState(0);

  useEffect(() => {
    if (promptVisible) {
      setPrompt(chatAtom.get().currentChat.systemMessage || "");
    }
  }, [promptVisible]);

  useEffect(() => {
    if (!promptVisible && prompt !== systemMessage) {
      handleClear();
    }
  }, [promptVisible, systemMessage]);

  useEffect(() => {
    if (prompt) {
      setToken(estimateTokens(prompt));
    } else {
      setToken(0);
    }
  }, [prompt]);

  function handleClose() {
    visibleAtom.set({ ...visibleAtom.get(), promptVisible: false });
  }

  function handleClear() {
    setPrompt("");
    setDesc("");
    setRemark("");
  }

  function updateSystemPrompt(prompt?: string) {
    const draft = chatAtom.get();
    const { currentChat, chatList } = draft;
    const chatItem = chatList.find((v) => v.id === currentChat.id);
    if (chatItem) chatItem.systemMessage = prompt;

    localStorage.setItem(Cache.CHAT_LIST, JSON.stringify(chatList));
    chatAtom.set({ ...draft, chatList, currentChat: { ...currentChat, systemMessage: prompt } });
  }

  function handleSaveClick() {
    updateSystemPrompt(prompt);
    if (!prompt) {
      handleClear();
    }
    handleClose();
  }

  function handleRemoveClick() {
    toast({ status: "success", title: t("toast.removed") });
    updateSystemPrompt();
    handleClear();
    handleClose();
  }

  return (
    <SimpleDrawer
      isOpen={promptVisible}
      onClose={handleClose}
      size="lg"
      header={t("prompt.title")}
      footer={
        <div className="w-full flex flex-row justify-between">
          <Button colorScheme="blue" onClick={handleRemoveClick}>
            {t("actions.remove")}
          </Button>
          <div className="flex flex-row">
            <Button variant="outline" mr={3} onClick={handleClose}>
              {t("actions.cancel")}
            </Button>
            <Button colorScheme="teal" onClick={handleSaveClick}>
              {t("actions.save")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="w-full h-full flex flex-col space-y-2 ">
        <div className="flex flex-col space-y-2" sm="flex-row items-center space-x-4 space-y-0">
          <div>
            <Select
              value={template}
              onChange={(e) => {
                const key = e.target.value;
                setTemplate(key);
                setOptions(templateOptions.find((item) => item.label === key)?.value || []);
              }}
            >
              {templateOptions.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          <div sm="min-w-60">
            <Select
              placeholder={t("prompt.select")}
              onChange={(e) => {
                const prompt = e.target.value;
                const item = options.find((item) => item.prompt === prompt);
                setPrompt(prompt);
                setRemark(item?.remark || "");
                setDesc(item?.desc === prompt ? "" : item?.desc || "");
              }}
            >
              {options.map((item) => (
                <option key={template + "-" + item.act} value={item.prompt}>
                  {item.act}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {remark && <div className="px-2 text-[15px] whitespace-pre-wrap">{remark}</div>}
        {desc && <div className="px-4 py-2 text-[15px] whitespace-pre-wrap rounded bg-black/10">{desc}</div>}

        <Textarea
          value={prompt ?? ""}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 !min-h-[50%] text-[14px] placeholder:text-[14px]"
          placeholder={t("prompt.placeholder")}
        />

        <div className="flex flex-row items-center justify-between space-x-2">
          <div className="flex flex-row space-x-2">
            <Button size="xs" aria-label="Token" title="Token">
              {token}
            </Button>
            <IconButton
              size="xs"
              aria-label="Clear"
              title="Clear"
              icon={<IconEraser size="1rem" stroke={1.5} />}
              onClick={handleClear}
            />
          </div>
          <div className="text-[14px]">{t("prompt.tip")}</div>
        </div>
      </div>
    </SimpleDrawer>
  );
}

import { Button, IconButton, Select, Textarea, useToast } from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { IconEraser } from "@tabler/icons-react";
import { ChakraStylesConfig, Select as SearchSelect } from "chakra-react-select";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { chatAtom, visibleAtom } from "../atom";
import { estimateTokens } from "../chat/token";
import { templateOptions } from "../prompts";
import SimpleDrawer from "../SimpleDrawer";
import { saveCurrentChatValue } from "../storage";

interface Props {
  type?: "side" | "drawer";
  sideWidth?: string;
  promptVisible: boolean;
}

export function SystemPromptPanel(props: Props) {
  const { promptVisible, type, sideWidth } = props;
  const { t } = useTranslation();
  const toast = useToast({ position: "top", isClosable: true });
  const { currentChat } = useStore(chatAtom);
  const { systemMessage = "" } = currentChat;

  const [prompt, setPrompt] = useState(systemMessage);
  const [template, setTemplate] = useState(templateOptions[0].label);
  const [options, setOptions] = useState(templateOptions[0].value);
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
    if (type === "side") return;
    visibleAtom.set({ ...visibleAtom.get(), promptVisible: false });
  }

  function handleClear() {
    setPrompt("");
    setDesc("");
    setRemark("");
  }

  function updateSystemPrompt(prompt?: string) {
    saveCurrentChatValue("systemMessage", prompt as string);
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

  const chakraStyles: ChakraStylesConfig = {
    dropdownIndicator: (provided) => ({
      ...provided,
      background: "transparent",
      p: 0,
      w: "40px",
    }),
  };

  return (
    <SimpleDrawer
      type={type}
      sideWidth={sideWidth}
      isOpen={promptVisible}
      onClose={handleClose}
      size="md"
      header={t("prompt.title")}
      footer={
        <div className="w-full flex flex-row justify-between">
          <Button colorScheme="blue" onClick={handleRemoveClick}>
            {t("actions.remove")}
          </Button>
          <div className="flex flex-row">
            {type !== "side" && (
              <Button variant="outline" mr={3} onClick={handleClose}>
                {t("actions.cancel")}
              </Button>
            )}
            <Button colorScheme="teal" onClick={handleSaveClick}>
              {t("actions.save")}
            </Button>
          </div>
        </div>
      }
    >
      <div className={`w-full h-full flex flex-col space-y-2`}>
        <div
          className="flex flex-col space-y-2"
          sm={type === "side" ? "" : "flex-row items-center space-x-4 space-y-0"}
        >
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
            <SearchSelect
              placeholder={t("prompt.select")}
              chakraStyles={chakraStyles}
              options={options.map(({ act, prompt }) => ({ label: act, value: prompt }))}
              onChange={({ value }) => {
                const prompt = value;
                const item = options.find((item) => item.prompt === prompt);
                setPrompt(prompt);
                setRemark(item?.remark || "");
                setDesc(item?.desc === prompt ? "" : item?.desc || "");
              }}
            />
          </div>
        </div>

        {remark && <div className="px-2 text-[15px] whitespace-pre-wrap">{remark}</div>}
        {desc && <div className="px-4 py-2 text-[15px] whitespace-pre-wrap rounded bg-black/10">{desc}</div>}

        <Textarea
          value={prompt ?? ""}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 !min-h-[50%] text-[14px] placeholder:text-[14px]"
          placeholder={t("prompt.placeholder") || ""}
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

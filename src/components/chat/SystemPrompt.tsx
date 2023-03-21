import {
  Button,
  IconButton,
  Select,
  Textarea,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
} from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { chatConfigAtom } from "./atom";
import { useState, useEffect } from "react";
import { estimateTokens } from "./token";
import { IconEraser, IconTrash } from "@tabler/icons-react";

import promptsZh from "./prompts/zh.json";
import promptsEn from "./prompts/en.json";
import promptsOther from "./prompts/other.json";
import promptsShortcut from "./prompts/shortcuts";
import { visibleAtom } from "../atom";

type OptionType = { act: string; prompt: string; desc?: string; remark?: string };
type TemplateType = { label: string; value: OptionType[] };

const templateOptions: TemplateType[] = [
  { label: "Shortcut", value: promptsShortcut },
  { label: "中文", value: promptsZh },
  { label: "英文", value: promptsEn },
  { label: "其他", value: promptsOther },
];

export function SystemPrompt() {
  const chatConfig = useStore(chatConfigAtom);
  const { promptVisible } = useStore(visibleAtom);

  const currentDate = new Date().toISOString().split("T")[0];
  const placeholder = `Example: You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.\nKnowledge cutoff: 2021-09-01\nCurrent date: ${currentDate}`;

  const [prompt, setPrompt] = useState(chatConfig.systemMessage);
  const [template, setTemplate] = useState("Shortcut");
  const [options, setOptions] = useState(promptsShortcut);
  const [desc, setDesc] = useState("");
  const [remark, setRemark] = useState("");

  const [token, setToken] = useState(0);

  useEffect(() => {
    if (promptVisible) {
      setPrompt(chatConfig.systemMessage);
    }
  }, [promptVisible]);

  useEffect(() => {
    if (!promptVisible && prompt !== chatConfig.systemMessage) {
      handleClear();
    }
  }, [promptVisible, chatConfig.systemMessage]);

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

  function update(content: string = "") {
    setPrompt(content);
  }

  function handleSaveClick() {
    if (prompt) {
      localStorage.setItem("systemMessage", prompt);
    } else {
      localStorage.removeItem("systemMessage");
      handleClear();
    }
    chatConfigAtom.set({ ...chatConfigAtom.get(), systemMessage: prompt?.trim() });
    handleClose();
  }

  const content = (
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
            placeholder="Select Act"
            onChange={(e) => {
              const prompt = e.target.value;
              const item = options.find((item) => item.prompt === prompt);
              update(prompt);
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
        value={prompt}
        placeholder={placeholder}
        onChange={(e) => update(e.target.value)}
        className="flex-1 !min-h-60 text-[14px] placeholder:text-[14px]"
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
        {/* <div className='text-[14px]'>After setting the prompt, you can send without entering any content</div> */}
        <div className="text-[14px]">设置后消息内容为空可直接发送</div>
      </div>
    </div>
  );

  return (
    <Drawer isOpen={promptVisible} size="md" placement="right" onClose={handleClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>System Prompt</DrawerHeader>

        <DrawerBody>{content}</DrawerBody>

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

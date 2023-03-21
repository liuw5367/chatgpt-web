import { Button, IconButton, Select, Textarea } from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { chatConfigAtom } from "./atom";
import { useState, useEffect } from "react";
import { estimateTokens } from "./token";
import { IconTrash } from "@tabler/icons-react";

import promptsZh from "./prompts/zh.json";
import promptsEn from "./prompts/en.json";
import promptsOther from "./prompts/other.json";
import promptsShortcut from "./prompts/shortcuts";

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

  const currentDate = new Date().toISOString().split("T")[0];
  const placeholder = `Example: You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.\nKnowledge cutoff: 2021-09-01\nCurrent date: ${currentDate}`;

  const [template, setTemplate] = useState("Shortcut");
  const [options, setOptions] = useState(promptsShortcut);
  const [desc, setDesc] = useState("");
  const [remark, setRemark] = useState("");
  const [token, setToken] = useState(0);

  useEffect(() => {
    if (chatConfig.systemMessage) {
      setToken(estimateTokens(chatConfig.systemMessage));
    } else {
      setToken(0);
    }
  }, [chatConfig.systemMessage]);

  function update(content?: string) {
    if (content) {
      localStorage.setItem("systemMessage", content);
    } else {
      setDesc("");
      setRemark("");
      localStorage.removeItem("systemMessage");
    }
    chatConfigAtom.set({ ...chatConfigAtom.get(), systemMessage: content?.trim() });
  }

  return (
    <div className="mx-6 pb-4 space-y-3">
      <div className="font-medium">System Prompt</div>

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
        rows={10}
        className="text-[14px] placeholder:text-[14px]"
        placeholder={placeholder}
        value={chatConfig.systemMessage}
        onChange={(e) => update(e.target.value)}
      />

      <div className="flex flex-row space-x-2">
        <Button size="xs" aria-label="Token" title="Token">
          {token}
        </Button>
        <IconButton
          aria-label="clear"
          size="xs"
          icon={<IconTrash size="1rem" stroke={1.5} />}
          onClick={() => update("")}
        />
      </div>
    </div>
  );
}

import { Select, Textarea } from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { chatConfigAtom } from "./atom";
import { useState } from "react";

import promptsZh from "./prompts/zh.json";
import promptsEn from "./prompts/en.json";
import promptsOther from "./prompts/other.json";

const templates = [
  { label: "中文", value: promptsZh },
  { label: "英文", value: promptsEn },
  { label: "其他", value: promptsOther },
];

export function SystemPrompt() {
  const chatConfig = useStore(chatConfigAtom);

  const currentDate = new Date().toISOString().split("T")[0];
  const placeholder = `Example: You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible.\nKnowledge cutoff: 2021-09-01\nCurrent date: ${currentDate}`;

  const [options, setOptions] = useState(promptsZh);

  function update(content?: string) {
    chatConfigAtom.set({ ...chatConfigAtom.get(), systemMessage: content?.trim() });
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="font-medium">System Prompt</div>

      <div className="flex flex-col space-y-2" sm="flex-row items-center space-x-4 space-y-0">
        <div>
          <Select
            defaultValue="中文"
            onChange={(e) => {
              const key = e.target.value;
              setOptions(templates.find((item) => item.label === key)?.value || []);
            }}
          >
            {templates.map((item) => (
              <option key={item.label} value={item.label}>
                {item.label}
              </option>
            ))}
          </Select>
        </div>
        <div sm="min-w-60">
          <Select placeholder="Select Act" onChange={(e) => update(e.target.value)}>
            {options.map((item) => (
              <option key={item.prompt} value={item.prompt}>
                {item.act}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Textarea
        rows={6}
        className="text-[14px] placeholder:text-[14px]"
        placeholder={placeholder}
        value={chatConfig.systemMessage}
        onChange={(e) => update(e.target.value)}
      />
    </div>
  );
}

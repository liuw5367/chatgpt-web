import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Input, message } from "antd";
import { useStore } from "@nanostores/react";
import { useState } from "react";

import { chatConfigAtom } from "./atom";

export default function SettingPanel() {
  const chatConfig = useStore(chatConfigAtom);

  const [config, setConfig] = useState({ ...chatConfig });
  const [systemMessage, setSystemMessage] = useState(chatConfig.systemMessage);

  function handleSystemRoleSave() {
    const draft = chatConfigAtom.get();
    draft.systemMessage = systemMessage ? systemMessage : undefined;
    localStorage.setItem("systemMessage", draft.systemMessage || "");
    chatConfigAtom.set(draft);
    message.success("");
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

  const list:ListItemType[] = [
    {
      label: "OPENAI_KEY",
      value: "openAIKey",
      placeholder: "请输入 OPENAI_KEY",
    },
    {
      label: "OPENAI_SERVER",
      value: "openAIServer",
      placeholder: "https://api.openai.com/v1/chat/completions",
    },
    {
      label: "Unisound_APPKEY",
      value: "unisoundAppKey",
      placeholder: "请输入 ai.unisound.com 的 APPKEY",
    },
    {
      label: "Unisound_SECRET",
      value: "unisoundSecret",
      placeholder: "请输入 ai.unisound.com 的 SECRET",
    },
  ];

  return (
    <div className="mx-4 rounded-lg shadow-2xl px-3 pt-3 pb-4 bg-rose-50">
      <div className="flex justify-end">
        <CloseOutlined onClick={handleCloseClick} />
      </div>
      <div className="space-y-4">
        <div>AI 背景设定：</div>
        <div className="flex space-x-2 items-end">
          <Input.TextArea
            className="flex-1"
            placeholder="role: system"
            value={systemMessage}
            onChange={(e) => setSystemMessage(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 6 }}
            allowClear
          />
          <SaveOutlined className="p-2 rounded bg-blue-100 hover:bg-blue-200" onClick={handleSystemRoleSave} />
        </div>
        {list.map((item) => {
          return (
            <div key={item.value} className="flex space-x-2">
              <Input
                addonBefore={item.label}
                placeholder={item.placeholder}
                // @ts-expect-error
                value={config[item.value] || ""}
                onChange={(e) =>
                  setConfig((draft) => ({
                    ...draft,
                    [item.value]: e.target.value,
                  }))
                }
                allowClear
              />
              <SaveOutlined
                className="p-2 rounded bg-blue-100 hover:bg-blue-200" //
                onClick={() => {
                  const draft = chatConfigAtom.get();
                  const value = config[item.value];
                  // @ts-expect-error
                  draft[item.value] = value ? value : undefined;
                  // @ts-expect-error
                  localStorage.setItem(item.value, value || "");
                  chatConfigAtom.set(draft);
                  message.success("");
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

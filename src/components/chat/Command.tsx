import { useDebounceEffect } from "ahooks";
import { useEffect, useState } from "react";

import { CacheKeys } from "../../constants";
import type { OptionType } from "../prompts";
import { allPrompts } from "../prompts";
import { scrollToElement } from "../utils";

interface Props {
  value: string;
  onPromptClick?: (prompt: string) => void;
}

const TOP_ID = "command-list-top";
function scrollToTop() {
  scrollToElement(TOP_ID, { behavior: "auto" });
}

function getPrompts() {
  const favorites = JSON.parse(localStorage.getItem(CacheKeys.PROMPT_FAVORITE) || "[]") as OptionType[];
  const defaultPrompts = allPrompts.slice(0, 50);
  return [...favorites, ...defaultPrompts];
}

export function Command(props: Props) {
  const { value, onPromptClick } = props;
  const [promptList, setPromptList] = useState<OptionType[]>([]);

  useEffect(() => {
    setPromptList(getPrompts());
  }, []);

  useDebounceEffect(
    () => {
      let command = value?.trim();
      if (command === "/") {
        setPromptList(getPrompts());
        scrollToTop();
        return;
      }
      if (!command || command.length <= 1) return;
      if (!command.startsWith("/")) return;
      command = command.substring(1).toLowerCase();

      const prompts = allPrompts.filter((item) => {
        return item.act.toLowerCase().includes(command) || item.prompt.toLowerCase().includes(command);
      });
      setPromptList(prompts.reverse());
      scrollToTop();
    },
    [value],
    { wait: 100, maxWait: 300 }
  );

  if (promptList.length === 0) return null;
  if (!value.startsWith("/")) return null;

  return (
    <div className={`w-full flex flex-col justify-end`}>
      <div
        className={`rounded-lg w-full max-h-[40vh] overflow-x-hidden overflow-y-auto p-1`}
        style={{
          backgroundColor: "var(--chakra-colors-chakra-body-bg)",
          border: "1px solid var(--chakra-colors-chakra-border-color)",
        }}
      >
        {promptList.map((item) => (
          <div key={item.id} className="flex flex-col text-[12px]">
            <div
              className="flex flex-col cursor-pointer border border-transparent rounded-lg px-2 py-1 hover:border-teal-700 hover:bg-teal-700/5"
              onClick={() => onPromptClick?.(item.prompt)}
            >
              <div className="font-bold">{item.act}</div>
              <div className="line-clamp-2">{item.prompt}</div>
            </div>
          </div>
        ))}
        <div id={TOP_ID} />
      </div>
    </div>
  );
}

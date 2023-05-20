import { useDebounceEffect } from "ahooks";
import { useEffect, useState } from "react";

import type { OptionType } from "../prompts";
import { allPrompts } from "../prompts";
import { scrollToElement } from "../utils";

interface Props {
  width: string;
  value: string;
  onPromptClick?: (prompt: string) => void;
}

const TOP_ID = "command-list-top";
const defaultPrompts = allPrompts.slice(0, 50);
function scrollToTop() {
  scrollToElement(TOP_ID, { behavior: "auto" });
}

export function Command(props: Props) {
  const { value, width, onPromptClick } = props;
  const [bottomHeight, setBottomHeight] = useState(146);
  const [promptList, setPromptList] = useState<OptionType[]>(defaultPrompts);

  useDebounceEffect(
    () => {
      let command = value?.trim();
      if (command === "/") {
        setPromptList(defaultPrompts);
        scrollToTop();
        return;
      }
      if (!command || command.length <= 1) return;
      if (!command.startsWith("/")) return;
      command = command.substring(1).toLowerCase();

      const prompts = allPrompts.filter((item) => {
        return item.act.toLowerCase().includes(command) || item.prompt.toLowerCase().includes(command);
      });
      setPromptList(prompts);
      scrollToTop();
    },
    [value],
    { wait: 500 }
  );

  useEffect(() => {
    const bottom = document.getElementById("chat-bottom-wrapper");
    if (bottom) {
      setBottomHeight(bottom.clientHeight);
    }
  }, [value]);

  if (promptList.length === 0) return null;

  return (
    <div
      className={`fixed bottom-0 w-full ${width} flex flex-col justify-end`}
      style={{
        paddingBottom: bottomHeight + 16,
        display: value.startsWith("/") ? "flex" : "none",
      }}
    >
      <div
        className={`rounded-lg w-full max-h-[50vh] overflow-x-hidden overflow-y-auto`}
        style={{
          maxWidth: "calc(100vw - 32px)",
          backgroundColor: "var(--chakra-colors-chakra-body-bg)",
          border: "1px solid var(--chakra-colors-chakra-border-color)",
        }}
      >
        <div id={TOP_ID} />
        {promptList.map((item) => (
          <div
            key={item.id}
            className="flex flex-col cursor-pointer px-4 py-3 space-y-1 last:border-b-none hover:bg-black/5"
            style={{ borderBottom: "1px solid var(--chakra-colors-chakra-border-color)" }}
            onClick={() => onPromptClick?.(item.prompt)}
          >
            <div className="">{item.act}</div>
            <div className="line-clamp-3 text-[12px]">{item.prompt}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

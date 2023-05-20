import { CloseButton } from "@chakra-ui/react";
import { useDebounceEffect } from "ahooks";
import { useEffect, useRef, useState } from "react";

import { scrollToElement } from "../utils";

interface Props {
  width: string;
  value: string;
  onPromptClick?: (prompt: string) => void;
}

const TOP_ID = "search-suggestions-list-top";

function scrollToTop() {
  scrollToElement(TOP_ID, { behavior: "auto" });
}

export function SearchSuggestions(props: Props) {
  const { value, width, onPromptClick } = props;
  const [bottomHeight, setBottomHeight] = useState(146);
  const [promptList, setPromptList] = useState<string[]>([]);
  const lastContentRef = useRef("");
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useDebounceEffect(
    () => {
      search();
    },
    [value],
    { wait: 200, maxWait: 300 }
  );

  useEffect(() => {
    const bottom = document.getElementById("chat-bottom-wrapper");
    if (bottom) {
      setBottomHeight(bottom.clientHeight);
    }
  }, [value]);

  async function search() {
    if (!value?.trim() || value?.startsWith("/")) {
      if (promptList.length > 0) {
        setPromptList([]);
      }
      return;
    }

    const content = value?.trim();
    if (content === lastContentRef.current) return;
    lastContentRef.current = "";

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
        }),
      });
      if (!valueRef.current?.trim()) {
        // 可能等接口返回时，输入框无内容，不需要显示
        setPromptList([]);
        return;
      }
      if (response.ok) {
        const json = await response.json();
        setPromptList(json);
        scrollToTop();
      }
    } catch (e) {
      console.log(e);
    }
  }

  if (promptList.length === 0) return null;

  return (
    <div
      className={`fixed bottom-0 w-full ${width} flex flex-col justify-end`}
      style={{
        paddingBottom: bottomHeight + 16,
        display: "flex",
      }}
    >
      <div
        className={`relative rounded-lg w-full max-h-[35vh] flex flex-col items-end overflow-x-hidden overflow-y-auto`}
        style={{
          maxWidth: "calc(100vw - 32px)",
          backgroundColor: "var(--chakra-colors-chakra-body-bg)",
          border: "1px solid var(--chakra-colors-chakra-border-color)",
        }}
      >
        <CloseButton
          className="sticky right-0 top-0"
          size="md"
          onClick={() => {
            setPromptList([]);
          }}
        />
        <div id={TOP_ID} />
        <div className="w-full -mt-8">
          {promptList.map((item) => (
            <div
              key={item}
              className="flex flex-col cursor-pointer px-4 py-3 space-y-1 last:border-b-none hover:bg-black/5"
              style={{ borderBottom: "1px solid var(--chakra-colors-chakra-border-color)" }}
              onClick={() => {
                onPromptClick?.(item);
                setPromptList([]);
                lastContentRef.current = item;
              }}
            >
              <div className="">{item}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useDebounceEffect } from 'ahooks';
import { useEffect, useRef, useState } from 'react';

import { scrollToElement } from '../utils';

interface Props {
  width: string;
  value: string;
  onPromptClick?: (prompt: string) => void;
}

const TOP_ID = 'search-suggestions-list-top';

function scrollToTop() {
  scrollToElement(TOP_ID, { behavior: 'auto' });
}

export function SearchSuggestions(props: Props) {
  const { value, width, onPromptClick } = props;
  const [bottomHeight, setBottomHeight] = useState(146);
  const [promptList, setPromptList] = useState<string[]>([]);
  const lastContentRef = useRef('');
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useDebounceEffect(
    () => {
      search();
    },
    [value],
    { wait: 200, maxWait: 300 },
  );

  useEffect(() => {
    const bottom = document.getElementById('chat-bottom-wrapper');
    if (bottom) {
      setBottomHeight(bottom.clientHeight);
    }
  }, [value]);

  async function search() {
    if (!value?.trim() || value?.startsWith('/')) {
      if (promptList.length > 0) {
        setPromptList([]);
      }
      return;
    }

    const content = value?.trim();
    if (content === lastContentRef.current) return;
    lastContentRef.current = '';

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
        }),
      });
      if (!valueRef.current?.trim()) {
        // 可能等接口返回时，输入框无内容，不需要显示
        setPromptList([]);
        return;
      }
      const json = await response.json();
      setPromptList(json);
      scrollToTop();
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
        display: 'flex',
      }}
    >
      <div
        className={`rounded-lg w-full max-h-[35vh] bg-$chakra-colors-chakra-body-bg`}
        border="~ solid $chakra-colors-chakra-border-color"
        overflow="x-hidden y-auto"
        style={{ maxWidth: 'calc(100vw - 32px)' }}
      >
        <div id={TOP_ID} />
        {promptList.map((item) => (
          <div
            key={item}
            className="px-4 py-3 flex flex-col space-y-1 last:border-b-none hover:bg-black/15"
            border="b b-solid b-$chakra-colors-chakra-border-color"
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
  );
}

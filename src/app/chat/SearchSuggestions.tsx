import { CloseButton } from '@chakra-ui/react';
import { useDebounceEffect } from 'ahooks';
import { useEffect, useRef, useState } from 'react';

import { request, scrollToElement } from '../utils';

interface Props {
  value: string;
  onPromptClick?: (prompt: string) => void;
}

const TOP_ID = 'search-suggestions-list-top';

function scrollToTop() {
  scrollToElement(TOP_ID, { behavior: 'auto' });
}

export function SearchSuggestions(props: Props) {
  const { value, onPromptClick } = props;
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

  async function search() {
    if (!value?.trim() || value?.startsWith('/')) {
      if (promptList.length > 0) {
        setPromptList([]);
      }
      return;
    }

    const content = value?.trim();
    if (content === lastContentRef.current) {
      return;
    }
    lastContentRef.current = '';

    try {
      const response = await request('/api/search', {
        method: 'POST',
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
        setPromptList(json.reverse());
        scrollToTop();
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  if (promptList.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col justify-end">
      <div
        className="relative max-h-[35vh] w-full flex flex-col items-end overflow-x-hidden overflow-y-auto rounded-lg p-1"
        style={{
          backgroundColor: 'var(--chakra-colors-chakra-body-bg)',
          border: '1px solid var(--chakra-colors-chakra-border-color)',
        }}
      >
        <CloseButton className="sticky right-0 top-0" size="md" onClick={() => setPromptList([])} />
        <div className="w-full -mt-8">
          {promptList.map((item) => (
            <div key={item} className="flex flex-col text-[14px]">
              <div
                className="flex flex-col cursor-pointer border border-transparent rounded-lg px-2 py-2 hover:border-teal-700 hover:bg-teal-700/5"
                onClick={() => {
                  onPromptClick?.(item);
                  setPromptList([]);
                  lastContentRef.current = item;
                }}
              >
                <div>{item}</div>
              </div>
            </div>
          ))}
        </div>
        <div id={TOP_ID} />
      </div>
    </div>
  );
}

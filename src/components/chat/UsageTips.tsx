import { useState } from 'react';

export function UsageTips() {
  const [tips] = useState<string[]>([
    '输入框为空时，按上箭头将填充上一条消息内容',
    '默认非连续对话，需点击底部按钮开启',
    '默认隐藏语音按钮，输入 KEY 后显示',
  ]);

  return (
    <div className="p-4">
      {tips.map((item) => {
        return (
          <div key={item} className="flex flex-row space-x-1 text-gray-400 text-[13px]">
            <div className="font-bold">{'•'}</div>
            <div>{item}</div>
          </div>
        );
      })}
    </div>
  );
}

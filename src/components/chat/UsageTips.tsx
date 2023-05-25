import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';

export function UsageTips() {
  const { i18n } = useTranslation();
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    setTips(
      i18n.language.toLowerCase().includes('zh')
        ? [
            '输入 / 可激活 Prompt 搜索窗口',
            '输入框为空时，按上箭头将填充上一条消息内容',
            '提示词设置底部🌟可对提示词进行收藏',
            '提示词设置底部可对提示词进行导入导出',
            '默认非连续对话，需点击底部按钮开启',
            '连续对话消息底部会显示编码用来定位属于哪个对话',
            '默认开启搜索内容建议，可在设置中关闭',
            '默认未开启回车键发送，可在设置中开启',
            '消息底部统计数字为Token使用量',
            '默认隐藏语音按钮，输入 KEY 后显示',
          ]
        : [
            'Enter / Activate Prompt search window',
            'When the input box is empty, press the up arrow to fill in the previous message content',
            'Search content suggestions are enabled by default and can be disabled in settings',
            'Enter key sending is not enabled by default, but can be enabled in settings',
            'Non-continuous conversation is enabled by default and requires clicking the bottom button to activate',
            'The voice button is hidden by default and will be displayed after typing KEY',
          ],
    );
  }, [i18n.language]);

  return (
    <div className="p-4">
      {tips.map((item) => {
        return (
          <div key={item} className="flex flex-row text-[13px] text-gray-400 space-x-1">
            <div className="font-bold">{'•'}</div>
            <div>{item}</div>
          </div>
        );
      })}
    </div>
  );
}

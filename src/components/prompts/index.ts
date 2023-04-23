import promptsEn from '../prompts/en.json';
import promptsOpen from '../prompts/openprompts';
import promptsOther from '../prompts/other.json';
import { promptsShortcut, promptsShortcutEn } from '../prompts/shortcuts';
import promptsZh from '../prompts/zh.json';

export { promptsEn, promptsOpen, promptsOther, promptsShortcut, promptsShortcutEn, promptsZh };

export type OptionType = {
  act: string;
  prompt: string;
  desc?: string;
  remark?: string;
};

type TemplateType = {
  label: string;
  value: OptionType[];
};

export const templateOptions: TemplateType[] = [
  { label: 'Shortcut', value: promptsShortcut },
  { label: 'ShortcutEn', value: promptsShortcutEn },
  { label: 'OpenPrompts', value: promptsOpen },
  { label: '中文', value: promptsZh },
  { label: '英文', value: promptsEn },
  { label: '其他', value: promptsOther },
];

export const allPrompts: OptionType[] = templateOptions
  .map(({ label, value }) => value.map(({ act, prompt }) => ({ desc: label + '-' + act, act, prompt })))
  .reduce((a, b) => {
    return [...a, ...b];
  });

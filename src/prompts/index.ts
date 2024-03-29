import promptsEn from './en.json';
import promptsOpen from './openprompts';
import promptsOther from './other.json';
import { promptsShortcut, promptsShortcutEn } from './shortcuts';
import promptsZh from './zh.json';

export interface OptionType {
  id?: string;
  act: string;
  prompt: string;
  desc?: string;
  remark?: string;
}

interface TemplateType {
  label: string;
  value: OptionType[];
}

export const templateOptions: TemplateType[] = [
  { label: 'Shortcut', value: promptsShortcut },
  { label: 'OpenPrompts', value: promptsOpen },
  { label: '中文', value: promptsZh },
  { label: '其他', value: promptsOther },
  { label: 'ShortcutEn', value: promptsShortcutEn },
  { label: '英文', value: promptsEn },
];

export const allPrompts: OptionType[] = templateOptions.flatMap(({ label, value }) =>
  value.map(({ act, prompt, desc, remark }) => ({
    id: `${label}-${act}`,
    act,
    prompt,
    desc,
    remark,
  })),
);

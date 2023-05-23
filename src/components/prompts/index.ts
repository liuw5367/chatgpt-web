import promptsEn from './en.json';
import promptsOpen from './openprompts';
import promptsOther from './other.json';
import { promptsShortcut, promptsShortcutEn } from './shortcuts';
import promptsZh from './zh.json';

export { promptsEn, promptsOpen, promptsOther, promptsShortcut, promptsShortcutEn, promptsZh };

export type OptionType = {
  id?: string;
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
  .map(({ label, value }) =>
    value.map(({ act, prompt, desc, remark }) => ({
      id: label + '-' + act,
      act,
      prompt,
      desc,
      remark,
    })),
  )
  .reduce((a, b) => {
    return [...a, ...b];
  });

export const allTemplates: TemplateType[] = [{ label: 'Default', value: allPrompts }];

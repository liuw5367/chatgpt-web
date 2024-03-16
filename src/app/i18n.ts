import { useMemoizedFn } from 'ahooks';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import localeEn from '../locales/en.json';
import localeZh from '../locales/zh.json';

interface State {
  language?: string;
}

function getLanguage() {
  if (typeof navigator === 'undefined') {
    return '';
  }
  return navigator.language;
}

export const i18nStore = create<State, [['zustand/persist', State]]>(
  persist(
    (set, get) => ({
      language: undefined,
    }),
    {
      name: 'persist-i18n',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useTranslation() {
  const language = i18nStore((s) => s.language);
  const currentLanguage = language || getLanguage();

  const t = useMemoizedFn((key: string): string => {
    return translate(key, language);
  });

  const changeLanguage = useMemoizedFn((language: string) => {
    i18nStore.setState({ language });
  });

  return { t, language: currentLanguage, changeLanguage };
}

function getValue(data: any, key: string) {
  const keys = key.split('.');
  let value = data;
  for (const key_ of keys) {
    value = value[key_];
  }
  return value;
}

export function translate(key: string, language = i18nStore.getState().language) {
  const currentLanguage = language || getLanguage();
  const isZh = currentLanguage.toLowerCase().includes('zh');
  if (isZh) {
    return getValue(localeZh, key) || key;
  }
  return getValue(localeEn, key) || key;
}

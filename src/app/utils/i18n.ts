import { useMemoizedFn } from 'ahooks';

import localeEn from '../../locales/en.json';
import localeZh from '../../locales/zh.json';
import { i18nStore } from '../stores';

export function useTranslation() {
  const language = i18nStore((s) => s.language);
  const currentLanguage = language || navigator.language;

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
  const currentLanguage = language || navigator.language;
  const isZh = currentLanguage.toLowerCase().includes('zh');
  if (isZh) {
    return getValue(localeZh, key) || key;
  }
  return getValue(localeEn, key) || key;
}

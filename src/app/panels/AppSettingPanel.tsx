import { SimpleDrawer } from '../../components';
import { APP_VERSION } from '../../constants';
import { supportLanguages } from '../utils/Recognition';
import { useTranslation } from '../utils/i18n';
import type { ModelSettingState } from '../stores';
import { useAppSettingStore, useModelSettingStore, usePanelVisibleStore } from '../stores';
import { allModels, allProviders, supportModels } from '../model';
import { SettingItem } from '../components';

export interface SettingItemType<T = string> {
  type?: 'password' | 'number' | 'switch' | 'select' | 'input';
  label: string;
  value: T;
  placeholder: string;
  desc?: string | null;
}

const asrLanguageList = Object.entries(supportLanguages).map(([label, value]) => ({ label, value }));

export function AppSettingPanel() {
  const { t } = useTranslation();
  const settingVisible = usePanelVisibleStore((s) => s.settingVisible);

  const config = useAppSettingStore();
  const provider = config.provider;

  const allModelSettings = useModelSettingStore((s) => s);
  const providerSettings = allModelSettings[provider] || {};

  const settingList: SettingItemType[] = [
    { type: 'switch', label: t('SearchSuggestions'), value: 'searchSuggestions', placeholder: '' },
    { type: 'switch', label: t('settings.EnterSend'), value: 'enterSend', placeholder: '' },
    { type: 'input', label: t('Access Code'), value: 'accessCode', placeholder: `${t('please enter')} ${t('Access Code')}` },
    { type: 'select', label: t('SpeechToText'), value: 'asrLanguage', placeholder: '' },
    { type: 'select', label: t('Provider'), value: 'provider', placeholder: '' },
  ];

  const modelSettingList: SettingItemType[] = [
    { type: 'select', label: `${provider} model`, value: 'modelId', placeholder: '' },
    { type: 'input', label: `${provider} baseURL`, value: 'baseURL', placeholder: providerSettings.defaultBaseURL || '' },
    { type: 'input', label: `${provider} apiKey`, value: 'apiKey', placeholder: '' },
    ...(supportModels[provider].settings || []).map((v) => ({ ...v, desc: t(v.desc || '') })),
  ];

  function handleClose() {
    usePanelVisibleStore.setState({ settingVisible: false });
  }

  return (
    <SimpleDrawer
      isOpen={settingVisible}
      onClose={handleClose}
      size="md"
      header={(
        <div className="space-x-4">
          <span>{t('Settings')}</span>
          <span className="text-sm font-normal">{APP_VERSION}</span>
        </div>
      )}
    >
      <div className="flex flex-col space-y-4">
        {settingList.map((item) => {
          // @ts-expect-error value
          const value = config[item.value] || '';

          return (
            <SettingItem
              key={item.value}
              options={getOptionsByType(item.value, provider)}
              item={item}
              value={value}
              onChange={(value) => {
                console.log(item.value, [value]);
                useAppSettingStore.setState({ [item.value]: value });
                if (item.value === 'provider') {
                  const provider = value as keyof ModelSettingState;
                  useModelSettingStore.setState((state) => ({
                    [provider]: { ...state[provider], modelId: supportModels[provider].models[0]?.value || undefined },
                  }));
                }
              }}
            />
          );
        })}
        {modelSettingList.map((item) => {
          // @ts-expect-error value
          const value = providerSettings[item.value] || '';

          return (
            <SettingItem
              key={item.value}
              options={getOptionsByType(item.value, provider)}
              item={item}
              value={value}
              onChange={(value) => {
                console.log(item.value, [value]);
                useModelSettingStore.setState((state) => ({
                  [provider]: { ...state[provider], [item.value]: value },
                }));
              }}
            />
          );
        })}
      </div>
    </SimpleDrawer>
  );
}

function getOptionsByType(type: string, provider?: keyof ModelSettingState) {
  if (type === 'provider') {
    return allProviders;
  }
  if (type === 'asrLanguage') {
    return asrLanguageList;
  }
  if (type === 'allModel') {
    return allModels;
  }
  if (provider) {
    return supportModels[provider].models;
  }
  return [];
}

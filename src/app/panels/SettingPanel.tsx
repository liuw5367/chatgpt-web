import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Switch,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

import { PasswordInput, SimpleDrawer } from '../../components';
import { APP_VERSION, defaultModel } from '../../constants';
import { supportLanguages } from '../chat/Recognition';
import { useTranslation } from '../i18n';
import type { ChatConfigType } from '../store';
import { chatConfigStore, visibleStore } from '../store';

export interface SettingItemType<T = string> {
  type?: 'password' | 'number' | 'switch' | 'select';
  label: string;
  value: T;
  placeholder: string;
  desc?: string | null;
  max?: number;
}

export const modelList = [
  { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo', token: 16385 },
  { label: 'gpt-4o', value: 'gpt-4o', token: 128000 },
  { label: 'gpt-4o-mini', value: 'gpt-4o-mini', token: 128000 },
  { label: 'gpt-4', value: 'gpt-4', token: 8192 },
  { label: 'gpt-4-turbo', value: 'gpt-4-turbo', token: 128000 },
  { label: 'gpt-4-32k', value: 'gpt-4-32k', token: 32768 },
];

const asrLanguageList = Object.entries(supportLanguages).map(([label, value]) => ({ label, value }));

export function SettingPanel() {
  const { t } = useTranslation();
  const toast = useToast({ position: 'top', isClosable: true });
  const chatConfig = chatConfigStore();
  const settingVisible = visibleStore((s) => s.settingVisible);

  const [config, setConfig] = useState({ ...chatConfig });

  useEffect(() => {
    if (settingVisible) {
      setConfig({ ...chatConfigStore.getState() });
    }
  }, [settingVisible]);

  function handleClose() {
    visibleStore.setState({ settingVisible: false });
  }

  function handleSaveClick() {
    const draft = chatConfigStore.getState();
    const result = { ...draft, ...config };
    chatConfigStore.setState(result);
    handleClose();
    toast({ status: 'success', title: t('Success'), duration: 1000 });
  }

  function renderItem(item: SettingItemType) {
    return (
      <SettingItem
        key={item.value}
        item={item}
        value={config[item.value as keyof ChatConfigType] || ''}
        onChange={(value) => setConfig((draft) => ({ ...draft, [item.value]: value }))}
      />
    );
  }

  const chatConfigList: SettingItemType[] = [
    {
      type: 'switch',
      label: t('SearchSuggestions'),
      value: 'searchSuggestions',
      placeholder: '',
    },
    {
      type: 'switch',
      label: t('settings.EnterSend'),
      value: 'enterSend',
      placeholder: '',
    },
    {
      label: t('Access Code'),
      value: 'accessCode',
      placeholder: `${t('please enter')} ${t('Access Code')}`,
    },
    { label: 'OpenAI Host', value: 'openAIHost', placeholder: 'https://api.openai.com' },
    { label: 'OpenAI Key', value: 'openAIKey', placeholder: `${t('please enter')} ` + `OPENAI_KEY` },
    { label: 'OpenAI Model', value: 'openAIModel', type: 'select', placeholder: defaultModel },
    {
      type: 'number',
      label: 'temperature',
      value: 'temperature',
      max: 2,
      placeholder: '',
      desc: t('settings.temperature'),
    },
    {
      type: 'number',
      label: 'top_p',
      value: 'top_p',
      max: 1,
      placeholder: '',
      desc: t('settings.top_p'),
    },
    {
      type: 'select',
      label: t('SpeechToText'),
      value: 'asrLanguage',
      placeholder: '',
    },
  ];

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
      footer={(
        <>
          <Button variant="outline" mr={3} onClick={handleClose}>
            {t('Cancel')}
          </Button>
          <Button colorScheme="teal" onClick={handleSaveClick}>
            {t('Save')}
          </Button>
        </>
      )}
    >
      <div className="flex flex-col space-y-4">{chatConfigList.map((item) => renderItem(item))}</div>
    </SimpleDrawer>
  );
}

interface ItemProps {
  item: SettingItemType;
  value: string;
  onChange?: (v: string) => void;
}

export function SettingItem({ item, value, onChange }: ItemProps) {
  const horizontal = item.type === 'switch';

  return (
    <FormControl className={`${horizontal && 'flex flex-row'}`}>
      <FormLabel className={`${horizontal && 'flex-1'}`}>
        <span>{item.label}</span>
      </FormLabel>
      {item.type === 'password'
        ? (
          <PasswordInput
            className="flex-1"
            placeholder={item.placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
          )
        : item.type === 'select'
          ? (
            <Select value={value} onChange={(e) => onChange?.(e.target.value)}>
              {(item.value === 'asrLanguage' ? asrLanguageList : modelList).map((item) => (
                <option key={item.label} value={item.label}>
                  {item.value}
                </option>
              ))}
            </Select>
            )
          : item.type === 'number'
            ? (
              <NumberInput className="flex-1" min={0} max={item.max} step={0.1} value={value} onChange={(v) => onChange?.(v)}>
                <NumberInputField placeholder={item.placeholder} />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              )
            : item.type === 'switch'
              ? (
                <Switch
                  colorScheme="teal"
                  isChecked={value === '1'}
                  onChange={(e) => onChange?.(e.target.checked ? '1' : '0')}
                />
                )
              : (
                <Input
                  className="flex-1"
                  focusBorderColor="teal.600"
                  placeholder={item.placeholder}
                  value={value}
                  onChange={(e) => onChange?.(e.target.value)}
                />
                )}
      {item.desc && <FormHelperText>{item.desc}</FormHelperText>}
    </FormControl>
  );
}

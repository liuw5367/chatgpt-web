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
import { APP_VERSION } from '../../constants';
import { supportLanguages } from '../chat/Recognition';
import { useTranslation } from '../i18n';
import type { ChatConfigType } from '../store';
import { chatConfigStore, visibleStore } from '../store';
import { request } from '../utils';

export type SettingItemType<T = string> = {
  type?: 'password' | 'number' | 'switch' | 'select';
  label: string;
  value: T;
  placeholder: string;
  desc?: string | null;
  max?: number;
};

export const modelList = [
  { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
  { label: 'gpt-3.5-turbo-16k', value: 'gpt-3.5-turbo-16k' },
  { label: 'gpt-4', value: 'gpt-4' },
  { label: 'gpt-4-32k', value: 'gpt-4-32k' },
  { label: 'text-davinci-003', value: 'text-davinci-003' },
  { label: 'text-davinci-002', value: 'text-davinci-002' },
  { label: 'code-davinci-002', value: 'code-davinci-002' },
];

const asrLanguageList = Object.entries(supportLanguages).map(([label, value]) => ({ label, value }));

export function SettingPanel() {
  const { t } = useTranslation();
  const toast = useToast({ position: 'top', isClosable: true });
  const chatConfig = chatConfigStore();
  const settingVisible = visibleStore((s) => s.settingVisible);

  const [config, setConfig] = useState({ ...chatConfig });
  const [balance, setBalance] = useState('');
  const [abortController, setAbortController] = useState<AbortController>();

  useEffect(() => {
    return () => {
      abortController?.abort();
    };
  }, [abortController]);

  useEffect(() => {
    if (settingVisible) {
      setConfig({ ...chatConfigStore.getState() });
    }
  }, [settingVisible]);

  async function requestUsage() {
    try {
      const controller = new AbortController();
      setAbortController(controller);

      const response = await request('/api/usage', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          apiKey: chatConfig.openAIKey,
        }),
      });

      const json = await response.json();
      if (json.error?.code) {
        // toast({ status: "error", title: json.error.code, description: json.error.message });
      } else {
        const { total_usage } = json;
        if (total_usage != null && total_usage !== '') {
          setBalance('$' + (total_usage / 100).toFixed(5));
        }
      }
    } catch {
      // toast({ status: "error", title: e.toString() });
    }
    setAbortController(undefined);
  }

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
        balance={balance}
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
      placeholder: t('please enter') + ' ' + t('Access Code'),
    },
    { label: 'OpenAI Host', value: 'openAIHost', placeholder: 'https://api.openai.com' },
    { label: 'OpenAI Key', value: 'openAIKey', placeholder: t('please enter') + ' ' + 'OPENAI_KEY' },
    { label: 'OpenAI Model', value: 'openAIModel', type: 'select', placeholder: 'gpt-3.5-turbo' },
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
      label: '语音识别语言',
      value: 'asrLanguage',
      placeholder: '',
    },
  ];

  return (
    <SimpleDrawer
      isOpen={settingVisible}
      onClose={handleClose}
      size="md"
      header={
        <div className="space-x-4">
          <span>{t('Settings')}</span>
          <span className="text-sm font-normal">{APP_VERSION}</span>
        </div>
      }
      footer={
        <>
          <Button variant="outline" mr={3} onClick={handleClose}>
            {t('Cancel')}
          </Button>
          <Button colorScheme="teal" onClick={handleSaveClick}>
            {t('Save')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col space-y-4">{chatConfigList.map((item) => renderItem(item))}</div>
    </SimpleDrawer>
  );
}

interface ItemProps {
  item: SettingItemType;
  value: string;
  onChange?: (v: string) => void;
  balance?: string;
}

export function SettingItem({ item, value, onChange, balance }: ItemProps) {
  const horizontal = item.type === 'switch';
  const { t } = useTranslation();

  return (
    <FormControl className={`${horizontal && 'flex flex-row'}`}>
      <FormLabel className={`${horizontal && 'flex-1'}`}>
        <span>{item.label}</span>
        {item.label === 'OpenAI Key' && balance && (
          <span className="text-sm text-gray-500">
            &nbsp;{t('Used this month')}
            {': '}
            {balance}
          </span>
        )}
      </FormLabel>
      {item.type === 'password' ? (
        <PasswordInput
          className="flex-1"
          placeholder={item.placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : item.type === 'select' ? (
        <Select value={value} onChange={(e) => onChange?.(e.target.value)}>
          {(item.value === 'asrLanguage' ? asrLanguageList : modelList).map((item) => (
            <option key={item.label} value={item.label}>
              {item.value}
            </option>
          ))}
        </Select>
      ) : item.type === 'number' ? (
        <NumberInput className="flex-1" min={0} max={item.max} step={0.1} value={value} onChange={(v) => onChange?.(v)}>
          <NumberInputField placeholder={item.placeholder} />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      ) : item.type === 'switch' ? (
        <Switch
          colorScheme="teal"
          isChecked={value === '1'}
          onChange={(e) => onChange?.(e.target.checked ? '1' : '0')}
        />
      ) : (
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

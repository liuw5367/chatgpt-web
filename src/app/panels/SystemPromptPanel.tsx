import { Button, IconButton, Tab, TabList, Tabs, Textarea, useToast } from '@chakra-ui/react';
import {
  IconCsv,
  IconEraser,
  IconFileImport,
  IconJson,
  IconStar,
  IconStarFilled,
  IconStarHalfFilled,
  IconTrash,
} from '@tabler/icons-react';
import type { ChakraStylesConfig } from 'chakra-react-select';
import { Select as SearchSelect } from 'chakra-react-select';
import { parse as parseCsv, unparse as unparseCsv } from 'papaparse';
import React, { useEffect, useState } from 'react';

import { FileUpload, SimpleDrawer } from '../../components';
import { CacheKeys } from '../../constants';
import type { OptionType } from '../../prompts';
import { allPrompts } from '../../prompts';
import { localDB } from '../../utils/LocalDB';
import { estimateTokens } from '../chat/token';
import { useTranslation } from '../i18n';
import { chatConfigStore, chatListStore, visibleStore } from '../store';
import type { ChatItem } from '../types';
import { readFileAsString, uuid } from '../utils';
import { PromptFormModal } from './PromptForm';
import type { SettingItemType } from './SettingPanel';
import { SettingItem } from './SettingPanel';

interface Props {
  type?: 'side' | 'drawer';
  sideWidth?: string;
  promptVisible: boolean;
}

interface LabelValue {
  label: string;
  value: string;
}

export function SystemPromptPanel(props: Props) {
  const { promptVisible, type, sideWidth } = props;
  const { t, language } = useTranslation();
  const toast = useToast({ position: 'top', isClosable: true });
  const currentChat = chatListStore((s) => s.currentChat());
  const { id: chatId, systemMessage = '' } = currentChat;
  const [token, setToken] = useState(0);

  const [tabList, setTabList] = useState<LabelValue[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const currentTab = tabList[tabIndex];

  const [selectedOption, setSelectedOption] = useState<LabelValue | null>();
  const [selectedPrompt, setSelectedPrompt] = useState<OptionType>();
  const [prompt, setPrompt] = useState(systemMessage);

  const [allData, setAllData] = useState<Record<string, OptionType[]>>({});
  const [favoriteOptions, setFavoriteOptions] = useState<OptionType[]>([]);
  const [options, setOptions] = useState<LabelValue[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  const panelTabList: LabelValue[] = [
    { label: t('System Prompt'), value: 'prompt' },
    { label: t('Chat Settings'), value: 'setting' },
  ];
  const [panelTabIndex, setPanelTabIndex] = useState(0);

  useEffect(() => {
    if (!promptVisible) return;
    handleClear();
    setPrompt(chatListStore.getState().currentChat().systemMessage || '');
  }, [promptVisible]);

  useEffect(() => {
    if (!promptVisible) return;
    handleClear();
    setPrompt(systemMessage || '');
  }, [systemMessage]);

  useEffect(() => {
    load();
  }, [promptVisible, dataRefreshKey]);

  useEffect(() => {
    const key = tabList[tabIndex]?.value;
    if (!key) return;
    setOptions(
      allData[key]?.map((item) => {
        return { label: item.act, value: item.id || '' };
      }) || [],
    );
  }, [allData, tabList, tabIndex]);

  useEffect(() => {
    setToken(prompt ? estimateTokens(prompt) : 0);
  }, [prompt]);

  async function load() {
    // 从缓存中加载收藏的数据
    if (!promptVisible) return;
    const favoriteOptions = JSON.parse(localStorage.getItem(CacheKeys.PROMPT_FAVORITE) || '[]') as OptionType[];
    setFavoriteOptions(favoriteOptions);

    const list = JSON.parse(localStorage.getItem(CacheKeys.PROMPT_LIST) || '[]') as LabelValue[];
    const notEmptyList: LabelValue[] = [];

    const promptList: { item: LabelValue; value: OptionType[] }[] = [];
    for (const item of list) {
      const value = ((await localDB.getItem(item.value)) || []) as OptionType[];
      if (value && value.length > 0) {
        promptList.push({ item, value });
        notEmptyList.push(item);
      }
    }
    // 清除数据为空的
    if (list.length !== notEmptyList.length) {
      localStorage.setItem(CacheKeys.PROMPT_LIST, JSON.stringify(notEmptyList));
    }

    const allData: Record<string, OptionType[]> = {
      default: allPrompts,
      favorite: favoriteOptions,
    };
    for (const item of promptList) {
      allData[item.item.value] = item.value;
    }
    setAllData(allData);

    const isZh = language?.toLowerCase()?.includes('zh');
    setTabList([
      { label: isZh ? '默认' : 'Default', value: 'default' },
      { label: isZh ? '收藏' : 'Favorite', value: 'favorite' },
      ...promptList.map((v) => v.item),
    ]);
  }

  function handleSelectedChange(id: string) {
    const item = allData[currentTab?.value].find((item) => item.id === id);
    if (!item) return;
    setSelectedPrompt(item);
    setPrompt(item.prompt);
  }

  function handleFavorite() {
    if (!prompt) {
      toast({ status: 'warning', title: t('please enter prompt') });
      return;
    }
    const item = favoriteOptions.find((v) => v.id === selectedPrompt?.id);
    if (item) {
      if (item.prompt === prompt) return;
      item.prompt = prompt;
      setFavoriteOptions([...favoriteOptions]);
      localStorage.setItem(CacheKeys.PROMPT_FAVORITE, JSON.stringify(favoriteOptions));
      toast({ status: 'success', title: t('Updated'), duration: 1000 });
    } else {
      setModalOpen(true);
    }
  }

  function handleModalFormSave(name: string, desc?: string) {
    const item: OptionType = { id: uuid(), act: name, prompt, desc };
    const data = [item, ...favoriteOptions];
    setSelectedPrompt(item);
    setFavoriteOptions(data);
    localStorage.setItem(CacheKeys.PROMPT_FAVORITE, JSON.stringify(data));
    setModalOpen(false);
    setDataRefreshKey(Date.now());
    toast({ status: 'success', title: t('Saved'), duration: 1000 });
  }

  function handleFavoriteDelete() {
    const list = favoriteOptions.filter((v) => v.id !== selectedPrompt?.id);
    setFavoriteOptions(list);
    localStorage.setItem(CacheKeys.PROMPT_FAVORITE, JSON.stringify(list));
    setDataRefreshKey(Date.now());
    handleClear();
    toast({ status: 'success', title: t('Deleted'), duration: 1000 });
  }

  function handleDelete() {
    let options = allData[currentTab.value];
    options = options.filter((v) => v.id !== selectedPrompt?.id);
    if (options.length === 0) {
      localStorage.removeItem(currentTab.value);
      let list = JSON.parse(localStorage.getItem(CacheKeys.PROMPT_LIST) || '[]') as LabelValue[];
      list = list.filter((v) => v.value !== currentTab.value);
      localStorage.setItem(CacheKeys.PROMPT_LIST, JSON.stringify(list));
    } else {
      localDB.setItem(currentTab.value, options);
    }
    setDataRefreshKey(Date.now());
    handleClear();
    toast({ status: 'success', title: t('Deleted'), duration: 1000 });
  }

  function handleClose() {
    if (type === 'side') return;
    visibleStore.setState({ promptVisible: false });
  }

  function handlePromptReset() {
    handleClear();
    setPrompt(systemMessage || '');
  }

  function handleClear() {
    setSelectedOption(null);
    setSelectedPrompt(undefined);
    setPrompt('');
  }

  function updateSystemPrompt(prompt?: string) {
    chatListStore.getState().updateChat(chatId, { systemMessage: prompt });
  }

  function handleSaveClick() {
    updateSystemPrompt(prompt);
    if (!prompt) {
      handleClear();
    }
    handleClose();
  }

  function handleRemoveClick() {
    toast({ status: 'success', title: t('Removed'), duration: 1000 });
    updateSystemPrompt();
    handleClear();
    handleClose();
  }

  async function handleImport(file: File) {
    try {
      const fileName = file.name;
      if (fileName.endsWith('.json')) {
        const jsonString = await readFileAsString(file);
        const data = JSON.parse(jsonString) as { name: string; prompt: string; desc: string }[];
        const options = data.map((item) => {
          const { name, prompt, desc } = item;
          return { id: uuid(), act: name, prompt, desc };
        });
        saveToCache(fileName, options);
      } else if (fileName.endsWith('.csv')) {
        parseCsv(file, {
          complete(results) {
            const data = results.data as string[][];
            const options: OptionType[] = data.slice(1).map((item) => {
              const [act, prompt, desc] = item;
              return { id: uuid(), act, prompt, desc };
            });
            saveToCache(fileName, options);
          },
        });
      }
    } catch {
      toast({ status: 'error', title: t('Import Error') });
    }
  }

  function saveToCache(name: string, options: OptionType[]) {
    if (!options || options.length === 0) return;

    const fileName = name.replace('.json', '').replace('.csv', '');
    const cache = localStorage.getItem(CacheKeys.PROMPT_LIST) || '[]';
    const list = JSON.parse(cache) as LabelValue[];
    const exist = [...tabList.map((v) => v.label), ...list.map((v) => v.label)];
    if (exist.includes(fileName)) {
      toast({ status: 'error', title: t('File name already exists, please modify and upload again') });
      return;
    }
    const item: LabelValue = { label: fileName, value: uuid() };
    list.push(item);
    localStorage.setItem(CacheKeys.PROMPT_LIST, JSON.stringify(list));
    localDB.setItem(item.value, options);
    setDataRefreshKey(Date.now());
  }

  function handleExport(type: 'json' | 'csv') {
    const key = currentTab?.value;
    if (type === 'json') {
      const content = allData[key]?.map((item) => {
        const { act, prompt, desc } = item;
        return { name: act, prompt, desc };
      });
      const data = 'data:text/plain;charset=utf-8,' + JSON.stringify(content);
      download(`${currentTab?.label}.json`, data);
      return;
    }

    const content = allData[key]?.map((item) => {
      return [item.act, item.prompt, item.desc];
    });
    const result = unparseCsv({
      fields: ['name', 'prompt', 'desc'],
      data: content,
    });

    const data = 'data:text/csv;charset=utf-8,' + result;
    download(`${currentTab?.label}.csv`, data);
  }

  function download(name: string, data: string) {
    const link = document.createElement('a');
    link.href = data;
    link.download = name;
    link.click();
  }

  const chakraStyles: ChakraStylesConfig<LabelValue> = {
    dropdownIndicator: (provided) => ({
      ...provided,
      background: 'transparent',
      p: 0,
      w: '40px',
    }),
  };

  function renderPromptContent() {
    return (
      <div className={`w-full h-full flex flex-col space-y-3`}>
        <div className={`flex flex-col space-y-3`}>
          <Tabs
            variant="soft-rounded"
            colorScheme="green"
            index={tabIndex}
            onChange={(index) => {
              setTabIndex(index);
              setSelectedOption(null);
              handleClear();
            }}
          >
            <TabList className="flex-wrap">
              {tabList.map((item) => (
                <Tab key={item.value} className="whitespace-nowrap">
                  {item.label}
                </Tab>
              ))}
            </TabList>
          </Tabs>
          <div className="flex-1">
            <SearchSelect<LabelValue>
              placeholder={t('Select Prompt')}
              options={options}
              value={selectedOption}
              onChange={(option) => {
                if (!option) return;
                setSelectedOption(option);
                handleSelectedChange(option.value);
              }}
              // @ts-ignore
              focusBorderColor="teal.600"
              chakraStyles={chakraStyles}
            />
          </div>
        </div>
        {selectedPrompt?.remark && <div className="whitespace-pre-wrap px-2 text-[15px]">{selectedPrompt.remark}</div>}
        {selectedPrompt?.desc && (
          <div className="whitespace-pre-wrap rounded bg-black/5 px-4 py-2 text-[15px]">{selectedPrompt.desc}</div>
        )}

        <Textarea
          focusBorderColor="teal.600"
          value={prompt ?? ''}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 text-[14px] !min-h-[50%] placeholder:text-[14px]"
          placeholder={t('prompt.placeholder') || ''}
        />

        <div className="flex flex-row items-center justify-between space-x-2">
          <div className="flex flex-row space-x-2">
            <Button size="xs" aria-label="Token" title="Token">
              {token}
            </Button>
            <IconButton
              size="xs"
              aria-label="Clear"
              title={t('Clear') || ''}
              icon={<IconEraser size="1rem" stroke={1.5} />}
              onClick={handleClear}
            />
            <IconButton
              size="xs"
              aria-label="Favorite"
              title={t('Favorite') || ''}
              onClick={handleFavorite}
              icon={
                prompt === favoriteOptions.find((v) => v.id === selectedPrompt?.id)?.prompt ? (
                  <IconStarFilled size="1rem" stroke={1.5} />
                ) : favoriteOptions.some((v) => v.id === selectedPrompt?.id) ? (
                  <IconStarHalfFilled size="1rem" stroke={1.5} />
                ) : (
                  <IconStar size="1rem" stroke={1.5} />
                )
              }
            />
            {selectedPrompt != null && favoriteOptions.find((v) => v.id === selectedPrompt.id) && (
              <IconButton
                size="xs"
                aria-label="Delete"
                title={t('Delete Favorite') || ''}
                icon={<IconTrash size="1rem" stroke={1.5} />}
                onClick={handleFavoriteDelete}
              />
            )}
            {selectedPrompt != null &&
              currentTab?.value != null &&
              currentTab.value !== 'default' &&
              currentTab.value !== 'favorite' && (
                <IconButton
                  size="xs"
                  aria-label="Delete"
                  title={t('Delete Favorite') || ''}
                  icon={<IconTrash size="1rem" stroke={1.5} />}
                  onClick={handleDelete}
                />
              )}
          </div>
          <div className="flex flex-row space-x-2">
            <FileUpload
              accept=".csv, .json"
              onChange={handleImport}
              render={(onClick) => (
                <IconButton
                  size="xs"
                  aria-label="Import"
                  title={t('Import') || ''}
                  icon={<IconFileImport size="1rem" stroke={1.5} />}
                  onClick={onClick}
                />
              )}
            />
            <IconButton
              size="xs"
              aria-label="Export"
              title={t('Export') || ''}
              icon={<IconCsv size="1rem" stroke={1.5} />}
              onClick={() => handleExport('csv')}
            />
            <IconButton
              size="xs"
              aria-label="Export"
              title={t('Export') || ''}
              icon={<IconJson size="1rem" stroke={1.5} />}
              onClick={() => handleExport('json')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SimpleDrawer
      type={type}
      sideWidth={sideWidth}
      isOpen={promptVisible}
      onClose={handleClose}
      size="md"
      header={
        <Tabs
          variant="enclosed"
          colorScheme="green"
          index={panelTabIndex}
          onChange={(index) => {
            setPanelTabIndex(index);
          }}
        >
          <TabList className="flex-wrap">
            {panelTabList.map((item) => (
              <Tab key={item.value} className="whitespace-nowrap">
                {item.label}
              </Tab>
            ))}
          </TabList>
        </Tabs>
      }
      footer={
        panelTabIndex === 1 ? null : (
          <div className="w-full flex flex-row justify-between">
            <Button colorScheme="blue" onClick={handleRemoveClick}>
              {t('Remove')}
            </Button>
            <div className="flex flex-row">
              {type === 'side' ? (
                <Button variant="outline" mr={3} onClick={handlePromptReset}>
                  {t('Reset')}
                </Button>
              ) : (
                <Button variant="outline" mr={3} onClick={handleClose}>
                  {t('Cancel')}
                </Button>
              )}
              <Button colorScheme="teal" onClick={handleSaveClick}>
                {t('Save')}
              </Button>
            </div>
          </div>
        )
      }
    >
      {panelTabIndex === 0 && renderPromptContent()}
      {panelTabIndex === 1 && <ChatSetting chat={currentChat} />}
      <PromptFormModal
        open={modalOpen}
        name={selectedPrompt?.act}
        desc={selectedPrompt?.desc}
        onSave={handleModalFormSave}
        onClose={() => setModalOpen(false)}
      />
    </SimpleDrawer>
  );
}

interface ChatSettingProps {
  chat: ChatItem;
}

function ChatSetting(props: ChatSettingProps) {
  const { chat } = props;
  const config = chatConfigStore();
  const updateChat = chatListStore((s) => s.updateChat);
  const { t } = useTranslation();

  const list: SettingItemType[] = [
    { label: t('Name'), value: 'name', placeholder: '' },
    { label: 'model', value: 'openAIModel', type: 'select', placeholder: 'gpt-3.5-turbo' },
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
  ];

  return (
    <div className="space-y-2">
      {list.map((item) => (
        <SettingItem
          key={item.value}
          item={item}
          onChange={(value) => updateChat(chat.id, { [item.value]: value })}
          // @ts-ignore key
          value={chat[item.value] || config[item.value]}
        />
      ))}
    </div>
  );
}

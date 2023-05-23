import { Button, IconButton, Tab, TabList, Tabs, Textarea, useToast } from "@chakra-ui/react";
import { useStore } from "@nanostores/react";
import { IconEraser, IconStar, IconStarFilled, IconStarHalfFilled, IconTrash } from "@tabler/icons-react";
import { ChakraStylesConfig, Select as SearchSelect } from "chakra-react-select";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Cache } from "../../constants";
import { chatAtom, visibleAtom } from "../atom";
import { estimateTokens } from "../chat/token";
import { allPrompts, OptionType } from "../prompts";
import SimpleDrawer from "../SimpleDrawer";
import { saveCurrentChatValue } from "../storage";
import { uuid } from "../utils";
import { PromptFormModal } from "./PromptForm";

interface Props {
  type?: "side" | "drawer";
  sideWidth?: string;
  promptVisible: boolean;
}

interface LabelValue {
  label: string;
  value: string;
}

export function SystemPromptPanel(props: Props) {
  const { promptVisible, type, sideWidth } = props;
  const { t, i18n } = useTranslation();
  const toast = useToast({ position: "top", isClosable: true });
  const { currentChat } = useStore(chatAtom);
  const { systemMessage = "" } = currentChat;
  const [token, setToken] = useState(0);

  const [tabList, setTabList] = useState<LabelValue[]>([]);

  const [tabIndex, setTabIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [prompt, setPrompt] = useState(systemMessage);
  const [desc, setDesc] = useState("");
  const [remark, setRemark] = useState("");

  const [favoriteOptions, setFavoriteOptions] = useState<OptionType[]>([]);

  const [allData, setAllData] = useState<Record<string, OptionType[]>>({});
  const [options, setOptions] = useState<LabelValue[]>([]);

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setAllData({
      default: allPrompts,
      favorite: favoriteOptions,
    });
  }, [favoriteOptions]);

  useEffect(() => {
    const key = tabList[tabIndex]?.value;
    if (!key) return;
    setOptions(
      allData[key]?.map((item) => {
        return { label: item.act, value: item.id || "" };
      }) || []
    );
  }, [allData, tabList, tabIndex]);

  useEffect(() => {
    if (!promptVisible) return;
    const value = JSON.parse(localStorage.getItem(Cache.PROMPT_FAVORITE) || "[]") as OptionType[];
    setFavoriteOptions(value);
    const isZh = i18n.language.toLowerCase().includes("zh");

    setTabList([
      { label: isZh ? "默认" : "Default", value: "default" },
      { label: isZh ? "收藏" : "Favorite", value: "favorite" },
    ]);
  }, [i18n.language, promptVisible]);

  useEffect(() => {
    if (promptVisible) {
      setPrompt(chatAtom.get().currentChat.systemMessage || "");
    }
  }, [promptVisible]);

  useEffect(() => {
    if (!promptVisible && prompt !== systemMessage) {
      handleClear();
    }
  }, [promptVisible, systemMessage]);

  useEffect(() => {
    if (prompt) {
      setToken(estimateTokens(prompt));
    } else {
      setToken(0);
    }
  }, [prompt]);

  function handleSelectedChange(id: string) {
    const item = allData[tabList[tabIndex]?.value].find((item) => item.id === id);
    if (!item) return;
    setSelectedId(item.id);
    setPrompt(item.prompt);
    setRemark(item?.remark || "");
    setDesc(item?.desc === prompt ? "" : item?.desc || "");
  }

  function handleFavorite() {
    if (!prompt) {
      toast({ status: "warning", title: t("please enter prompt") });
      return;
    }
    const item = favoriteOptions.find((v) => v.id === selectedId);
    if (item) {
      if (item.prompt === prompt) return;
      item.prompt = prompt;
      setFavoriteOptions([...favoriteOptions]);
      localStorage.setItem(Cache.PROMPT_FAVORITE, JSON.stringify(favoriteOptions));
      toast({ status: "success", title: t("Updated") });
    } else {
      setModalOpen(true);
    }
  }

  function handleModalFormSave(name: string, desc?: string) {
    const item: OptionType = {
      id: uuid(),
      act: name,
      prompt,
      desc,
    };
    const data = [item, ...favoriteOptions];
    setSelectedId(item.id);
    setFavoriteOptions(data);
    localStorage.setItem(Cache.PROMPT_FAVORITE, JSON.stringify(data));
    toast({ status: "success", title: t("Saved") });
    setModalOpen(false);
  }

  function handleFavoriteDelete() {
    const list = favoriteOptions.filter((v) => v.id !== selectedId);
    setFavoriteOptions(list);
    localStorage.setItem(Cache.PROMPT_FAVORITE, JSON.stringify(list));
    toast({ status: "success", title: t("Deleted") });
  }

  function handleClose() {
    if (type === "side") return;
    visibleAtom.set({ ...visibleAtom.get(), promptVisible: false });
  }

  function handleClear() {
    setSelectedId(undefined);
    setPrompt("");
    setDesc("");
    setRemark("");
  }

  function updateSystemPrompt(prompt?: string) {
    saveCurrentChatValue("systemMessage", prompt as string);
  }

  function handleSaveClick() {
    updateSystemPrompt(prompt);
    if (!prompt) {
      handleClear();
    }
    handleClose();
  }

  function handleRemoveClick() {
    toast({ status: "success", title: t("Removed") });
    updateSystemPrompt();
    handleClear();
    handleClose();
  }

  const chakraStyles: ChakraStylesConfig = {
    dropdownIndicator: (provided) => ({
      ...provided,
      background: "transparent",
      p: 0,
      w: "40px",
    }),
  };

  return (
    <SimpleDrawer
      type={type}
      sideWidth={sideWidth}
      isOpen={promptVisible}
      onClose={handleClose}
      size="md"
      header={t("System Prompt")}
      footer={
        <div className="w-full flex flex-row justify-between">
          <Button colorScheme="blue" onClick={handleRemoveClick}>
            {t("Remove")}
          </Button>
          <div className="flex flex-row">
            {type !== "side" && (
              <Button variant="outline" mr={3} onClick={handleClose}>
                {t("Cancel")}
              </Button>
            )}
            <Button colorScheme="teal" onClick={handleSaveClick}>
              {t("Save")}
            </Button>
          </div>
        </div>
      }
    >
      <div className={`w-full h-full flex flex-col space-y-3`}>
        <div className={`flex flex-col space-y-3`}>
          <Tabs variant="soft-rounded" colorScheme="green" index={tabIndex} onChange={setTabIndex}>
            <TabList>
              {tabList.map((item) => (
                <Tab key={item.value}>{item.label}</Tab>
              ))}
            </TabList>
          </Tabs>
          <div className="flex-1">
            <SearchSelect
              placeholder={t("Select Prompt")}
              chakraStyles={chakraStyles}
              options={options}
              onChange={(e) => {
                // @ts-ignore
                const id = e.value;
                handleSelectedChange(id);
              }}
            />
          </div>
        </div>
        {remark && <div className="whitespace-pre-wrap px-2 text-[15px]">{remark}</div>}
        {desc && <div className="whitespace-pre-wrap rounded bg-black/5 px-4 py-2 text-[15px]">{desc}</div>}

        <Textarea
          value={prompt ?? ""}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1 text-[14px] !min-h-[50%] placeholder:text-[14px]"
          placeholder={t("prompt.placeholder") || ""}
        />

        <div className="flex flex-row items-center justify-between space-x-2">
          <div className="flex flex-row space-x-2">
            <Button size="xs" aria-label="Token" title="Token">
              {token}
            </Button>
            <IconButton
              size="xs"
              aria-label="Clear"
              title="Clear"
              icon={<IconEraser size="1rem" stroke={1.5} />}
              onClick={handleClear}
            />
            <IconButton
              size="xs"
              aria-label="Favorite"
              title="Favorite"
              onClick={handleFavorite}
              icon={
                prompt === favoriteOptions.find((v) => v.id === selectedId)?.prompt ? (
                  <IconStarFilled size="1rem" stroke={1.5} />
                ) : favoriteOptions.find((v) => v.id === selectedId) ? (
                  <IconStarHalfFilled size="1rem" stroke={1.5} />
                ) : (
                  <IconStar size="1rem" stroke={1.5} />
                )
              }
            />
            {favoriteOptions.find((v) => v.id === selectedId) && (
              <IconButton
                size="xs"
                aria-label="Delete"
                title="Delete Favorite"
                icon={<IconTrash size="1rem" stroke={1.5} />}
                onClick={handleFavoriteDelete}
              />
            )}
          </div>
        </div>
      </div>
      <PromptFormModal open={modalOpen} onSave={handleModalFormSave} onClose={() => setModalOpen(false)} />
    </SimpleDrawer>
  );
}

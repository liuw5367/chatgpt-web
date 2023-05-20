import shortcutsJson from "./shortcuts.json";

export type TagType =
  // DO NOT USE THIS TAG: we choose sites to add to favorites
  | "favorite"
  | "mind"
  | "write"
  | "article"
  | "text"
  | "seo"
  | "comments"
  | "code"
  | "ai"
  | "life"
  | "living"
  | "interesting"
  | "speech"
  | "social"
  | "philosophy"
  | "teacher"
  | "interpreter"
  | "games"
  | "tool"
  | "language"
  | "company"
  | "doctor"
  | "finance"
  | "music"
  | "professional"
  | "contribute"
  | "personal";

// Add prompts to this list
// prettier-ignore
const Users = shortcutsJson as User[];

export type User = {
  title: string;
  description: string;
  desc_cn: string;
  remark: string;
  title_en: string;
  desc_en: string;
  remark_en: string;
  preview: string | null; // null = use our serverless screenshot service
  website: string | null;
  source: string | null;
  tags: TagType[];
  id: number;
  weight: number;
};

const promptsShortcut = Users.map((item) => ({
  act: item.title,
  prompt: item.desc_cn,
  desc: item.remark,
}));

const promptsShortcutEn = Users.map((item) => ({
  act: item.title_en,
  prompt: item.desc_en,
  desc: item.remark_en,
}));

export { promptsShortcut, promptsShortcutEn };

/// <reference types="astro/client" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly OPENAI_API_KEY: string;
  readonly OPENAI_API_HOST: string;
  readonly OPENAI_API_MODEL: string;

  readonly PUBLIC_OPENAI_API_KEY: string;
  readonly PUBLIC_OPENAI_API_HOST: string;
  readonly PUBLIC_OPENAI_API_MODEL: string;

  readonly PUBLIC_UNISOUND_AI_KEY: string;
  readonly UNISOUND_AI_SECRET: string;
  readonly PUBLIC_UNISOUND_AI_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import type { AttributifyAttributes, AttributifyNames } from "@unocss/preset-attributify";

declare module "react" {
  // Unocss Attributify with Prefix
  interface HTMLAttributes<T> extends AttributifyAttributes, Partial<Record<AttributifyNames<"un-">, string>> {}
}

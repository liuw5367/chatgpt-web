/// <reference types="astro/client" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly OPENAI_API_KEY: string;
  readonly OPENAI_API_HOST: string;
  readonly OPENAI_API_MODEL: string;

  readonly PUBLIC_UNISOUND_AI_KEY: string;
  readonly UNISOUND_AI_SECRET: string;

  readonly PUBLIC_PACKAGE_VERSION: string;

  /** @deprecated */
  readonly PUBLIC_OPENAI_API_KEY: string;
  /** @deprecated */
  readonly PUBLIC_OPENAI_API_HOST: string;
  /** @deprecated */
  readonly PUBLIC_OPENAI_API_MODEL: string;
  /** @deprecated */
  readonly PUBLIC_UNISOUND_AI_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly OPENAI_API_KEY: string;
  readonly OPENAI_API_HOST: string;
  readonly OPENAI_API_MODEL: string;

  readonly ACCESS_CODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

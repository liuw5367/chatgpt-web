declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly OPENAI_API_KEY: string;
      readonly OPENAI_API_HOST: string;
      readonly OPENAI_API_MODEL: string;

      readonly ACCESS_CODE: string;

      readonly NEXT_PUBLIC_UNISOUND_AI_KEY: string;
      readonly UNISOUND_AI_SECRET: string;

      /** @deprecated */
      readonly PUBLIC_OPENAI_API_KEY: string;
      /** @deprecated */
      readonly PUBLIC_OPENAI_API_HOST: string;
      /** @deprecated */
      readonly PUBLIC_OPENAI_API_MODEL: string;
      /** @deprecated */
      readonly PUBLIC_UNISOUND_AI_SECRET: string;
    }
  }
}

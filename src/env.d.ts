declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly OPENAI_API_KEY: string;
      readonly OPENAI_API_HOST: string;
      readonly OPENAI_API_MODEL: string;

      readonly NEXT_PUBLIC_UNISOUND_AI_KEY: string;
      readonly UNISOUND_AI_SECRET: string;
    }
  }
}

import type { AttributifyAttributes, AttributifyNames } from '@unocss/preset-attributify';

declare module 'react' {
  // Unocss Attributify with Prefix
  interface HTMLAttributes<T> extends AttributifyAttributes, Partial<Record<AttributifyNames<'un-'>, string>> {}
}

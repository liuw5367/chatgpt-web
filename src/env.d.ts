/// <reference types="astro/client" />
/// <reference types="vite-plugin-pwa/info" />
/// <reference types="vite-plugin-pwa/client" />

import type { AttributifyAttributes, AttributifyNames } from "@unocss/preset-attributify";

declare module "react" {
  // Unocss Attributify with Prefix
  interface HTMLAttributes<T> extends AttributifyAttributes, Partial<Record<AttributifyNames<"un-">, string>> {}
}

/// <reference types="astro/client" />

import type { AttributifyAttributes, AttributifyNames } from "@unocss/preset-attributify";

declare module "react" {
  // Unocss Attributify with Prefix
  interface HTMLAttributes<T> extends AttributifyAttributes, Partial<Record<AttributifyNames<"un-">, string>> {}
}

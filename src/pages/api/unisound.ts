import type { APIRoute } from "astro";
import sha256 from "crypto-js/sha256";

import { buildError } from "../../utils";

const KEY = import.meta.env.PUBLIC_UNISOUND_AI_KEY;
const SECRET = import.meta.env.UNISOUND_AI_SECRET || import.meta.env.PUBLIC_UNISOUND_AI_SECRET;

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const apiKey = body.key || KEY;
  const time = body.time;

  if (!apiKey) {
    return buildError({ code: "No Unisound Key" }, 401);
  }
  if (!SECRET) {
    return buildError({ code: "No Unisound Secret" }, 401);
  }

  const sign = sha256(`${apiKey}${time}${SECRET}`).toString().toUpperCase();

  return new Response(JSON.stringify({ sign }));
};

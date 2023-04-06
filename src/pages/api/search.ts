import type { APIRoute } from "astro";

import { buildError } from "./_utils";

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const content = body.content;

  if (!content) {
    return new Response("{}");
  }

  try {
    const response = await fetch("https://www.baidu.com/sugrec?json=1&prod=pc&wd=" + content, { method: "GET" });
    const json = await response.json();
    return new Response(JSON.stringify(json.g?.map((v) => v.q) || []));
  } catch (e: Error) {
    console.log("images generations error:", e);
    return buildError({ code: e.name, message: e.message }, 500);
  }
};

import type { APIRoute } from "astro";

import { buildError } from "../../utils";

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const content = body.content;

  if (!content) {
    return new Response("{}");
  }

  try {
    const url = "https://www.baidu.com/sugrec?json=1&prod=pc&wd=" + encodeURIComponent(content);
    const response = await fetch(url, { method: "GET" });
    const json = await response.json();
    return new Response(JSON.stringify(json.g?.map((v: any) => v.q) || []));
  } catch (e: any) {
    console.log("images generations error:", e);
    return buildError({ code: e.name, message: e.message }, 500);
  }
};

import type { APIRoute } from "astro";

import { buildError, getEnv } from "./_utils";

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const env = getEnv();
  const host = body.host || env.HOST || "https://api.openai.com";
  const apiKey = body.apiKey || env.KEY;
  const config = body.config || {};

  if (!apiKey) {
    return new Response(buildError("NO API KEY"));
  }

  try {
    return await fetch(host + "/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        n: 2,
        size: "1024x1024",
        ...config,
      }),
    });
  } catch (e) {
    console.log("images generations error:", e);
    return new Response(buildError(e.toString()));
  }
};

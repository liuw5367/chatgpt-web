import type { APIRoute } from "astro";

import { buildError, getEnv } from "./_utils";

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const env = getEnv();
  const host = body.host || env.HOST;
  const apiKey = body.apiKey || env.KEY;

  if (!apiKey) {
    // 没有 key 不需要提示
    return new Response("{}");
  }

  try {
    return await fetch(host + "/dashboard/billing/credit_grants", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
  } catch (e: Error) {
    console.log("balance error:", e);
    return buildError({ code: e.name, message: e.message }, 500);
  }
};

import type { APIRoute } from "astro";

import { buildError, getEnv } from "./_utils";

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const env = getEnv();
  const host = body.host || env.HOST || "https://api.openai.com";
  const apiKey = body.apiKey || env.KEY;

  if (!apiKey) {
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
  } catch (e) {
    console.log("balance error:", e);
    return new Response(buildError(e.toString()));
  }
};

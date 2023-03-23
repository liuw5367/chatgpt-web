import type { APIRoute } from "astro";

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const host = body.host || "https://api.openai.com";
  const apiKey = body.apiKey || import.meta.env.OPENAI_API_KEY;
  const config = body.config || {};

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
    return new Response("AI Http Request Error");
  }
};

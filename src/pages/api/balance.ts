import type { APIRoute } from "astro";

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const host = body.host || "https://api.openai.com";
  const apiKey = body.apiKey || import.meta.env.OPENAI_API_KEY;

  try {
    return await fetch(host + "/dashboard/billing/credit_grants", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
  } catch (e) {
    return new Response("Http Request Error");
  }
};

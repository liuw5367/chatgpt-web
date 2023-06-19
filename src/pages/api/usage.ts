import type { APIRoute } from "astro";

import { buildError, getEnv } from "../../utils";

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
    const current = new Date();
    const year = current.getFullYear();
    const month = current.getMonth() + 1;
    const startDate = year + "-" + formatMonth(month) + "-01";
    const endDate = year + "-" + formatMonth(month + 1) + "-01";

    const param = `?end_date=${endDate}&start_date=${startDate}`;

    const response = await fetch(host + "/dashboard/billing/usage" + param, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const json = await response.json();
    return new Response(JSON.stringify(json));
  } catch (e: any) {
    console.log("usage error:", e);
    return buildError({ code: e.name, message: e.message }, 500);
  }
};

function formatMonth(month: number) {
  if (month < 10) return "0" + month;
  return month;
}

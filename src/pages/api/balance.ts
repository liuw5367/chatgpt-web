import { NextRequest } from 'next/server';

import { buildError, getEnv } from '@/utils';

export const config = { runtime: 'edge' };

/**
 * @deprecated 该接口目前无法通过 apiKey 请求
 */
export default async function handler(req: NextRequest) {
  const body = await req.json();
  const env = getEnv();
  const host = body.host || env.HOST;
  const apiKey = body.apiKey || env.KEY;

  if (!apiKey) {
    // 没有 key 不需要提示
    return new Response('{}');
  }

  try {
    return await fetch(host + '/dashboard/billing/credit_grants', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });
  } catch (e: any) {
    console.log('balance error:', e);
    return buildError({ code: e.name, message: e.message }, 500);
  }
}

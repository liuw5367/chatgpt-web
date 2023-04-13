import { NextRequest } from 'next/server';

import { buildError, getEnv } from '@/utils';

export const config = { runtime: 'edge' };

export default async function handler(req: NextRequest) {
  const body = await req.json();
  const env = getEnv();
  const host = body.host || env.HOST;
  const apiKey = body.apiKey || env.KEY;
  const config = body.config || {};

  if (!apiKey) {
    return buildError({ code: 'No Api Key' }, 401);
  }

  try {
    return await fetch(host + '/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        n: 2,
        size: '1024x1024',
        ...config,
      }),
    });
  } catch (e: any) {
    console.log('images generations error:', e);
    return buildError({ code: e.name, message: e.message }, 500);
  }
}

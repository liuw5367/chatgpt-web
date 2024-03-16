import type { NextRequest } from 'next/server';

import { ENV_KEY, buildError, checkAccessCode, getEnv } from '@/utils';

export const config = { runtime: 'edge' };

export default async function handler(request: NextRequest) {
  const body = await request.json();
  const env = getEnv();
  const host = body.host || env.HOST;
  let apiKey = body.apiKey || env.KEY;
  const config = body.config || {};

  const accessCode = request.headers.get('access-code');
  const [accessCodeError, accessCodeSuccess] = checkAccessCode(accessCode);
  if (accessCodeError) {
    return accessCodeError;
  }
  if (accessCodeSuccess) {
    apiKey = body.apiKey || ENV_KEY;
  }

  if (!apiKey) {
    return buildError({ code: 'No Api Key' }, 401);
  }

  try {
    return await fetch(`${host}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        n: 2,
        size: '1024x1024',
        ...config,
      }),
    });
  }
  catch (error: any) {
    console.log('images generations error:', error);
    return buildError({ code: error.name, message: error.message }, 500);
  }
}

import type { APIRoute } from 'astro';

import { buildError, checkAccessCode, ENV_KEY, getEnv } from '../../utils';

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const env = getEnv();
  const host = body.host || env.HOST;
  let apiKey = body.apiKey || env.KEY;
  const config = body.config || {};

  const accessCode = context.request.headers.get('access-code');
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
    const response = await fetch(host + '/v1/images/generations', {
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
    const json = await response.json();
    return new Response(JSON.stringify(json));
  } catch (error: any) {
    console.log('images generations error:', error);
    return buildError({ code: error.name, message: error.message }, 500);
  }
};

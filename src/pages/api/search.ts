import type { NextRequest } from 'next/server';

import { buildError, checkAccessCode } from '@/utils';

export const config = { runtime: 'edge' };

export default async function handler(request: NextRequest) {
  const body = await request.json();
  const content = body.content;

  const accessCode = request.headers.get('access-code');
  const [accessCodeError] = checkAccessCode(accessCode);

  if (!content || accessCodeError) {
    return new Response('{}');
  }

  try {
    const url = `https://www.baidu.com/sugrec?json=1&prod=pc&wd=${encodeURIComponent(content)}`;
    const response = await fetch(url, { method: 'GET' });
    const json = await response.json();
    return new Response(JSON.stringify(json.g?.map((v: any) => v.q) || []));
  }
  catch (error: any) {
    console.log('images generations error:', error);
    return buildError({ code: error.name, message: error.message }, 500);
  }
}

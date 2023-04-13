import { NextRequest } from 'next/server';

import { buildError } from '@/utils';
export const config = { runtime: 'edge' };

export default async function handler(req: NextRequest) {
  const body = await req.json();
  const content = body.content;

  if (!content) {
    return new Response('{}');
  }

  try {
    const response = await fetch('https://www.baidu.com/sugrec?json=1&prod=pc&wd=' + content, { method: 'GET' });
    const json = await response.json();
    return new Response(JSON.stringify(json.g?.map((v: any) => v.q) || []));
  } catch (e: any) {
    console.log('images generations error:', e);
    return buildError({ code: e.name, message: e.message }, 500);
  }
}

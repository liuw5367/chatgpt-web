import sha256 from 'crypto-js/sha256';
import { NextRequest } from 'next/server';

import { buildError } from '@/utils';

const KEY = process.env.NEXT_PUBLIC_UNISOUND_AI_KEY;
const SECRET = process.env.UNISOUND_AI_SECRET;

export const config = { runtime: 'edge' };

export default async function handler(req: NextRequest) {
  const body = await req.json();
  const apiKey = body.key || KEY;
  const time = body.time;

  if (!apiKey) {
    return buildError({ code: 'No Unisound Key' }, 401);
  }
  if (!SECRET) {
    return buildError({ code: 'No Unisound Secret' }, 401);
  }

  const sign = sha256(`${apiKey}${time}${SECRET}`).toString().toUpperCase();

  return new Response(JSON.stringify({ sign }));
}

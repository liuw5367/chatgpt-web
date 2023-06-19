import sha256 from 'crypto-js/sha256';
import { NextRequest } from 'next/server';

import { buildError, checkAccessCode, ENV_ACCESS_CODE } from '@/utils';

const KEY = process.env.NEXT_PUBLIC_UNISOUND_AI_KEY;
const SECRET = process.env.UNISOUND_AI_SECRET || process.env.PUBLIC_UNISOUND_AI_SECRET;

export const config = { runtime: 'edge' };

export default async function handler(request: NextRequest) {
  const body = await request.json();
  const apiKey = body.key || KEY;
  const time = body.time;
  let secret = ENV_ACCESS_CODE ? '' : SECRET;

  const accessCode = request.headers.get('access-code');
  const [accessCodeError, accessCodeSuccess] = checkAccessCode(accessCode);
  if (accessCodeError) {
    return accessCodeError;
  }
  if (accessCodeSuccess) {
    secret = SECRET;
  }

  if (!apiKey) {
    return buildError({ code: 'No Unisound Key' }, 401);
  }
  if (!secret) {
    return buildError({ code: 'No Unisound Secret' }, 401);
  }

  const sign = sha256(`${apiKey}${time}${secret}`).toString().toUpperCase();

  return new Response(JSON.stringify({ sign }));
}

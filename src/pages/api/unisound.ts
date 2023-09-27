import type { APIRoute } from 'astro';
import { sha256 } from 'js-sha256';

import { buildError, checkAccessCode, ENV_ACCESS_CODE } from '../../utils';

const KEY = import.meta.env.PUBLIC_UNISOUND_AI_KEY;
const SECRET = import.meta.env.UNISOUND_AI_SECRET || import.meta.env.PUBLIC_UNISOUND_AI_SECRET;

export const POST: APIRoute = async (context) => {
  const body = await context.request.json();
  const apiKey = body.key || KEY;
  const time = body.time;
  let secret = ENV_ACCESS_CODE ? '' : SECRET;

  const accessCode = context.request.headers.get('access-code');
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
};

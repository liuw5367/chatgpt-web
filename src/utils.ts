export const ENV_KEY = process.env.OPENAI_API_KEY || process.env.PUBLIC_OPENAI_API_KEY;
const ENV_HOST = process.env.OPENAI_API_HOST || process.env.PUBLIC_OPENAI_API_HOST || 'https://api.openai.com';
const ENV_MODEL = process.env.OPENAI_API_MODEL || process.env.PUBLIC_OPENAI_API_MODEL || 'gpt-3.5-turbo';

export const ENV_ACCESS_CODE = process.env.ACCESS_CODE;

export function getEnv() {
  const key = ENV_ACCESS_CODE ? '' : ENV_KEY;

  return {
    HOST: ENV_HOST,
    KEY: key,
    MODEL: ENV_MODEL,
  };
}

export interface ResponseError {
  code: string;
  message?: string;
}

export function buildError(error: ResponseError, status = 400) {
  return new Response(JSON.stringify({ error }), { status });
}

/**
 * @return [error，验证成功]
 */
export function checkAccessCode(code?: string | null): [Response | null, boolean] {
  const accessCode = ENV_ACCESS_CODE;
  if (accessCode) {
    if (code) {
      return accessCode === code ? [null, true] : [buildError({ code: 'Access Code Error' }, 401), false];
    } else {
      return [null, false];
    }
  }
  return [null, false];
}

const KEY = process.env.OPENAI_API_KEY || process.env.PUBLIC_OPENAI_API_KEY;
const HOST = process.env.OPENAI_API_HOST || process.env.PUBLIC_OPENAI_API_HOST || 'https://api.openai.com';
const MODEL = process.env.OPENAI_API_MODEL || process.env.PUBLIC_OPENAI_API_MODEL || 'gpt-3.5-turbo';

export function getEnv() {
  return { HOST, KEY, MODEL };
}

export interface ResponseError {
  code: string;
  message?: string;
}

export function buildError(error: ResponseError, status = 400) {
  return new Response(JSON.stringify({ error }), { status });
}

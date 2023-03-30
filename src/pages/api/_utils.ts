const HOST = import.meta.env.OPENAI_HOST;
const KEY = import.meta.env.OPENAI_API_KEY;
const MODEL = import.meta.env.OPENAI_API_MODEL;

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

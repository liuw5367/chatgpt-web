const KEY = import.meta.env.OPENAI_API_KEY || import.meta.env.PUBLIC_OPENAI_API_KEY;
const HOST = import.meta.env.OPENAI_API_HOST || import.meta.env.PUBLIC_OPENAI_API_HOST || "https://api.openai.com";
const MODEL = import.meta.env.OPENAI_API_MODEL || import.meta.env.PUBLIC_OPENAI_API_MODEL || "gpt-3.5-turbo";

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

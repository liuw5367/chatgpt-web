const HOST = import.meta.env.OPENAI_HOST;
const KEY = import.meta.env.OPENAI_API_KEY;
const MODEL = import.meta.env.OPENAI_API_MODEL;

export function getEnv() {
  return { HOST, KEY, MODEL };
}

export function buildError(error: string) {
  return JSON.stringify({ error });
}

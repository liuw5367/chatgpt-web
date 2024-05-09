import type { APIRoute } from 'astro';

import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createOllama } from 'ollama-ai-provider';

import { ENV_KEY, buildError, checkAccessCode, getEnv } from '../../utils';

export type ModelSettings = Omit<Parameters<typeof streamText>[0], 'model'>;

export const POST: APIRoute = async (context) => {
  const body = await context.request.json();
  const env = getEnv();
  const provider = body.provider || 'openai';
  const baseURL = body.baseURL || body.host || env.HOST;
  let apiKey = body.apiKey || env.KEY;
  const modelId = body.model || env.MODEL;

  const settings: ModelSettings = body.settings || {};

  const accessCode = context.request.headers.get('access-code');
  const [accessCodeError, accessCodeSuccess] = checkAccessCode(accessCode);
  if (accessCodeError) {
    return accessCodeError;
  }
  if (accessCodeSuccess) {
    apiKey = body.apiKey || ENV_KEY;
  }

  try {
    const model = createModel(provider, apiKey, baseURL)(modelId);

    const result = await streamText({ model, ...settings });

    return result.toTextStreamResponse();
  }
  catch (error: any) {
    console.error('chat completions error:', error);
    return buildError({ code: error.name, message: error.message }, 500);
  }
};

function createModel(
  provider: string,
  apiKey: string,
  baseURL?: string,
  headers?: Record<string, string>,
) {
  const settings = { baseURL, apiKey, headers };

  if (provider === 'openai') {
    return createOpenAI(settings);
  }

  if (provider === 'anthropic') {
    return createAnthropic(settings);
  }

  if (provider === 'google') {
    return createGoogleGenerativeAI(settings);
  }

  if (provider === 'mistral') {
    return createMistral(settings);
  }

  if (provider === 'ollama') {
    return createOllama(settings);
  }

  return createOpenAI(settings);
}

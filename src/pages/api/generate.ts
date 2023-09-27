import type { ParsedEvent, ReconnectInterval } from 'eventsource-parser';
import { createParser } from 'eventsource-parser';
import type { NextRequest } from 'next/server';

import { buildError, checkAccessCode, ENV_KEY, getEnv } from '@/utils';

export const config = { runtime: 'edge' };

export default async function handler(request: NextRequest) {
  const body = await request.json();
  const env = getEnv();
  const host = body.host || env.HOST;
  let apiKey = body.apiKey || env.KEY;
  const model = body.model || env.MODEL;
  const messages = body.messages;
  const config = body.config || {};

  const accessCode = request.headers.get('access-code');
  const [accessCodeError, accessCodeSuccess] = checkAccessCode(accessCode);
  if (accessCodeError) {
    return accessCodeError;
  }
  if (accessCodeSuccess) {
    apiKey = body.apiKey || ENV_KEY;
  }

  if (!apiKey) {
    return buildError({ code: 'No Api Key' }, 401);
  }

  if (!messages) {
    return buildError({ code: 'No Prompt' });
  }

  const response = await fetch(host + '/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      ...config,
    }),
  }).catch((error: Error) => {
    console.error('chat completions error:', error);
    return buildError({ code: error.name, message: error.message }, 500);
  });

  return parseOpenAIStream(response);
}

const parseOpenAIStream = (rawResponse: Response) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  if (!rawResponse.ok) {
    return new Response(rawResponse.body, {
      status: rawResponse.status,
      statusText: rawResponse.statusText,
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const streamParser = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;
          if (data === '[DONE]') {
            controller.close();
            return;
          }
          try {
            // response = {
            //   id: 'chatcmpl-6pULPSegWhFgi0XQ1DtgA3zTa1WR6',
            //   object: 'chat.completion.chunk',
            //   created: 1677729391,
            //   model: 'gpt-3.5-turbo-0301',
            //   choices: [
            //     { delta: { content: '你' }, index: 0, finish_reason: null }
            //   ],
            // }
            const json = JSON.parse(data);
            const text = json.choices[0].delta?.content || '';
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (error) {
            controller.error(error);
          }
        }
      };

      const parser = createParser(streamParser);
      for await (const chunk of rawResponse.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return new Response(stream);
};

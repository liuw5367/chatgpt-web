import type { APIRoute } from "astro";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";

export const post: APIRoute = async (context) => {
  const body = await context.request.json();
  const host = body.host || env.HOST || "https://api.openai.com";
  const apiKey = body.apiKey || env.KEY;
  const model = body.model || env.MODEL;
  const messages = body.messages;
  const config = body.config || {};

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (!apiKey) {
    return new Response("NO API KEY");
  }

  if (!messages) {
    return new Response("No Input Text");
  }

  let completion: Response;
  try {
    completion = await fetch(host + "/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-3.5-turbo",
        messages,
        stream: true,
        ...config,
      }),
    });
  } catch (e) {
    console.log("chat completions error:", e);
    return new Response(e.toString());
  }

  const stream = new ReadableStream({
    async start(controller) {
      const streamParser = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === "event") {
          const data = event.data;
          if (data === "[DONE]") {
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
            const text = json.choices[0].delta?.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(streamParser);
      for await (const chunk of completion.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return new Response(stream);
};

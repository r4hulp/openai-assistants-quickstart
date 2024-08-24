'use server';

import { generateId } from 'ai';
import { createAI, createStreamableUI, createStreamableValue } from 'ai/rsc';
import { AzureOpenAI, OpenAI } from 'openai';
import { ReactNode } from 'react';
import { Message } from './message';

const openai = new AzureOpenAI({
  apiVersion: "2024-05-01-preview",
  apiKey: "7874c0630c714f7d874b8e2bbc23d7c3",
  endpoint: "https://ai-rahulpatilai4694709538172547.openai.azure.com/",
  deployment: "gpt-4o"
});

export interface ClientMessage {
  id: string;
  status: ReactNode;
  text: ReactNode;
  role: 'user' | 'assistant';
}

const ASSISTANT_ID = '';
let THREAD_ID = '';
let RUN_ID = '';

export async function submitMessage(question: string): Promise<ClientMessage> {
  const statusUIStream = createStreamableUI('thread.init');

  const textStream = createStreamableValue('');
  const textUIStream = createStreamableUI(
    <Message textStream={textStream.value} />,
  );

  const runQueue = [];

  (async () => {
    if (THREAD_ID) {
      await openai.beta.threads.messages.create(THREAD_ID, {
        role: 'user',
        content: question,
      });

      const run = await openai.beta.threads.runs.create(THREAD_ID, {
        assistant_id: ASSISTANT_ID,
        stream: true,
      });

      runQueue.push({ id: generateId(), run });
    } else {
      const run = await openai.beta.threads.createAndRun({
        assistant_id: ASSISTANT_ID,
        stream: true,
        thread: {
          messages: [{ role: 'user', content: question }],
        },
      });

      runQueue.push({ id: generateId(), run });
    }

    while (runQueue.length > 0) {
      const latestRun = runQueue.shift();

      if (latestRun) {
        for await (const delta of latestRun.run) {
          const { data, event } = delta;

          statusUIStream.update(event);

          if (event === 'thread.created') {
            THREAD_ID = data.id;
          } else if (event === 'thread.run.created') {
            RUN_ID = data.id;
          } else if (event === 'thread.message.delta') {
            data.delta.content?.map(part => {
              if (part.type === 'text') {
                if (part.text) {
                  textStream.append(part.text.value as string);
                }
              }
            });
          } else if (event === 'thread.run.failed') {
            console.error(data);
          }
        }
      }
    }

    statusUIStream.done();
    textStream.done();
  })();

  return {
    id: generateId(),
    status: statusUIStream.value,
    text: textUIStream.value,
    role: 'assistant',
  };
}

export const AI = createAI({
  actions: {
    submitMessage,
  },
});
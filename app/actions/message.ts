'use server'

import { Message, MessagesPage } from "openai/resources/beta/threads/messages"
import { openai } from "../openai"
import { Stream } from "openai/streaming"
import { AssistantStreamEvent } from "openai/resources/beta/assistants"

export async function listMessages(threadId: string): Promise<Message[]> {
  const messages = await openai.beta.threads.messages.list(threadId)

  let allMessages: Message[] = [];
  let messagesPage = messages;
  let isNextPageAvailable = messagesPage.hasNextPage();
  while (isNextPageAvailable) { 
    messagesPage = await messagesPage.getNextPage();
    allMessages = allMessages.concat(messagesPage.data);
    isNextPageAvailable = messagesPage.hasNextPage();
  }
  return allMessages;
}

export async function createThreadMessage(assistantId: string, threadId: string, message: string): Promise<ReadableStream> {
  let msg = await openai.beta.threads.messages.create(threadId, {
    content: message,
    role: "user"
  })

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    stream: true,
    truncation_strategy: {
      type: 'last_messages',
      last_messages: 2,
    }
  })

  return run.toReadableStream();

}

export async function createThreadMessageWithFile(assistantId: string, threadId: string, message: string, fileId: string): Promise<ReadableStream> {
  
  
  let msg = await openai.beta.threads.messages.create(threadId, {
    content: message,
    role: "user",
    attachments: [
      { file_id: fileId, tools: [{ type: "file_search" }] }
    ]
  })

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    stream: true,
    truncation_strategy: {
      type: 'last_messages',
      last_messages: 2,
    }
  })

  return run.toReadableStream();
  
}

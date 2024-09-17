'use server'

import { Thread } from "openai/resources/beta/threads/threads"
import { openai } from "@/app/openai";

export async function createThread(): Promise<Thread> {
  const thread = await openai.beta.threads.create()
  return thread
}


export async function getThread(threadId: string): Promise<Thread> {
  const thread = await openai.beta.threads.retrieve(threadId)
  return thread
}
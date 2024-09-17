'use server'

import { openai } from "../openai"

export async function getAssistant(assistantId: string) {
    const assistant = await openai.beta.assistants.retrieve(assistantId)
    return assistant
}


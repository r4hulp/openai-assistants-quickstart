import { openai } from "@/app/openai";

export  async function GET(req: Request, { params: { assistantId, threadId, runId } }) {
  const steps = await openai.beta.threads.runs.steps.list(threadId, runId);
  return new Response(JSON.stringify(steps));
}
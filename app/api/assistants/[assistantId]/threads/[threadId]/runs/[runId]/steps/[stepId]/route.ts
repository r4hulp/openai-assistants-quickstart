import { azureOpenAI, openai } from "@/app/openai";

export async function GET(req: Request, { params: { assistantId, threadId, runId, stepId } }) {
  const run_step = await openai.beta.threads.runs.steps.retrieve(
    threadId, 
    runId, 
    stepId,
    {
      include: ["step_details.tool_calls[*].file_search.results[*].content"]
    })

 
  return new Response(JSON.stringify(run_step));
}


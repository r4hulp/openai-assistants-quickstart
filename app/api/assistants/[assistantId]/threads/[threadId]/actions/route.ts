import { openai } from "@/app/openai";

// Send a new message to a thread
export async function POST(request, { params: { assistantId, threadId } }) {
  const { toolCallOutputs, runId } = await request.json();

  const stream = openai.beta.threads.runs.submitToolOutputsStream(
    threadId,
    runId,
    { tool_outputs: toolCallOutputs, stream: true },
    
    
  );

  return new Response(stream.toReadableStream());
}

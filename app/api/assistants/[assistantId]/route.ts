import { openai } from "@/app/openai";

export async function GET(request: Request, { params: { assistantId } }) {
  const assistants = await openai.beta.assistants.list();

  let assistant = assistants.data.find((assistant) => assistant.id === assistantId);
  return Response.json(assistant);
}



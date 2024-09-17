import { openai } from "@/app/openai";

export const runtime = "nodejs";

// list all threads for an assistant
export async function GET(req: Request, { params: { assistantId } }) {
  // to be implemented

  return new Response(JSON.stringify([]));
}
import { openai } from "@/app/openai";

export const runtime = "nodejs";

// Send a new message to a thread
export async function POST(req: Request, { params: { threadId, assistantId } }) {
  const { message  } = await req.json();
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });

  console.log("creating run");

  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    stream: true,
    truncation_strategy: {
      type: 'last_messages',
      last_messages: 2,
    }
  });


  return new Response(run.toReadableStream());

}

export async function GET(req: Request, { params: { threadId, assistantId } }) {
  
  let messages = await openai.beta.threads.messages.list(threadId);

  // convert to json
  let messagesJson = JSON.parse(JSON.stringify(messages));
  return new Response(JSON.stringify(messagesJson));

}
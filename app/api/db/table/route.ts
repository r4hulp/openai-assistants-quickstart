import { getTableClient } from "@/app/clients/azure-datatables";
import { TableClient, AzureNamedKeyCredential } from "@azure/data-tables";


export const runtime = "nodejs";



export async function GET(req: Request) {
  return new Response(JSON.stringify([]));
}

export async function POST(req: Request) {

  const { assistantId, threadId, userId } = await req.json();

  console.log('creating thread for assistant', assistantId, 'and thread', threadId, 'for user', userId);

  const tableClient = getTableClient(process.env.AZURE_TABLES_CHATS_TABLE_NAME);

  // check if thread exists, put it in try catch because if it doesn't exist, it will throw an error
  try {
    const thread = await tableClient.getEntity(threadId, userId);
  } catch (error) {
    const newMessage = {
      rowKey: userId,
      partitionKey: threadId,
      assistantId: assistantId,
    };

    tableClient.createEntity(newMessage);
  }

  return new Response(JSON.stringify({ success: true }));

}



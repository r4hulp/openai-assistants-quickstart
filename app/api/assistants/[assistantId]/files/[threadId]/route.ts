import { openai } from "@/app/openai";
import { FileCreateParams } from "openai/resources";
import { threadId } from "worker_threads";

// upload file to assistant's vector store
export async function POST(request, { params: { assistantId, threadId } }) {
  const formData = await request.formData(); // process file as FormData
  const file = formData.get("file"); // retrieve the single file from FormData
  const vectorStoreId = await getOrCreateVectorStore(threadId); // get or create vector store

  // check if we alread 
  // upload using the file stream
  const openaiFile = await openai.files.create({
    file: file,
    purpose: "assistants",
  });

  // add file to vector store
  await openai.beta.vectorStores.files.create(vectorStoreId, {
    file_id: openaiFile.id,
  });

  return Response.json({
    file_id: openaiFile.id,
    filename: openaiFile.filename,
    status: "uploaded",
  });
}

// list files in assistant's vector store
export async function GET(request, { params: { assistantId, threadId } }) {
  const vectorStoreId = await getOrCreateVectorStore(threadId); // get or create vector store
  const fileList = await openai.beta.vectorStores.files.list(vectorStoreId);

  const filesArray = await Promise.all(
    fileList.data.map(async (file) => {
      const fileDetails = await openai.files.retrieve(file.id);
      const vectorFileDetails = await openai.beta.vectorStores.files.retrieve(
        vectorStoreId,
        file.id
      );
      return {
        file_id: file.id,
        filename: fileDetails.filename,
        status: vectorFileDetails.status,
      };
    })
  );
  return Response.json(filesArray);
}

// delete file from assistant's vector store
export async function DELETE(request, { params: { assistantId, threadId } }) {
  const body = await request.json();
  const fileId = body.fileId;

  const vectorStoreId = await getOrCreateVectorStore(threadId); // get or create vector store
  await openai.beta.vectorStores.files.del(vectorStoreId, fileId); // delete file from vector store

  return new Response();
}

/* Helper functions */

const getOrCreateVectorStore = async (threadId) => {
  const thread = await openai.beta.threads.retrieve(threadId);

  // if the assistant already has a vector store, return it
  if (thread.tool_resources?.file_search?.vector_store_ids?.length > 0) {
    return thread.tool_resources.file_search.vector_store_ids[0];
  }
  // otherwise, create a new vector store and attatch it to the assistant
  const vectorStore = await openai.beta.vectorStores.create({
    name: `vector-store-${crypto.randomUUID()}`,
    expires_after: {
      anchor: "last_active_at",
      days: 1
    }
  });
  await openai.beta.threads.update(threadId, {
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStore.id],
      },
    },
  });
  return vectorStore.id;
};

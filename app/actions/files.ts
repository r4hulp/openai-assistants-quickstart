
'use server'

import { openai } from "@/app/openai";
import { FileObject } from "openai/resources";


const getOrCreateVectorStore = async (vectorStoreId: string) => {

  const vectorStore = await openai.beta.vectorStores.retrieve(vectorStoreId);
  if (!vectorStore) {
    const newVectorStore = await openai.beta.vectorStores.create({
      name: "vector-store-" + vectorStoreId,
      expires_after: {
        anchor: 'last_active_at',
        days: 1
      }
    });
    return newVectorStore.id;
  }
  return vectorStore.id;
}

export async function uploadFile(file: File, assistantId: string, threadId: string) {

  const vectorStoreId = await getOrCreateVectorStore(assistantId);

  const openaiFile = await openai.files.create({
    file: file,
    purpose: "assistants",
  });

  const vectorStoreFile = await openai.beta.vectorStores.files.create(vectorStoreId, {
    file_id: openaiFile.id,
  });

  return vectorStoreFile;
}

export async function uploadFileToThread(file: File, assistantId: string, threadId: string): Promise<FileObject> {
  console.log('uploading file to thread', file, assistantId, threadId);

  const vectorStoreId = await getOrCreateVectorStore(assistantId);

  const openaiFile = await openai.files.create({
    file: file,
    purpose: "assistants",

  });

  const vectorStoreFile = await openai.beta.vectorStores.files.create(vectorStoreId, {
    file_id: openaiFile.id,
  });

  return openaiFile;

}

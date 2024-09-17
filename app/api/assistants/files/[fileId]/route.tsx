import { openai } from "@/app/openai";

// download file by file ID
export async function GET(_request, { params: { fileId } }) {
    const [file] = await Promise.all([
        openai.files.retrieve(fileId),
    ]);
    return Response.json(file);
}

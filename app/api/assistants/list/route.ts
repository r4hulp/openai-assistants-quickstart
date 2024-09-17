import { NextResponse } from 'next/server';
import { openai } from "@/app/openai";
import { Assistant } from 'openai/resources/beta/assistants';


export async function GET(request: Request): Promise<NextResponse<Assistant[]>> {
    const fileList = await openai.beta.assistants.list();
    return NextResponse.json(fileList.data);
}
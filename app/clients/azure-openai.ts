import OpenAI, { AzureOpenAI } from "openai";

export const openai = new AzureOpenAI({
    apiVersion: "2024-05-01-preview",
    apiKey: "7874c0630c714f7d874b8e2bbc23d7c3",
    endpoint: "https://ai-rahulpatilai4694709538172547.openai.azure.com/",
    deployment: "gpt-4o-mini"
})
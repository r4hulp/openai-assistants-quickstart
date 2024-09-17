import OpenAI, { AzureOpenAI } from "openai";

// export const openai = new AzureOpenAI({
//     apiVersion: "2024-05-01-preview",
//     apiKey: process.env.AZURE_OPENAI_APIKEY,
//     endpoint: process.env.AZURE_OPENAI_ENDPOINT,
//     deployment: "gpt-4o-mini"
// })

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_APIKEY
})

export const azureOpenAI = new AzureOpenAI({
    apiVersion: "2024-05-01-preview",
    apiKey: process.env.AZURE_OPENAI_APIKEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: "gpt-4o-mini"
})
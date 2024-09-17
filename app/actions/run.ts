'use server'

import { Run } from "openai/resources/beta/threads/runs/runs"
import { openai } from "../openai"
import { RunStep } from "openai/resources/beta/threads/runs/steps";

export async function createRun(assistantId: string, threadId: string): Promise<ReadableStream> {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    stream: true,
  })

  return run.toReadableStream();
}

export async function listRunSteps(threadId: string, runId: string): Promise<RunStep[]> {

  console.log("listing run steps");
  const steps = await openai.beta.threads.runs.steps.list(threadId, runId);

  // steps is a paginated list, so we need to get all pages
  let allSteps: RunStep[] = [];
  allSteps.push(...steps.data);
  let isNextPageAvailable = steps.hasNextPage();
  let page = steps;
  console.log("is next page available?", isNextPageAvailable);
  while (isNextPageAvailable) {
    console.log("getting next page");
    page = await steps.getNextPage();
    allSteps = allSteps.concat(page.data);
    isNextPageAvailable = page.hasNextPage();
    console.log("is next page available?", isNextPageAvailable);
  }

  return allSteps;
}

export async function getRunStep(threadId: string, runId: string, stepId: string): Promise<RunStep> {
  const step = await openai.beta.threads.runs.steps.retrieve(threadId, runId, stepId, {
    include: ["step_details.tool_calls[*].file_search.results[*].content"]
  });
  return step;
}
export let assistantId = "asst_13Z7dC9rrQknLuoa2XpeLApj"; // set your assistant ID here

if (assistantId === "") {
  assistantId = process.env.OPENAI_ASSISTANT_ID;
}

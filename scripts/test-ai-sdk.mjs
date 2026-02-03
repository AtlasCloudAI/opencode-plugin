#!/usr/bin/env node

/**
 * Test AI SDK with Atlas Cloud - simulating what OpenCode does
 */

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

const API_KEY = process.argv[2] || process.env.ATLASCLOUD_API_KEY;
if (!API_KEY) {
  console.error("Usage: node test-ai-sdk.mjs <api_key> or set ATLASCLOUD_API_KEY env var");
  process.exit(1);
}
const MODEL = process.argv[3] || "anthropic/claude-haiku-4.5-20251001-developer";

console.log("Testing AI SDK with Atlas Cloud");
console.log("=".repeat(60));
console.log(`API Key: ${API_KEY.slice(0, 12)}...`);
console.log(`Model: ${MODEL}`);
console.log(`Base URL: https://api.atlascloud.ai/v1`);
console.log("=".repeat(60));

// Create provider like OpenCode does
const atlascloud = createOpenAICompatible({
  name: "atlascloud",
  baseURL: "https://api.atlascloud.ai/v1",
  apiKey: API_KEY,
});

try {
  console.log("\nSending request via AI SDK...");

  const result = await generateText({
    model: atlascloud(MODEL),
    prompt: "Say hello in 5 words or less",
  });

  console.log(`\nSuccess!`);
  console.log(`Response: ${result.text}`);
  console.log(`Tokens: ${result.usage?.totalTokens || 'N/A'}`);
} catch (error) {
  console.log(`\nError!`);
  console.log(`Message: ${error.message}`);
  console.log(`Cause: ${JSON.stringify(error.cause, null, 2)}`);

  // Check if it's an API error with response body
  if (error.responseBody) {
    console.log(`Response Body: ${error.responseBody}`);
  }
}

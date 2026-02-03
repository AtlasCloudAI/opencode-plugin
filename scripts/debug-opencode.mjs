#!/usr/bin/env node

/**
 * Debug script that mimics how OpenCode calls the API
 */

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

const API_KEY = process.argv[2] || process.env.ATLASCLOUD_API_KEY;
if (!API_KEY) {
  console.error("Usage: node debug-opencode.mjs <api_key> or set ATLASCLOUD_API_KEY env var");
  process.exit(1);
}
const MODEL = process.argv[3] || "openai/gpt-4o-mini";

console.log("=".repeat(60));
console.log("Debug: Mimicking OpenCode's API calls");
console.log("=".repeat(60));
console.log(`API Key: ${API_KEY.slice(0, 12)}...`);
console.log(`Model: ${MODEL}`);
console.log(`Base URL: https://api.atlascloud.ai/v1`);
console.log();

async function testWithAiSdk() {
  console.log("=== Testing with @ai-sdk/openai-compatible ===");

  try {
    const provider = createOpenAICompatible({
      name: "atlascloud",
      apiKey: API_KEY,
      baseURL: "https://api.atlascloud.ai/v1",
    });

    console.log("Provider created successfully");
    console.log(`Calling generateText with model: ${MODEL}`);

    const { text } = await generateText({
      model: provider(MODEL),
      prompt: "Say hello in 3 words",
      maxTokens: 50,
    });

    console.log(`✅ Success! Response: "${text}"`);
    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.cause) {
      console.log(`   Cause: ${JSON.stringify(error.cause, null, 2)}`);
    }
    console.log(`   Full error:`, error);
    return false;
  }
}

async function testDirectFetch() {
  console.log("\n=== Testing direct fetch (for comparison) ===");

  try {
    const response = await fetch("https://api.atlascloud.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: "Say hello in 3 words" }],
        max_tokens: 50,
      }),
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Success! Response: "${data.choices?.[0]?.message?.content}"`);
      return true;
    } else {
      console.log(`❌ Error response:`, JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const directResult = await testDirectFetch();
  const sdkResult = await testWithAiSdk();

  console.log("\n" + "=".repeat(60));
  console.log("Summary:");
  console.log(`  Direct fetch: ${directResult ? "✅" : "❌"}`);
  console.log(`  AI SDK: ${sdkResult ? "✅" : "❌"}`);
  console.log("=".repeat(60));
}

main();

#!/usr/bin/env node

/**
 * Test specific model with Atlas Cloud API
 */

const API_KEY = process.argv[2] || process.env.ATLASCLOUD_API_KEY;
if (!API_KEY) {
  console.error("Usage: node test-model.mjs <api_key> [model_id] or set ATLASCLOUD_API_KEY env var");
  process.exit(1);
}
const MODEL = process.argv[3] || "anthropic/claude-haiku-4.5-20251001-developer";

console.log(`Testing model: ${MODEL}`);
console.log("=".repeat(60));

try {
  const response = await fetch("https://api.atlascloud.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: "Say hello" }],
      max_tokens: 100,
    }),
  });

  const responseText = await response.text();
  console.log(`Status: ${response.status}`);
  console.log(`Response: ${responseText}`);

  if (response.ok) {
    const data = JSON.parse(responseText);
    console.log(`\nSuccess! Message: ${data.choices?.[0]?.message?.content}`);
  }
} catch (error) {
  console.log(`Error: ${error.message}`);
}

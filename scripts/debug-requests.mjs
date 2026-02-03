#!/usr/bin/env node

/**
 * Debug script to trace what requests are being made via fetch
 */

// Store original fetch
const originalFetch = globalThis.fetch;

// Intercept fetch requests
globalThis.fetch = async function(url, options = {}) {
  console.log("\n" + "=".repeat(60));
  console.log("[FETCH REQUEST]");
  console.log("URL:", url);
  console.log("Method:", options.method || "GET");
  if (options.headers) {
    const headers = options.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries())
      : options.headers;
    // Mask API key
    const safeHeaders = { ...headers };
    if (safeHeaders.Authorization) {
      safeHeaders.Authorization = safeHeaders.Authorization.slice(0, 20) + "...";
    }
    console.log("Headers:", JSON.stringify(safeHeaders, null, 2));
  }
  if (options.body) {
    console.log("Body:", typeof options.body === 'string' ? options.body : options.body.toString());
  }
  console.log("=".repeat(60));

  const response = await originalFetch.apply(this, arguments);

  // Clone response to read body without consuming it
  const clone = response.clone();
  const text = await clone.text();

  console.log("\n[RESPONSE]");
  console.log("Status:", response.status);
  console.log("Body:", text.slice(0, 500));
  console.log("=".repeat(60));

  return response;
};

// Now test with the AI SDK
console.log("Starting debug trace...\n");

const { createOpenAICompatible } = await import("@ai-sdk/openai-compatible");
const { generateText } = await import("ai");

const API_KEY = process.argv[2] || process.env.ATLASCLOUD_API_KEY;
if (!API_KEY) {
  console.error("Usage: node debug-requests.mjs <api_key> or set ATLASCLOUD_API_KEY env var");
  process.exit(1);
}
const MODEL = process.argv[2] || "anthropic/claude-haiku-4.5-20251001-developer";

console.log("Using model:", MODEL);
console.log("API Key:", API_KEY.slice(0, 12) + "...");

const atlascloud = createOpenAICompatible({
  name: "atlascloud",
  baseURL: "https://api.atlascloud.ai/v1",
  apiKey: API_KEY,
});

try {
  const result = await generateText({
    model: atlascloud(MODEL),
    prompt: "Say hi",
  });
  console.log("\n[FINAL RESULT]:", result.text);
} catch (error) {
  console.log("\n[ERROR]:", error.message);
  if (error.cause) {
    console.log("[ERROR CAUSE]:", JSON.stringify(error.cause, null, 2));
  }
}

#!/usr/bin/env node

import { saveApiKey, getApiKey } from "../dist/server/config.js";
import { fetchModels, modelsToOpenCodeFormat } from "../dist/server/models.js";

const API_KEY = process.argv[2] || process.env.ATLASCLOUD_API_KEY;
if (!API_KEY) {
  console.error("Usage: node test-with-key.mjs <api_key> or set ATLASCLOUD_API_KEY env var");
  process.exit(1);
}

console.log("=".repeat(60));
console.log("Test: Simulating plugin flow with API key");
console.log("=".repeat(60));

// Save the API key (like /connect does)
console.log("\n1. Saving API key...");
saveApiKey(API_KEY);
console.log(`   Saved! getApiKey() returns: ${getApiKey()?.slice(0, 12)}...`);

// Fetch models (like plugin init does)
console.log("\n2. Fetching models from API...");
const models = await fetchModels(API_KEY);
console.log(`   Found ${models.length} models`);
console.log(`   First 10 model IDs:`);
models.slice(0, 10).forEach(m => console.log(`   - ${m.id}`));

// Convert to OpenCode format
console.log("\n3. Converting to OpenCode format...");
const openCodeModels = modelsToOpenCodeFormat(models);
const modelIds = Object.keys(openCodeModels);
console.log(`   Model count: ${modelIds.length}`);
console.log(`   First 5 entries:`);
modelIds.slice(0, 5).forEach(id => {
  console.log(`   "${id}": ${JSON.stringify(openCodeModels[id])}`);
});

console.log("\n" + "=".repeat(60));
console.log("This is what OpenCode should receive after /connect + restart");
console.log("=".repeat(60));

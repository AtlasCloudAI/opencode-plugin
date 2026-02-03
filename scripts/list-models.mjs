#!/usr/bin/env node

/**
 * List all models available on Atlas Cloud
 */

const API_KEY = process.argv[2] || process.env.ATLASCLOUD_API_KEY;
if (!API_KEY) {
  console.error("Usage: node list-models.mjs <api_key> or set ATLASCLOUD_API_KEY env var");
  process.exit(1);
}

console.log("Fetching models from Atlas Cloud...\n");

const response = await fetch("https://api.atlascloud.ai/v1/models", {
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
});

const data = await response.json();

if (!data.data) {
  console.log("Error:", data);
  process.exit(1);
}

console.log(`Total models: ${data.data.length}\n`);
console.log("All model IDs:");
console.log("-".repeat(60));

// Group by provider
const byProvider = {};
for (const model of data.data) {
  const parts = model.id.split("/");
  const provider = parts.length > 1 ? parts[0] : "other";
  if (!byProvider[provider]) byProvider[provider] = [];
  byProvider[provider].push(model.id);
}

for (const [provider, models] of Object.entries(byProvider).sort()) {
  console.log(`\n${provider.toUpperCase()} (${models.length}):`);
  for (const m of models.sort()) {
    console.log(`  - ${m}`);
  }
}

// Check for specific models OpenCode might try to use
console.log("\n" + "=".repeat(60));
console.log("Checking for models OpenCode might request:");
console.log("=".repeat(60));

const checkModels = [
  "anthropic/claude-haiku-4.5-20251001-developer",
  "anthropic/claude-3-haiku",
  "anthropic/claude-3-5-haiku",
  "google/gemini-2.5-flash-lite",
  "google/gemini-flash",
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
];

for (const id of checkModels) {
  const exists = data.data.some((m) => m.id === id);
  console.log(`${exists ? "✅" : "❌"} ${id}`);
}

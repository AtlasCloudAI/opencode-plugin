#!/usr/bin/env node

/**
 * Test script to verify Atlas Cloud API compatibility
 * Run: node scripts/test-api.mjs <your-api-key>
 */

const API_BASE = "https://api.atlascloud.ai/v1";

async function testModelsEndpoint(apiKey) {
  console.log("\n=== Testing /models endpoint ===");
  console.log(`URL: ${API_BASE}/models`);

  try {
    const response = await fetch(`${API_BASE}/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const text = await response.text();
      console.log(`Error body: ${text}`);
      return null;
    }

    const data = await response.json();
    console.log(`Response structure:`, Object.keys(data));

    if (data.data && Array.isArray(data.data)) {
      console.log(`Models found: ${data.data.length}`);
      console.log(`First 5 models:`);
      data.data.slice(0, 5).forEach(m => {
        console.log(`  - ${m.id} (owned by: ${m.owned_by || 'unknown'})`);
      });
      return data.data;
    } else {
      console.log(`Unexpected response format:`, JSON.stringify(data, null, 2).slice(0, 500));
      return null;
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return null;
  }
}

async function testChatCompletion(apiKey, modelId) {
  console.log("\n=== Testing /chat/completions endpoint ===");
  console.log(`URL: ${API_BASE}/chat/completions`);
  console.log(`Model: ${modelId}`);

  const requestBody = {
    model: modelId,
    messages: [
      { role: "user", content: "Say hello in exactly 3 words." }
    ],
    max_tokens: 50,
  };

  console.log(`Request body:`, JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    const text = await response.text();

    if (!response.ok) {
      console.log(`Error body: ${text}`);
      return false;
    }

    try {
      const data = JSON.parse(text);
      console.log(`Response structure:`, Object.keys(data));
      if (data.choices && data.choices[0]) {
        console.log(`Assistant response: "${data.choices[0].message?.content}"`);
      }
      console.log(`Full response:`, JSON.stringify(data, null, 2).slice(0, 1000));
      return true;
    } catch {
      console.log(`Raw response: ${text.slice(0, 500)}`);
      return false;
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return false;
  }
}

async function main() {
  const apiKey = process.argv[2];

  if (!apiKey) {
    console.log("Usage: node scripts/test-api.mjs <your-api-key>");
    console.log("\nThis script tests the Atlas Cloud API to verify:");
    console.log("  1. /models endpoint works");
    console.log("  2. /chat/completions endpoint works");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("Atlas Cloud API Test");
  console.log("=".repeat(60));
  console.log(`API Base: ${API_BASE}`);
  console.log(`API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);

  // Test models endpoint
  const models = await testModelsEndpoint(apiKey);

  if (!models || models.length === 0) {
    console.log("\n❌ Failed to fetch models. Check your API key and endpoint.");
    process.exit(1);
  }

  // Pick a model to test chat completion
  // Prefer gpt-4o-mini or gpt-3.5-turbo as they're usually available and cheap
  const preferredModels = ["gpt-4o-mini", "gpt-3.5-turbo", "gpt-4o"];
  let testModel = models[0].id;

  for (const preferred of preferredModels) {
    const found = models.find(m => m.id.includes(preferred));
    if (found) {
      testModel = found.id;
      break;
    }
  }

  // Test chat completion
  const chatSuccess = await testChatCompletion(apiKey, testModel);

  console.log("\n" + "=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  console.log(`Models endpoint: ✅ Found ${models.length} models`);
  console.log(`Chat completion: ${chatSuccess ? "✅ Working" : "❌ Failed"}`);

  if (chatSuccess) {
    console.log("\n✅ Atlas Cloud API is working correctly!");
    console.log("\nThe issue might be in how OpenCode configures the provider.");
    console.log("Check that the provider config in OpenCode matches this format:");
    console.log(`
{
  "provider": {
    "atlascloud": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Atlas Cloud",
      "options": {
        "baseURL": "${API_BASE}"
      },
      "models": {
        "${testModel}": {
          "name": "${testModel}",
          "limit": { "context": 128000, "output": 16384 }
        }
      }
    }
  }
}
`);
  }
}

main();

#!/usr/bin/env node

/**
 * Verify the plugin setup is correct
 */

import fs from "fs";
import path from "path";
import os from "os";

console.log("=".repeat(60));
console.log("Atlas Cloud Plugin Setup Verification");
console.log("=".repeat(60));

let allGood = true;

// 1. Check plugin files exist
console.log("\n1. Plugin Files:");
const pluginDir = process.cwd();
const distIndex = path.join(pluginDir, "dist", "index.js");
if (fs.existsSync(distIndex)) {
  console.log(`   ✅ dist/index.js exists`);
} else {
  console.log(`   ❌ dist/index.js NOT FOUND`);
  allGood = false;
}

// 2. Check OpenCode config
console.log("\n2. OpenCode Config:");
const opencodeConfig = path.join(os.homedir(), ".config", "opencode", "opencode.json");
if (fs.existsSync(opencodeConfig)) {
  const config = JSON.parse(fs.readFileSync(opencodeConfig, "utf-8"));
  console.log(`   ✅ opencode.json exists`);
  if (config.plugin && config.plugin.includes(pluginDir)) {
    console.log(`   ✅ Plugin registered: ${pluginDir}`);
  } else {
    console.log(`   ❌ Plugin NOT registered in config`);
    console.log(`   Current plugins: ${JSON.stringify(config.plugin || [])}`);
    allGood = false;
  }
} else {
  console.log(`   ❌ opencode.json NOT FOUND`);
  allGood = false;
}

// 3. Check Atlas Cloud config
console.log("\n3. Atlas Cloud Config:");
const atlasConfig = path.join(os.homedir(), ".atlascloud", "config.json");
if (fs.existsSync(atlasConfig)) {
  const config = JSON.parse(fs.readFileSync(atlasConfig, "utf-8"));
  if (config.apiKey) {
    console.log(`   ✅ API key configured: ${config.apiKey.slice(0, 12)}...`);
  } else {
    console.log(`   ⚠️  config.json exists but no API key`);
  }
} else {
  console.log(`   ⚠️  ~/.atlascloud/config.json NOT FOUND (will use env or auth.json)`);
}

// 4. Check OpenCode auth.json
console.log("\n4. OpenCode Auth:");
const authFile = path.join(os.homedir(), ".local", "share", "opencode", "auth.json");
if (fs.existsSync(authFile)) {
  const auth = JSON.parse(fs.readFileSync(authFile, "utf-8"));
  if (auth.atlascloud) {
    console.log(`   ✅ auth.json has atlascloud key: ${auth.atlascloud.slice(0, 12)}...`);
  } else {
    console.log(`   ⚠️  auth.json exists but no atlascloud key`);
  }
} else {
  console.log(`   ⚠️  auth.json NOT FOUND`);
}

// 5. Check environment variable
console.log("\n5. Environment:");
if (process.env.ATLASCLOUD_API_KEY) {
  console.log(`   ✅ ATLASCLOUD_API_KEY set: ${process.env.ATLASCLOUD_API_KEY.slice(0, 12)}...`);
} else {
  console.log(`   ⚠️  ATLASCLOUD_API_KEY not set`);
}

// 6. Try to load and run the plugin
console.log("\n6. Plugin Load Test:");
try {
  const { AtlasCloudPlugin } = await import(distIndex);
  const mockCtx = { client: null };
  const hooks = await AtlasCloudPlugin(mockCtx);
  console.log(`   ✅ Plugin loaded successfully`);
  console.log(`   Hooks: ${Object.keys(hooks).join(", ")}`);

  // Test config hook
  if (hooks.config) {
    const testConfig = { provider: {} };
    await hooks.config(testConfig);
    const provider = testConfig.provider?.atlascloud;
    if (provider) {
      console.log(`   ✅ Provider registered: atlascloud`);
      console.log(`   - Name: ${provider.name}`);
      console.log(`   - Base URL: ${provider.options?.baseURL}`);
      console.log(`   - Models: ${Object.keys(provider.models || {}).length}`);

      // Show first 5 models
      const modelIds = Object.keys(provider.models || {}).slice(0, 5);
      console.log(`   - Sample models: ${modelIds.join(", ")}`);
    } else {
      console.log(`   ❌ Provider NOT registered`);
      allGood = false;
    }
  }
} catch (e) {
  console.log(`   ❌ Failed to load plugin: ${e.message}`);
  allGood = false;
}

// 7. Test API connectivity
console.log("\n7. API Connectivity Test:");
const apiKey = process.env.ATLASCLOUD_API_KEY ||
  (fs.existsSync(atlasConfig) ? JSON.parse(fs.readFileSync(atlasConfig, "utf-8")).apiKey : null) ||
  (fs.existsSync(authFile) ? JSON.parse(fs.readFileSync(authFile, "utf-8")).atlascloud : null);

if (apiKey) {
  try {
    const response = await fetch("https://api.atlascloud.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ API connection successful`);
      console.log(`   - Models available: ${data.data?.length || 0}`);
    } else {
      console.log(`   ❌ API returned error: ${response.status}`);
      allGood = false;
    }
  } catch (e) {
    console.log(`   ❌ API connection failed: ${e.message}`);
    allGood = false;
  }
} else {
  console.log(`   ⚠️  No API key found, skipping connectivity test`);
}

// Summary
console.log("\n" + "=".repeat(60));
if (allGood) {
  console.log("✅ All checks passed! Ready to use with OpenCode.");
  console.log("\nRun 'opencode' to start, then use /models to select a model.");
} else {
  console.log("❌ Some checks failed. See above for details.");
}
console.log("=".repeat(60));

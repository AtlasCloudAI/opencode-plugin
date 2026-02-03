#!/usr/bin/env node

/**
 * Check all config files that OpenCode uses
 */

import fs from "fs";
import path from "path";
import os from "os";

console.log("=".repeat(60));
console.log("OpenCode Configuration Check");
console.log("=".repeat(60));

// Check opencode.json
const opencodeConfig = path.join(os.homedir(), ".config", "opencode", "opencode.json");
console.log(`\n1. OpenCode Config: ${opencodeConfig}`);
if (fs.existsSync(opencodeConfig)) {
  const content = fs.readFileSync(opencodeConfig, "utf-8");
  console.log(content);
} else {
  console.log("   NOT FOUND");
}

// Check auth.json
const authFile = path.join(os.homedir(), ".local", "share", "opencode", "auth.json");
console.log(`\n2. Auth File: ${authFile}`);
if (fs.existsSync(authFile)) {
  const content = fs.readFileSync(authFile, "utf-8");
  const data = JSON.parse(content);
  // Mask the keys
  for (const key in data) {
    if (data[key] && typeof data[key] === "string") {
      data[key] = data[key].slice(0, 12) + "...";
    }
  }
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log("   NOT FOUND");
}

// Check atlascloud config
const atlasConfig = path.join(os.homedir(), ".atlascloud", "config.json");
console.log(`\n3. Atlas Cloud Config: ${atlasConfig}`);
if (fs.existsSync(atlasConfig)) {
  const content = fs.readFileSync(atlasConfig, "utf-8");
  const data = JSON.parse(content);
  if (data.apiKey) {
    data.apiKey = data.apiKey.slice(0, 12) + "...";
  }
  console.log(JSON.stringify(data, null, 2));
} else {
  console.log("   NOT FOUND");
}

// Check plugin path
const pluginPath = path.resolve(process.cwd());
const distIndex = path.join(pluginPath, "dist", "index.js");
console.log(`\n4. Plugin Path: ${pluginPath}`);
console.log(`   dist/index.js exists: ${fs.existsSync(distIndex)}`);

// Try to load the plugin and see what it exports
console.log(`\n5. Plugin Export Check:`);
try {
  const plugin = await import(distIndex);
  console.log(`   Exports: ${Object.keys(plugin).join(", ")}`);
  console.log(`   Has AtlasCloudPlugin: ${!!plugin.AtlasCloudPlugin}`);
  console.log(`   Has default: ${!!plugin.default}`);
} catch (e) {
  console.log(`   Error loading plugin: ${e.message}`);
}

// Try running the plugin
console.log(`\n6. Plugin Initialization Test:`);
try {
  const { AtlasCloudPlugin } = await import(distIndex);
  const mockCtx = { client: null };
  const hooks = await AtlasCloudPlugin(mockCtx);
  console.log(`   Hooks returned: ${Object.keys(hooks).join(", ")}`);

  // Try the config hook
  if (hooks.config) {
    const testConfig = {};
    await hooks.config(testConfig);
    console.log(`\n7. Provider Config Generated:`);
    console.log(JSON.stringify(testConfig, null, 2));
  }
} catch (e) {
  console.log(`   Error: ${e.message}`);
  console.log(e.stack);
}

console.log("\n" + "=".repeat(60));

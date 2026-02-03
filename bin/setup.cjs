#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const PLUGIN_NAME = "opencode-atlascloud-plugin";
const CONFIG_DIR = path.join(os.homedir(), ".config", "opencode");
const CONFIG_FILE = path.join(CONFIG_DIR, "opencode.json");

function log(message) {
  console.log(`[${PLUGIN_NAME}] ${message}`);
}

function error(message) {
  console.error(`[${PLUGIN_NAME}] ERROR: ${message}`);
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    log(`Created config directory: ${CONFIG_DIR}`);
  }
}

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const content = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      error(`Failed to parse existing config: ${e.message}`);
      return {};
    }
  }
  return {};
}

function saveConfig(config) {
  // Backup existing config
  if (fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE + ".bak", fs.readFileSync(CONFIG_FILE));
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function registerPlugin() {
  ensureConfigDir();

  const config = loadConfig();

  // Get the plugin path (parent directory of bin/)
  const pluginPath = path.resolve(__dirname, "..");

  // Verify dist/index.js exists
  const indexPath = path.join(pluginPath, "dist", "index.js");
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Plugin not built. Run 'npm run build' first. Expected: ${indexPath}`);
  }

  log(`Plugin path: ${pluginPath}`);

  // Initialize plugin array if it doesn't exist
  if (!config.plugin) {
    config.plugin = [];
  }

  // Check if plugin is already registered (by name or path)
  const alreadyExists = config.plugin.some(
    (p) => p === PLUGIN_NAME || p === pluginPath || (typeof p === "string" && p.includes(PLUGIN_NAME))
  );

  if (alreadyExists) {
    log("Plugin already configured.");
  } else {
    // Push the local path, not the package name
    config.plugin.push(pluginPath);
    saveConfig(config);
    log("Plugin added to configuration.");
    log(`Configuration saved: ${CONFIG_FILE}`);
  }

  return true;
}

function printInstructions() {
  console.log("\n" + "=".repeat(60));
  console.log("  Atlas Cloud Plugin for OpenCode - Setup Complete");
  console.log("=".repeat(60));
  console.log("\nNext steps:");
  console.log("\n1. Start OpenCode:");
  console.log("   $ opencode");
  console.log("\n2. Connect your Atlas Cloud account by asking:");
  console.log('   "Connect to Atlas Cloud with API key YOUR_API_KEY"');
  console.log("\n3. Restart OpenCode to load the models");
  console.log("\n4. Select an Atlas Cloud model:");
  console.log("   /models");
  console.log("\n" + "=".repeat(60));
  console.log("\nAlternative: Set the ATLASCLOUD_API_KEY environment variable:");
  console.log("   export ATLASCLOUD_API_KEY=your-api-key");
  console.log("\nOr create ~/.atlascloud/config.json:");
  console.log('   { "version": "1.0.0", "apiKey": "your-api-key" }');
  console.log("\n" + "=".repeat(60));
  console.log("\nAvailable tools provided by this plugin:");
  console.log("  - atlascloud_connect: Set your API key");
  console.log("  - atlascloud_status: Check connection status");
  console.log("  - atlascloud_disconnect: Remove your API key");
  console.log("\n" + "=".repeat(60) + "\n");
}

function main() {
  log("Setting up Atlas Cloud plugin for OpenCode...\n");

  try {
    registerPlugin();
    printInstructions();
  } catch (e) {
    error(`Setup failed: ${e.message}`);
    process.exit(1);
  }
}

main();

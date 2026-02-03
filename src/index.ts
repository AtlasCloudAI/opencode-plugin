import type { Plugin } from "@opencode-ai/plugin";
import { loadConfig, saveApiKey, getApiKey, clearApiKey } from "./server/config.js";
import {
  fetchModels,
  modelsToOpenCodeFormat,
  validateApiKey,
  ATLAS_CLOUD_API_BASE,
} from "./server/models.js";

const PROVIDER_ID = "atlascloud";
const PROVIDER_NAME = "Atlas Cloud";

// Custom fetch that strips Anthropic-specific parameters that Atlas Cloud doesn't support
function createAtlasCloudFetch() {
  return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (init?.body && typeof init.body === "string") {
      try {
        const body = JSON.parse(init.body);

        // Strip cache_control from messages (Anthropic-specific)
        if (body.messages && Array.isArray(body.messages)) {
          body.messages = body.messages.map((msg: any) => {
            const { cache_control, ...rest } = msg;
            // Also strip cache_control from content if it's an array
            if (Array.isArray(rest.content)) {
              rest.content = rest.content.map((c: any) => {
                const { cache_control: cc, ...contentRest } = c;
                return contentRest;
              });
            }
            return rest;
          });
        }

        // Strip other Anthropic-specific parameters
        delete body.anthropic_version;
        delete body.metadata;

        init = {
          ...init,
          body: JSON.stringify(body),
        };
      } catch {
        // Not JSON or parse error, pass through as-is
      }
    }

    return fetch(url, init);
  };
}

interface CommandResult {
  handled: boolean;
  response?: string;
  error?: string;
}

async function handleConnectCommand(args: string[]): Promise<CommandResult> {
  const key = args[0];

  if (!key) {
    return {
      handled: true,
      error: `Usage: /connect atlascloud <your_api_key>`,
    };
  }

  try {
    const isValid = await validateApiKey(key);

    if (!isValid) {
      return {
        handled: true,
        error: `❌ **Invalid API Key**\n\nThe API key could not be validated. Please check your key and try again.`,
      };
    }

    saveApiKey(key);
    const models = await fetchModels(key);
    const masked = key.substring(0, 8) + "..." + key.substring(key.length - 4);

    return {
      handled: true,
      response: `✅ **Atlas Cloud Connected!**\n\n- Key: \`${masked}\`\n- Models Available: ${models.length}\n\n**Restart OpenCode** to load the models.`,
    };
  } catch (e: any) {
    clearApiKey();
    return {
      handled: true,
      error: `❌ **Connection Failed**: ${e.message || e}`,
    };
  }
}

async function handleStatusCommand(): Promise<CommandResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      handled: true,
      response: `ℹ️ **Atlas Cloud Status**\n\nNot connected. Use \`/connect atlascloud <api_key>\` to connect.`,
    };
  }

  try {
    const isValid = await validateApiKey(apiKey);
    if (isValid) {
      const models = await fetchModels(apiKey);
      const masked = apiKey.substring(0, 8) + "...";
      return {
        handled: true,
        response: `✅ **Atlas Cloud Status**\n\n- Connected: Yes\n- Key: \`${masked}\`\n- Models: ${models.length}`,
      };
    } else {
      return {
        handled: true,
        error: `⚠️ **Atlas Cloud Status**\n\nAPI key is configured but invalid. Use \`/connect atlascloud <api_key>\` to update.`,
      };
    }
  } catch (e: any) {
    return {
      handled: true,
      error: `❌ **Status Check Failed**: ${e.message || e}`,
    };
  }
}

async function handleDisconnectCommand(): Promise<CommandResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      handled: true,
      response: `ℹ️ Atlas Cloud is not connected.`,
    };
  }

  clearApiKey();
  return {
    handled: true,
    response: `✅ **Disconnected from Atlas Cloud**\n\nAPI key removed. Restart OpenCode for changes to take effect.`,
  };
}

async function handleCommand(command: string): Promise<CommandResult> {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const subCmd = parts[1]?.toLowerCase();
  const args = parts.slice(2);

  // Handle /connect atlascloud <key>
  if (cmd === "connect" && subCmd === "atlascloud") {
    return handleConnectCommand(args);
  }

  // Handle /atlascloud <subcommand>
  if (cmd === "atlascloud") {
    switch (subCmd) {
      case "connect":
        return handleConnectCommand(args);
      case "status":
        return handleStatusCommand();
      case "disconnect":
        return handleDisconnectCommand();
      default:
        return {
          handled: true,
          response: `**Atlas Cloud Commands**\n\n- \`/atlascloud connect <api_key>\` - Connect with API key\n- \`/atlascloud status\` - Check connection status\n- \`/atlascloud disconnect\` - Remove API key\n\nOr use: \`/connect atlascloud <api_key>\``,
        };
    }
  }

  return { handled: false };
}

// Debug logging helper
const DEBUG = process.env.ATLASCLOUD_DEBUG === "1" || process.env.DEBUG?.includes("atlascloud");
function log(...args: any[]) {
  if (DEBUG) {
    console.error("[atlascloud-plugin]", ...args);
  }
}

// Helper to safely display API key
function maskKey(key: unknown): string {
  if (typeof key === "string" && key.length > 0) {
    return key.slice(0, 12) + "...";
  }
  return "NONE";
}

export const AtlasCloudPlugin: Plugin = async (ctx) => {
  log("Plugin initializing...");

  // Load configuration and fetch models on plugin initialization
  const loadedConfig = loadConfig();
  const apiKey = loadedConfig.apiKey;
  log("API key loaded:", maskKey(apiKey));

  // Fetch models (will use fallback if no API key)
  const models = await fetchModels(apiKey);
  const modelsObject = modelsToOpenCodeFormat(models);
  log("Models loaded:", Object.keys(modelsObject).length);
  log("Sample models:", Object.keys(modelsObject).slice(0, 5).join(", "));

  return {
    // Configuration hook to register the provider
    config: async (config) => {
      const currentApiKey = getApiKey();
      log("Config hook called, apiKey:", maskKey(currentApiKey));

      // Access the config to add the provider
      const cfg = config as Record<string, unknown>;
      cfg.provider = cfg.provider || {};

      // Don't specify apiKey here - OpenCode will resolve it from auth.json
      // The auth.json format is: { "atlascloud": { "type": "api", "key": "..." } }
      log("Provider config: OpenCode will resolve API key from auth.json");

      const providerConfig = {
        id: PROVIDER_ID,
        name: PROVIDER_NAME,
        npm: "@ai-sdk/openai-compatible",
        options: {
          baseURL: ATLAS_CLOUD_API_BASE,
        },
        models: modelsObject,
      };

      (cfg.provider as Record<string, unknown>)[PROVIDER_ID] = providerConfig;
      log("Provider registered:", JSON.stringify({ ...providerConfig, models: `[${Object.keys(modelsObject).length} models]` }, null, 2));
    },

    // Command hook for /connect atlascloud and /atlascloud commands
    "tui.command.execute": async (input: any, output: any) => {
      const result = await handleCommand(input.command);
      if (result.handled) {
        output.handled = true;
        if (result.response) output.response = result.response;
        if (result.error) output.error = result.error;
      }
    },
  };
};

export default AtlasCloudPlugin;

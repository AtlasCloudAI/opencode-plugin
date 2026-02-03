import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface AtlasCloudConfig {
  version: string;
  apiKey?: string;
}

const CONFIG_DIR = path.join(os.homedir(), ".atlascloud");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const OPENCODE_AUTH_DIR = path.join(os.homedir(), ".local", "share", "opencode");
const OPENCODE_AUTH_FILE = path.join(OPENCODE_AUTH_DIR, "auth.json");

const DEFAULT_CONFIG: AtlasCloudConfig = {
  version: "1.0.0",
};

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function ensureOpenCodeAuthDir(): void {
  if (!fs.existsSync(OPENCODE_AUTH_DIR)) {
    fs.mkdirSync(OPENCODE_AUTH_DIR, { recursive: true });
  }
}

export function loadConfig(): AtlasCloudConfig {
  // First, try to load from our own config file
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const content = fs.readFileSync(CONFIG_FILE, "utf-8");
      const config = JSON.parse(content) as AtlasCloudConfig;
      if (config.apiKey) {
        return config;
      }
    } catch (error) {
      // Config file exists but is invalid, continue to check other sources
    }
  }

  // Check OpenCode's auth.json for the "atlascloud" key
  if (fs.existsSync(OPENCODE_AUTH_FILE)) {
    try {
      const content = fs.readFileSync(OPENCODE_AUTH_FILE, "utf-8");
      const authData = JSON.parse(content);
      const atlasAuth = authData.atlascloud;
      // Handle both new format { type: "api", key: "..." } and legacy string format
      if (atlasAuth) {
        const key = typeof atlasAuth === "object" && atlasAuth.type === "api"
          ? atlasAuth.key
          : typeof atlasAuth === "string"
            ? atlasAuth
            : undefined;
        if (key) {
          return {
            ...DEFAULT_CONFIG,
            apiKey: key,
          };
        }
      }
    } catch (error) {
      // Auth file exists but is invalid or doesn't have atlascloud key
    }
  }

  // Check environment variable
  const envApiKey = process.env.ATLASCLOUD_API_KEY;
  if (envApiKey) {
    return {
      ...DEFAULT_CONFIG,
      apiKey: envApiKey,
    };
  }

  return DEFAULT_CONFIG;
}

export function saveConfig(config: AtlasCloudConfig): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function loadOpenCodeAuth(): Record<string, unknown> {
  if (fs.existsSync(OPENCODE_AUTH_FILE)) {
    try {
      const content = fs.readFileSync(OPENCODE_AUTH_FILE, "utf-8");
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
  return {};
}

interface OpenCodeAuthEntry {
  type: "api";
  key: string;
}

function saveOpenCodeAuth(auth: Record<string, OpenCodeAuthEntry>): void {
  ensureOpenCodeAuthDir();
  fs.writeFileSync(OPENCODE_AUTH_FILE, JSON.stringify(auth, null, 2));
}

export function saveApiKey(apiKey: string): void {
  // Save to our own config
  const config = loadConfig();
  config.apiKey = apiKey;
  saveConfig(config);

  // Save to OpenCode's auth.json in the correct format
  const existingAuth = loadOpenCodeAuth();
  const auth: Record<string, OpenCodeAuthEntry> = {};

  // Preserve existing entries (convert if needed)
  for (const [key, value] of Object.entries(existingAuth)) {
    if (typeof value === "object" && value !== null && (value as any).type === "api") {
      auth[key] = value as OpenCodeAuthEntry;
    }
  }

  // Add/update atlascloud entry
  auth.atlascloud = {
    type: "api",
    key: apiKey,
  };

  saveOpenCodeAuth(auth);
}

export function getApiKey(): string | undefined {
  return loadConfig().apiKey;
}

export function clearApiKey(): void {
  // Clear from our config
  const config = loadConfig();
  delete config.apiKey;
  saveConfig(config);

  // Also clear from OpenCode's auth.json
  if (fs.existsSync(OPENCODE_AUTH_FILE)) {
    try {
      const content = fs.readFileSync(OPENCODE_AUTH_FILE, "utf-8");
      const authData = JSON.parse(content);
      delete authData.atlascloud;
      ensureOpenCodeAuthDir();
      fs.writeFileSync(OPENCODE_AUTH_FILE, JSON.stringify(authData, null, 2));
    } catch {
      // Ignore errors
    }
  }
}

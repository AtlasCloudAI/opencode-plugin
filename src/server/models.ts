import { getApiKey } from "./config.js";

export interface AtlasCloudModel {
  id: string;
  name: string;
  context: number;
  output: number;
}

export interface OpenCodeModel {
  name: string;
  limit: {
    context: number;
    output: number;
  };
}

const ATLAS_CLOUD_API_BASE = "https://api.atlascloud.ai/v1";

// Fallback models - use actual Atlas Cloud model IDs (verified from API)
const FALLBACK_MODELS: AtlasCloudModel[] = [
  // OpenAI models
  { id: "openai/gpt-4o", name: "GPT-4o", context: 128000, output: 16384 },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", context: 128000, output: 16384 },
  { id: "openai/gpt-4.1", name: "GPT-4.1", context: 128000, output: 16384 },
  { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", context: 128000, output: 16384 },
  { id: "openai/gpt-5", name: "GPT-5", context: 200000, output: 32768 },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", context: 128000, output: 16384 },
  { id: "openai/o1", name: "O1", context: 200000, output: 100000 },
  { id: "openai/o3", name: "O3", context: 200000, output: 100000 },
  { id: "openai/o3-mini", name: "O3 Mini", context: 200000, output: 65536 },
  // Anthropic models
  { id: "anthropic/claude-sonnet-4.5-20250929", name: "Claude Sonnet 4.5", context: 200000, output: 16384 },
  { id: "anthropic/claude-opus-4.5-20251101", name: "Claude Opus 4.5", context: 200000, output: 16384 },
  { id: "anthropic/claude-haiku-4.5-20251001", name: "Claude Haiku 4.5", context: 200000, output: 8192 },
  { id: "anthropic/claude-haiku-4.5-20251001-developer", name: "Claude Haiku 4.5 Developer", context: 200000, output: 8192 },
  { id: "anthropic/claude-3.7-sonnet-20250219", name: "Claude 3.7 Sonnet", context: 200000, output: 8192 },
  // Google models
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", context: 1000000, output: 8192 },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", context: 1000000, output: 8192 },
  { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", context: 2000000, output: 8192 },
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash Preview", context: 2000000, output: 16384 },
  { id: "google/gemini-3-pro-preview", name: "Gemini 3 Pro Preview", context: 2000000, output: 32768 },
  // DeepSeek models
  { id: "deepseek-ai/DeepSeek-V3.1", name: "DeepSeek V3.1", context: 128000, output: 8192 },
  { id: "deepseek-ai/deepseek-v3.2-speciale", name: "DeepSeek V3.2 Speciale", context: 128000, output: 8192 },
  { id: "deepseek-ai/deepseek-v3.2", name: "DeepSeek V3.2", context: 128000, output: 8192 },
  { id: "deepseek-ai/deepseek-r1-0528", name: "DeepSeek R1", context: 128000, output: 8192 },
  // xAI models
  { id: "xai/grok-4-0709", name: "Grok 4", context: 128000, output: 16384 },
];

interface ApiModel {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

interface ModelsResponse {
  object?: string;
  data: ApiModel[];
}

function getModelContextLength(modelId: string): number {
  const id = modelId.toLowerCase();

  // Anthropic models
  if (id.includes("claude")) return 200000;

  // OpenAI models
  if (id.includes("o1") || id.includes("o3") || id.includes("gpt-5")) return 200000;
  if (id.includes("gpt-4")) return 128000;
  if (id.includes("gpt-3.5")) return 16385;

  // Google models
  if (id.includes("gemini-3")) return 2000000;
  if (id.includes("gemini-2.5")) return 1000000;
  if (id.includes("gemini")) return 128000;

  // DeepSeek models
  if (id.includes("deepseek")) return 128000;

  // xAI models
  if (id.includes("grok")) return 128000;

  // Llama models
  if (id.includes("llama-3.1-405b") || id.includes("llama-3.1-70b")) return 128000;
  if (id.includes("llama")) return 8192;

  // Mistral models
  if (id.includes("mistral-large") || id.includes("mixtral")) return 32768;
  if (id.includes("mistral")) return 8192;

  // Qwen models
  if (id.includes("qwen3")) return 128000;
  if (id.includes("qwen")) return 32768;

  return 128000; // Default context length - more generous default
}

function getModelOutputTokens(modelId: string): number {
  const id = modelId.toLowerCase();

  // Reasoning models with large output
  if (id.includes("o1") || id.includes("o3")) return 100000;
  if (id.includes("deepseek-r1") || id.includes("thinking")) return 65536;

  // Large output models
  if (id.includes("gpt-5") && !id.includes("mini") && !id.includes("nano")) return 32768;
  if (id.includes("gemini-3-pro")) return 32768;

  // Standard large output
  if (id.includes("gpt-4o") || id.includes("gpt-4.1") || id.includes("gpt-5")) return 16384;
  if (id.includes("claude-sonnet-4") || id.includes("claude-opus-4")) return 16384;
  if (id.includes("gemini-3")) return 16384;
  if (id.includes("grok-4")) return 16384;

  // Standard output
  if (id.includes("claude")) return 8192;
  if (id.includes("gemini")) return 8192;
  if (id.includes("deepseek")) return 8192;
  if (id.includes("gpt")) return 8192;
  if (id.includes("qwen")) return 8192;

  return 8192; // Default output tokens
}

function formatModelName(modelId: string): string {
  // Capitalize and format model names nicely
  return modelId
    .split("-")
    .map((part) => {
      if (part.match(/^\d/)) return part; // Keep version numbers as-is
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ")
    .replace(/\s+(\d)/g, "-$1"); // Join version numbers with dash
}

export async function fetchModels(
  apiKey?: string
): Promise<AtlasCloudModel[]> {
  const key = apiKey || getApiKey();

  if (!key) {
    return FALLBACK_MODELS;
  }

  try {
    const response = await fetch(`${ATLAS_CLOUD_API_BASE}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch models: ${response.status} ${response.statusText}`
      );
      return FALLBACK_MODELS;
    }

    const data = (await response.json()) as ModelsResponse;

    if (!data.data || !Array.isArray(data.data)) {
      return FALLBACK_MODELS;
    }

    return data.data.map((model: ApiModel) => ({
      id: model.id,
      name: formatModelName(model.id),
      context: getModelContextLength(model.id),
      output: getModelOutputTokens(model.id),
    }));
  } catch (error) {
    console.error("Error fetching models:", error);
    return FALLBACK_MODELS;
  }
}

export function modelsToOpenCodeFormat(
  models: AtlasCloudModel[]
): Record<string, OpenCodeModel> {
  const result: Record<string, OpenCodeModel> = {};

  for (const model of models) {
    result[model.id] = {
      name: model.name,
      limit: {
        context: model.context,
        output: model.output,
      },
    };
  }

  return result;
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${ATLAS_CLOUD_API_BASE}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

export { ATLAS_CLOUD_API_BASE };

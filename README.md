# Atlas Cloud Plugin for OpenCode

An [OpenCode](https://opencode.ai) plugin that integrates [Atlas Cloud's](https://atlascloud.ai) OpenAI-compatible API, giving you access to 100+ AI models including GPT-4o, Claude, Gemini, DeepSeek, and more.

## Quick Start

### 1. Install and register the plugin

```bash
npx @atlascloudai/opencode
```

This downloads the plugin and registers it with OpenCode.

**Alternative: Global install**
```bash
npm install -g @atlascloudai/opencode
atlascloudai-opencode
```

### 2. Start OpenCode and connect

```bash
opencode
```

Then connect to Atlas Cloud:

1. Run `/connect`
2. Select **Atlas Cloud** from the provider list
3. Enter your API key when prompted

### 3. Restart OpenCode to load models

Exit and restart OpenCode. Your Atlas Cloud models will now be available via `/models`.

## Commands

| Command | Description |
|---------|-------------|
| `/connect` | Open provider selection to connect |
| `/models` | List available models |

## Available Models

The plugin dynamically fetches all available models from Atlas Cloud. Popular models include:

- GPT-4o, GPT-4o Mini, GPT-4.1, O1, O3
- Claude Sonnet 4.5, Claude Opus 4.5
- Gemini 2.5 Flash, Gemini 2.5 Pro
- DeepSeek V3.2, DeepSeek R1
- Kimi K2.5
- GLM 4.7
- MiniMax M2.1
- Qwen 3 Max
- Grok 4

And many more...

## Configuration

### API Key Sources (in priority order)

1. **OpenCode auth.json** - `~/.local/share/opencode/auth.json`
2. **Plugin config** - `~/.atlascloud/config.json`
3. **Environment variable** - `ATLASCLOUD_API_KEY`

### Manual Configuration

If you prefer not to use `/connect`, you can manually create the config:

**Option 1: Environment variable**
```bash
export ATLASCLOUD_API_KEY=your-api-key
```

**Option 2: Config file** (`~/.atlascloud/config.json`)
```json
{
  "version": "1.0.0",
  "apiKey": "your-api-key"
}
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm or bun
- [OpenCode](https://opencode.ai) installed

### Local Development

```bash
# Clone the repository
git clone https://github.com/AtlasCloudAI/opencode-plugin.git
cd opencode-plugin

# Install dependencies
npm install

# Build
npm run build

# Register plugin locally
node bin/setup.cjs

# Start OpenCode
opencode
```

### Watch Mode

```bash
npm run dev
```

### Testing in Docker

For a clean, isolated test environment:

```bash
# Build Docker image
make build

# Run container
make run

# Inside container:
node bin/setup.cjs    # Register plugin
opencode              # Start OpenCode
```

## Troubleshooting

### Models not showing up

1. Ensure you've run `/connect` and selected Atlas Cloud with a valid key
2. **Restart OpenCode** after connecting (required to load models)
3. Try `/models` to see if Atlas Cloud models appear

### Invalid API key error

1. Verify your key at [Atlas Cloud dashboard](https://atlascloud.ai)
2. Run `/connect` again and re-enter your key

### Plugin not loading

1. Run `npx @atlascloudai/opencode` to re-register
2. Check `~/.config/opencode/opencode.json` has the plugin listed

### Debug mode

Enable debug logging:
```bash
ATLASCLOUD_DEBUG=1 opencode
```

## Architecture

```
opencode-atlascloud-plugin/
├── bin/
│   └── setup.cjs          # CLI setup script
├── src/
│   ├── index.ts           # Plugin entry point
│   └── server/
│       ├── config.ts      # Configuration management
│       └── models.ts      # Model fetching & formatting
├── dist/                  # Compiled output
├── package.json
└── tsconfig.json
```

## API Reference

**Base URL**: `https://api.atlascloud.ai/v1`

The plugin uses Atlas Cloud's OpenAI-compatible API via `@ai-sdk/openai-compatible`.

## License

MIT

## Links

- [Atlas Cloud](https://atlascloud.ai)
- [OpenCode](https://opencode.ai)
- [Report Issues](https://github.com/AtlasCloudAI/opencode-plugin/issues)

#!/bin/bash
set -e

echo "=== Testing Atlas Cloud Plugin ==="
echo ""

# Check if plugin is registered
echo "1. Checking OpenCode config..."
cat ~/.config/opencode/opencode.json
echo ""

# Check if plugin can be imported
echo "2. Testing plugin import..."
node -e "import('opencode-atlascloud-plugin').then(m => console.log('Plugin exports:', Object.keys(m)))"
echo ""

# Test config module
echo "3. Testing config module..."
node -e "
import('opencode-atlascloud-plugin/dist/server/config.js').then(({ loadConfig, getApiKey }) => {
  console.log('Config:', loadConfig());
  console.log('API Key:', getApiKey() || '(not set)');
});
"
echo ""

# Test models module (without API key - should return fallback)
echo "4. Testing models module (fallback models)..."
node -e "
import('opencode-atlascloud-plugin/dist/server/models.js').then(async ({ fetchModels }) => {
  const models = await fetchModels();
  console.log('Fallback models count:', models.length);
  console.log('First 3 models:', models.slice(0, 3).map(m => m.id));
});
"
echo ""

echo "=== All tests passed! ==="
echo ""
echo "To test with a real API key:"
echo "  export ATLASCLOUD_API_KEY=your-key"
echo "  opencode"

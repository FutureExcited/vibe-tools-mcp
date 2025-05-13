# vibe-tools-mcp

> MCP server for vibe-tools - extends AI editor's capabilities with custom tools

## Installation

```json
{
  "mcpServers": {
    "vibe-tools": {
      "command": "npx",
      "args": ["-y", "vibe-tools-mcp@latest"]
    }
  }
}
```

Set required environment variables in `.vibe-tools.env` (in your project or home directory):

```env
# At least one of these is required for MCP
ANTHROPIC_API_KEY="your-anthropic-api-key"
# or
OPENROUTER_API_KEY="your-openrouter-api-key"
```

For more information about vibe-tools, visit [vibe-tools documentation](https://github.com/eastlondoner/cursor-tools).

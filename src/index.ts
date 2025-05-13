#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { allTools } from "./tools/index.js";

// Log current working directory
console.error(`MCP Server running from directory: ${process.cwd()}`);

// Simple interface for the tool definition structure we created
interface VibeToolDefinition {
  name: string;
  description: string;
  schema: any; // Using any to bypass SDK type complexity
  handler: (...args: any[]) => Promise<any>;
}

// --- MCP Server Setup ---

const server = new McpServer({
  name: "vibe-tools-mcp-server",
  version: "1.1.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// --- Register Tools ---

allTools.forEach((tool: VibeToolDefinition) => {
  server.tool(tool.name, tool.description, tool.schema as any, tool.handler);
  console.error(`Registered tool: ${tool.name}`);
});

// --- Server Execution ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("vibe-tools MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in MCP server main():", error);
  process.exit(1);
});

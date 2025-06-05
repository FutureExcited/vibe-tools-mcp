import { z } from "zod";
import { escapeShellArg, executeVibeToolsCommand } from "./helpers.js";

const mcpSchema = {
  subcommand: z
    .enum(["run", "search"])
    .describe("The MCP subcommand to execute: 'run' or 'search'"),
  query: z.string().describe("The MCP query to execute."),
  provider: z
    .string()
    .optional()
    .describe("Optional AI provider (anthropic or openrouter)"),
  directory: z
    .string()
    .describe(
      "Mandatory. The absolute path to the local directory you are currently working in. This is required to ensure the command runs in the correct project context."
    ),
};

export const mcpTool = {
  name: "mcp",
  description:
    "Interact with MCP servers through vibe-tools. Use 'search' to find available MCP servers or 'run' to execute MCP server tools using natural language queries.",
  schema: mcpSchema,
  handler: async (args: z.infer<z.ZodObject<typeof mcpSchema>>) => {
    // Build the command based on the subcommand
    let cmd = `vibe-tools mcp ${args.subcommand} ${escapeShellArg(args.query)}`;

    // Add provider if specified
    if (args.provider) cmd += ` --provider=${escapeShellArg(args.provider)}`;

    return executeVibeToolsCommand(cmd, args.directory);
  },
};

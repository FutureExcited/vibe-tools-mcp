import { z } from "zod";
import { escapeShellArg, executeVibeToolsCommand } from "./helpers.js";

const askSchema = {
  query: z.string().describe("The question to ask"),
  provider: z
    .string()
    .optional()
    .describe("Optional AI provider (e.g., openai)"),
  model: z.string().optional().describe("Optional specific model name"),
  reasoningEffort: z
    .enum(["low", "medium", "high"])
    .optional()
    .describe("Optional reasoning effort"),
  withDoc: z
    .array(z.string())
    .optional()
    .describe("Optional array of document URLs to include as context"),
};

export const askTool = {
  name: "ask",
  description:
    "Ask a question directly to an AI model. Note that this command does not include repository context by default.",
  schema: askSchema,
  handler: async (args: z.infer<z.ZodObject<typeof askSchema>>) => {
    let cmd = `vibe-tools ask ${escapeShellArg(args.query)}`;
    if (args.provider) cmd += ` --provider=${escapeShellArg(args.provider)}`;
    if (args.model) cmd += ` --model=${escapeShellArg(args.model)}`;
    if (args.reasoningEffort)
      cmd += ` --reasoning-effort=${escapeShellArg(args.reasoningEffort)}`;
    args.withDoc?.forEach((docUrl) => {
      cmd += ` --with-doc=${escapeShellArg(docUrl)}`;
    });
    return executeVibeToolsCommand(cmd);
  },
};

import { z } from "zod";
import { escapeShellArg, executeVibeToolsCommand } from "./helpers.js";

const docSchema = {
  output: z.string().optional().describe("Optional output file path"),
  provider: z.string().optional().describe("Optional AI provider"),
  model: z.string().optional().describe("Optional specific model name"),
  maxTokens: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Optional max tokens for response"),
  fromGithub: z
    .string()
    .optional()
    .describe("Optional remote GitHub repo (user/repo[@branch])"),
  withDoc: z
    .array(z.string())
    .optional()
    .describe("Optional array of document URLs to include as context"),
  directory: z
    .string()
    .describe(
      "Mandatory. The absolute path to the local directory you are currently working in. This is required to ensure the command runs in the correct project context, especially if not using fromGithub."
    ),
};

export const docTool = {
  name: "doc",
  description:
    "Generate documentation for the repository using vibe-tools doc.",
  schema: docSchema,
  handler: async (args: z.infer<z.ZodObject<typeof docSchema>>) => {
    let cmd = "vibe-tools doc";
    if (args.output) cmd += ` --output=${escapeShellArg(args.output)}`;
    if (args.provider) cmd += ` --provider=${escapeShellArg(args.provider)}`;
    if (args.model) cmd += ` --model=${escapeShellArg(args.model)}`;
    if (args.maxTokens) cmd += ` --max-tokens=${args.maxTokens}`;
    if (args.fromGithub)
      cmd += ` --from-github=${escapeShellArg(args.fromGithub)}`;
    args.withDoc?.forEach((docUrl) => {
      cmd += ` --with-doc=${escapeShellArg(docUrl)}`;
    });
    return executeVibeToolsCommand(cmd, args.directory);
  },
};

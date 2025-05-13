import { z } from "zod";
import { escapeShellArg, executeVibeToolsCommand } from "./helpers.js";

const planSchema = {
  query: z.string().describe("The query for the implementation plan"),
  fileProvider: z
    .string()
    .optional()
    .describe("Optional provider for file identification"),
  thinkingProvider: z
    .string()
    .optional()
    .describe("Optional provider for plan generation"),
  fileModel: z
    .string()
    .optional()
    .describe("Optional model for file identification"),
  thinkingModel: z
    .string()
    .optional()
    .describe("Optional model for plan generation"),
  withDoc: z
    .array(z.string())
    .optional()
    .describe("Optional array of document URLs to include as context"),
  directory: z
    .string()
    .describe(
      "Mandatory. The absolute path to the local directory you are currently working in. This is required to ensure the command runs in the correct project context."
    ),
};

export const planTool = {
  name: "plan",
  description: "Generate an implementation plan using vibe-tools plan.",
  schema: planSchema,
  handler: async (args: z.infer<z.ZodObject<typeof planSchema>>) => {
    let cmd = `vibe-tools plan ${escapeShellArg(args.query)}`;
    if (args.fileProvider)
      cmd += ` --fileProvider=${escapeShellArg(args.fileProvider)}`;
    if (args.thinkingProvider)
      cmd += ` --thinkingProvider=${escapeShellArg(args.thinkingProvider)}`;
    if (args.fileModel) cmd += ` --fileModel=${escapeShellArg(args.fileModel)}`;
    if (args.thinkingModel)
      cmd += ` --thinkingModel=${escapeShellArg(args.thinkingModel)}`;
    args.withDoc?.forEach((docUrl) => {
      cmd += ` --with-doc=${escapeShellArg(docUrl)}`;
    });
    return executeVibeToolsCommand(cmd, args.directory);
  },
};

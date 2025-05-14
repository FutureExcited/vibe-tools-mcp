import { z } from "zod";
import { escapeShellArg, executeVibeToolsCommand } from "./helpers.js";

const githubSchema = {
  subcommand: z.enum(["pr", "issue"]).describe("Subcommand: pr or issue"),
  number: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Optional PR or issue number"),
  fromGithub: z
    .string()
    .optional()
    .describe("Optional target GitHub repo (user/repo[@branch])"),
  directory: z
    .string()
    .describe(
      "Mandatory. The absolute path to the local directory you are currently working in. This is required to ensure the command runs in the correct project context, especially if fromGithub is not specified or refers to the current repo."
    ),
};

export const githubTool = {
  name: "github",
  description:
    "Get information about GitHub Pull Requests or Issues. Retrieves either the most recent 10 items or a specific one by number.",
  schema: githubSchema,
  handler: async (args: z.infer<z.ZodObject<typeof githubSchema>>) => {
    let cmd = `vibe-tools github ${args.subcommand}`;
    if (args.number !== undefined) {
      cmd += ` ${args.number}`;
    }
    if (args.fromGithub) {
      cmd += ` --from-github=${escapeShellArg(args.fromGithub)}`;
    }
    return executeVibeToolsCommand(cmd, args.directory);
  },
};

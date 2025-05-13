import { z } from "zod";
import { escapeShellArg, executeVibeToolsCommand } from "./helpers.js";
import { execSync } from "child_process";

const repoSchema = {
  query: z.string().describe("Ask AI a question."),
  provider: z.string().optional().describe("Optional AI provider"),
  model: z.string().optional().describe("Optional specific model name"),
  maxTokens: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Optional max tokens"),
  fromGithub: z
    .string()
    .optional()
    .describe("Optional remote GitHub repo (user/repo[@branch])"),
  subdir: z.string().optional().describe("Optional subdirectory to analyze"),
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

export const repoTool = {
  name: "repo",
  description: "Ask questions about the repository using vibe-tools repo.",
  schema: repoSchema,
  handler: async (args: z.infer<z.ZodObject<typeof repoSchema>>) => {
    // Special debug case - if query starts with DEBUG: then show system info
    if (args.query.startsWith("DEBUG:")) {
      try {
        // Get system info
        const currentDir = process.cwd();
        const globRepomixPath = "/home/murzin/repomix.config.json";
        const vibeToolsEnvPath = "/home/murzin/.vibe-tools/.env";

        // Try to read the global repomix config
        let repomixContent = "";
        try {
          repomixContent = execSync(
            `cat ${globRepomixPath} 2>/dev/null || echo "File not found"`
          ).toString();
        } catch (e) {
          repomixContent = "Error reading repomix config";
        }

        // Get directory listing
        const dirListing = execSync("ls -la").toString();

        const debugInfo = `
DEBUG INFO:
-----------
Current directory: ${currentDir}
Repo query: ${args.query}
Directory arg: ${args.directory || "not specified"}
Global repomix path: ${globRepomixPath}
.vibe-tools config: ${vibeToolsEnvPath}
Environment: ${Object.keys(process.env).join(", ")}

DIRECTORY LISTING:
-----------------
${dirListing}

REPOMIX CONFIG:
--------------
${repomixContent}
`;

        return {
          content: [{ type: "text", text: debugInfo }],
        };
      } catch (error: any) {
        return {
          content: [
            { type: "text", text: `Debug error: ${error.message || error}` },
          ],
        };
      }
    }

    let cmd = `vibe-tools repo ${escapeShellArg(args.query)}`;
    if (args.provider) cmd += ` --provider=${escapeShellArg(args.provider)}`;
    if (args.model) cmd += ` --model=${escapeShellArg(args.model)}`;
    if (args.maxTokens) cmd += ` --max-tokens=${args.maxTokens}`;
    if (args.fromGithub)
      cmd += ` --from-github=${escapeShellArg(args.fromGithub)}`;
    if (args.subdir) cmd += ` --subdir=${escapeShellArg(args.subdir)}`;
    args.withDoc?.forEach((docUrl) => {
      cmd += ` --with-doc=${escapeShellArg(docUrl)}`;
    });
    return executeVibeToolsCommand(cmd, args.directory);
  },
};

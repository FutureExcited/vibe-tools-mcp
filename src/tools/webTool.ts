import { z } from "zod";
import { escapeShellArg, executeVibeToolsCommand } from "./helpers.js";

const webSchema = {
  search_term: z
    .string()
    .describe(
      "The search term to look up on the web. Be specific and include relevant keywords for better results. For technical queries, include version numbers or dates if relevant."
    ),
  provider: z
    .string()
    .optional()
    .describe(
      "Optional AI provider to use (perplexity, gemini, modelbox, or openrouter)"
    ),
};

export const webTool = {
  name: "web_search",
  description:
    "Search the web for real-time information about any topic. Use this tool when you need up-to-date information that might not be available in your training data, or when you need to verify current facts. The search results will include relevant snippets and URLs from web pages. This is particularly useful for questions about current events, technology updates, or any topic that requires recent information.",
  schema: webSchema,
  handler: async (args: z.infer<z.ZodObject<typeof webSchema>>) => {
    let cmd = `vibe-tools web ${escapeShellArg(args.search_term)}`;
    if (args.provider) cmd += ` --provider=${escapeShellArg(args.provider)}`;

    return executeVibeToolsCommand(cmd);
  },
};

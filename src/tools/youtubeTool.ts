import { z } from "zod";
import { escapeShellArg, executeVibeToolsCommand } from "./helpers.js";

const youtubeSchema = {
  youtube_url: z.string().describe("The YouTube video URL to analyze"),
  question: z
    .string()
    .optional()
    .describe("Optional specific question about the video"),
  analysis_type: z
    .enum(["summary", "transcript", "plan", "review", "custom"])
    .optional()
    .describe("Type of analysis to perform (default: summary)"),
  directory: z
    .string()
    .describe(
      "Mandatory. The absolute path to the local directory you are currently working in. This is required to ensure the command runs in the correct project context."
    ),
};

export const youtubeTool = {
  name: "youtube_analysis",
  description:
    "Analyze YouTube videos to extract insights, summaries, transcripts, or implementation plans. Requires a valid YouTube URL. Use this tool when you need to understand video content, create summaries, or convert video tutorials into actionable plans.",
  schema: youtubeSchema,
  handler: async (args: z.infer<z.ZodObject<typeof youtubeSchema>>) => {
    let cmd = `vibe-tools youtube ${escapeShellArg(args.youtube_url)}`;

    if (args.question) cmd += ` ${escapeShellArg(args.question)}`;
    if (args.analysis_type)
      cmd += ` --type=${escapeShellArg(args.analysis_type)}`;

    return executeVibeToolsCommand(cmd, args.directory);
  },
};

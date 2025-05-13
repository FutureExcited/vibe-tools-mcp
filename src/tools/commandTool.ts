import { z } from "zod";
import { executeVibeToolsCommand } from "./helpers.js";

export const commandTool = {
  name: "command",
  description:
    "Executes a vibe-tools command in a specified directory. Accepts the full 'vibe-tools <command>' or just '<command>'.",
  schema: {
    command: z
      .string()
      .describe(
        "The vibe-tools command string to execute (e.g., 'repo \"explain this\"' or 'vibe-tools repo \"explain this\"')"
      ),
    directory: z
      .string()
      .describe(
        "Mandatory. The absolute path to the local directory you are currently working in. This is required to ensure the command runs in the correct project context."
      ),
  },
  handler: async ({
    command,
    directory,
  }: {
    command: string;
    directory?: string;
  }) => {
    let finalCommand = command.trim();

    // Normalize command: prepend 'vibe-tools' if not present and command is not empty
    if (!finalCommand.startsWith("vibe-tools ") && finalCommand) {
      finalCommand = `vibe-tools ${finalCommand}`;
    }

    // Validate that it's a non-empty vibe-tools command
    if (
      !finalCommand.startsWith("vibe-tools ") ||
      finalCommand === "vibe-tools"
    ) {
      console.error(
        "Invalid command format. Must be a vibe-tools command:",
        command
      );
      return {
        content: [
          {
            type: "text",
            text: "Error: Command must be a valid vibe-tools command.",
          },
        ],
        error: {
          type: "invalid_request",
          message: "Command must be a valid vibe-tools command.",
        },
      };
    }
    return executeVibeToolsCommand(finalCommand, directory);
  },
};

import { z } from "zod";
import { escapeShellArg, executeVibeToolsCommand } from "./helpers.js";

// Common browser options schema - shared across all browser subcommands
const commonBrowserOptionsSchema = {
  console: z
    .boolean()
    .optional()
    .describe("Capture browser console logs (enabled by default)"),
  html: z
    .boolean()
    .optional()
    .describe("Capture page HTML content (disabled by default)"),
  network: z
    .boolean()
    .optional()
    .describe("Capture network activity (enabled by default)"),
  screenshot: z
    .string()
    .optional()
    .describe("Save a screenshot of the page to the specified file path"),
  timeout: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Set navigation timeout in milliseconds (default: 120000ms)"),
  viewport: z
    .string()
    .optional()
    .describe("Set viewport size (e.g., '1280x720')"),
  headless: z
    .boolean()
    .optional()
    .describe("Run browser in headless mode (default: true)"),
  no_headless: z
    .boolean()
    .optional()
    .describe("Show browser UI (non-headless mode) for debugging"),
  connect_to: z
    .string()
    .optional()
    .describe(
      "Connect to existing Chrome instance. Special values: 'current', 'reload-current'"
    ),
  wait: z
    .string()
    .optional()
    .describe("Wait after page load (e.g., 'time:5s', 'selector:#element-id')"),
  video: z
    .string()
    .optional()
    .describe("Save a video recording to the specified directory"),
  evaluate: z
    .string()
    .optional()
    .describe(
      "JavaScript code to execute in the browser before the main command"
    ),
  directory: z
    .string()
    .describe(
      "Mandatory. The absolute path to the local directory you are currently working in. This is required to ensure the command runs in the correct project context."
    ),
};

// Schema for the browser tool, with mode-specific parameters
const browserSchema = {
  mode: z
    .enum(["open", "act", "observe", "extract"])
    .describe("The browser mode/subcommand to execute"),
  url: z
    .string()
    .describe(
      "URL to navigate to, or 'current' to use existing page, or 'reload-current' to refresh existing page"
    ),
  instruction: z
    .string()
    .optional()
    .describe(
      "Natural language instruction for 'act', 'observe', or 'extract' modes"
    ),
  ...commonBrowserOptionsSchema,
};

// Helper to handle boolean flags
const handleBooleanFlag = (
  flagName: string,
  value: boolean | undefined,
  cmd: string
): string => {
  if (value === true) return `${cmd} --${flagName}`;
  if (value === false) return `${cmd} --no-${flagName}`;
  return cmd;
};

export const browserTool = {
  name: "browser_automation",
  description:
    "Automate browser operations for testing, data extraction, or interactions with web pages. Supports multiple modes: 'open' (load a page), 'act' (perform actions), 'observe' (identify interactive elements), and 'extract' (get data from a page).",
  schema: browserSchema,
  handler: async (args: z.infer<z.ZodObject<typeof browserSchema>>) => {
    let cmd = "";

    // Build base command depending on the mode
    switch (args.mode) {
      case "open":
        cmd = `vibe-tools browser open ${escapeShellArg(args.url)}`;
        break;
      case "act":
        if (!args.instruction) {
          return {
            content: [
              {
                type: "text",
                text: "Error: instruction is required for 'act' mode",
              },
            ],
            error: {
              type: "tool_execution_error",
              message: "instruction parameter is required for 'act' mode",
            },
          };
        }
        cmd = `vibe-tools browser act ${escapeShellArg(args.instruction)} --url=${escapeShellArg(args.url)}`;
        break;
      case "observe":
        if (!args.instruction) {
          return {
            content: [
              {
                type: "text",
                text: "Error: instruction is required for 'observe' mode",
              },
            ],
            error: {
              type: "tool_execution_error",
              message: "instruction parameter is required for 'observe' mode",
            },
          };
        }
        cmd = `vibe-tools browser observe ${escapeShellArg(args.instruction)} --url=${escapeShellArg(args.url)}`;
        break;
      case "extract":
        if (!args.instruction) {
          return {
            content: [
              {
                type: "text",
                text: "Error: instruction is required for 'extract' mode",
              },
            ],
            error: {
              type: "tool_execution_error",
              message: "instruction parameter is required for 'extract' mode",
            },
          };
        }
        cmd = `vibe-tools browser extract ${escapeShellArg(args.instruction)} --url=${escapeShellArg(args.url)}`;
        break;
    }

    // Add optional parameters
    // Handle boolean flags
    cmd = handleBooleanFlag("console", args.console, cmd);
    cmd = handleBooleanFlag("html", args.html, cmd);
    cmd = handleBooleanFlag("network", args.network, cmd);
    cmd = handleBooleanFlag("headless", args.headless, cmd);

    // Special case for no-headless flag
    if (args.no_headless === true) cmd += " --no-headless";

    // Add other optional parameters
    if (args.screenshot)
      cmd += ` --screenshot=${escapeShellArg(args.screenshot)}`;
    if (args.timeout) cmd += ` --timeout=${args.timeout}`;
    if (args.viewport) cmd += ` --viewport=${escapeShellArg(args.viewport)}`;
    if (args.connect_to)
      cmd += ` --connect-to=${escapeShellArg(args.connect_to)}`;
    if (args.wait) cmd += ` --wait=${escapeShellArg(args.wait)}`;
    if (args.video) cmd += ` --video=${escapeShellArg(args.video)}`;
    if (args.evaluate) cmd += ` --evaluate=${escapeShellArg(args.evaluate)}`;

    return executeVibeToolsCommand(cmd, args.directory);
  },
};

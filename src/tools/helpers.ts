import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Escapes double quotes in a string for safe use as a shell argument.
 */
export function escapeShellArg(arg: string): string {
  // Basic escaping: wrap in quotes and escape internal quotes
  return `"${arg.replace(/"/g, '\\"')}"`;
}

/**
 * Executes a given vibe-tools command string in an optional directory.
 * Handles CWD, timeout, stdout/stderr, and error reporting.
 */
export async function executeVibeToolsCommand(
  commandString: string,
  directory?: string
) {
  const execOptions: { cwd?: string; timeout: number } = {
    // Increased timeout for potentially longer commands like plan/doc (5 min)
    timeout: 300000,
  };

  const currentDir = process.cwd();

  if (directory) {
    execOptions.cwd = directory;
    console.error(`Executing: ${commandString} in directory: ${directory}`);
  } else {
    console.error(`Executing: ${commandString} in default CWD: ${currentDir}`);
  }

  try {
    // Add debug prefix command to show directory info in actual output
    const debugPrefix = `echo "DEBUG INFO - Executing from: ${directory || currentDir}" && `;
    const { stdout, stderr } = await execAsync(
      debugPrefix + commandString,
      execOptions
    );
    console.error("Command execution finished.");
    // Combine stdout and stderr for clarity
    const outputText = `stdout:\n${stdout || "(No stdout)"}\n\nstderr:\n${stderr || "(No stderr)"}`;
    return {
      // Ensure the returned content conforms to TextContent[]
      content: [{ type: "text", text: outputText }],
    };
  } catch (error: any) {
    console.error("Error executing command:", error);
    const errorMessage =
      error.stderr ||
      error.stdout ||
      error.message ||
      "Unknown error executing command";
    return {
      content: [
        {
          type: "text",
          text: `Failed to execute command: ${errorMessage}\nProcess directory: ${directory || currentDir}`,
        },
      ],
      error: {
        type: "tool_execution_error",
        message: `Execution failed: ${errorMessage}`,
      },
    };
  }
}

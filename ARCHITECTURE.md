# Vibe Tools MCP Server Architecture

## 1. Overview

The `vibe-tools-mcp` server acts as a bridge, exposing the functionalities of the `vibe-tools` command-line interface (CLI) via the Model Context Protocol (MCP). This allows AI assistants or other systems that communicate using MCP to programmatically utilize the various capabilities provided by `vibe-tools`.

The server is built using Node.js and TypeScript, leveraging the `@modelcontextprotocol/sdk` for MCP communication.

## 2. Core Components

The project is structured as follows:

- **`src/index.ts`**:

  - The main entry point for the server application.
  - Initializes the `McpServer` instance from the MCP SDK.
  - Imports all tool definitions from `src/tools/index.ts`.
  - Registers each imported tool with the MCP server.
  - Establishes a connection using `StdioServerTransport` for communication over standard input/output.

- **`src/tools/` (Directory)**:

  - This directory houses the individual implementations for each `vibe-tools` command exposed as an MCP tool.
  - Each tool is typically defined in its own TypeScript file (e.g., `repoTool.ts`, `webTool.ts`).

- **`src/tools/index.ts`**:

  - Acts as an aggregator for all tool definitions.
  - It imports each individual tool module from the `src/tools/` directory.
  - Exports a single array named `allTools` which contains all the tool definition objects. This array is then consumed by `src/index.ts` for registration.

- **`src/tools/helpers.ts`**:
  - A utility module containing helper functions shared across different tool implementations.
  - **`escapeShellArg(arg: string): string`**: Escapes double quotes in a string to ensure it can be safely used as a shell argument, preventing command injection vulnerabilities.
  - **`executeVibeToolsCommand(commandString: string, directory?: string): Promise<object>`**:
    - The core function responsible for executing the `vibe-tools` CLI commands.
    - Uses Node.js `child_process.exec` (promisified as `execAsync`).
    - Sets the current working directory (`cwd`) for the command execution if a `directory` argument is provided. This is crucial for commands that operate in the context of a specific project directory.
    - Sets a timeout for command execution.
    - Captures `stdout` and `stderr` from the executed command.
    - Formats the output (or error) into a structured object suitable for the MCP response, including a `content` array of text objects and an optional `error` object.

## 3. Tool Implementation Pattern

Each tool exposed by the MCP server follows a consistent implementation pattern:

1.  **Dedicated File**: Each tool logic is encapsulated in its own file within `src/tools/` (e.g., `askTool.ts`).
2.  **Schema Definition**:
    - Uses the `zod` library to define a schema for the tool's input parameters.
    - The schema strictly defines the expected data types, optionality, and descriptions for each parameter. These parameters directly correspond to the arguments and options of the underlying `vibe-tools` CLI command.
    - Parameter descriptions are important for MCP clients to understand how to use the tool.
3.  **Tool Object Export**: Each tool file exports a constant object (e.g., `askTool`) with the following properties:
    - `name: string`: The name by which the tool is identified in the MCP.
    - `description: string`: A human-readable description of what the tool does, its purpose, and when to use it.
    - `schema: object`: The Zod schema object defined for its parameters.
    - `handler: async (args: z.infer<typeof schema>) => Promise<object>`: An asynchronous function that implements the tool's logic.
      - It receives an `args` object containing the validated parameters, typed according to the Zod schema.
      - It dynamically constructs the `vibe-tools` CLI command string based on the received arguments.
      - String arguments are escaped using `escapeShellArg` before being appended to the command string.
      - Optional arguments are conditionally added to the command string.
      - It calls `executeVibeToolsCommand`, passing the constructed command string and, if required by the tool (e.g., for `repo`, `plan`), the `directory` argument from the input.
      - It returns the structured response object from `executeVibeToolsCommand`.

## 4. Registered Tools

The following tools are currently implemented and registered with the MCP server:

- **`repo`** (`repoTool.ts`)

  - **Purpose**: Ask questions about a code repository using context-aware analysis.
  - **Key Parameters**: `query` (string), `directory` (string, mandatory), `provider` (string, optional), `model` (string, optional), `maxTokens` (number, optional), `fromGithub` (string, optional), `subdir` (string, optional), `withDoc` (array of strings, optional).

- **`command`** (`commandTool.ts`)

  - **Purpose**: Executes any supported `vibe-tools` AI command with specified options in a directory. Provides a general interface.
  - **Key Parameters**: `command` (string, the full command to run), `directory` (string, mandatory).

- **`ask`** (`askTool.ts`)

  - **Purpose**: Ask a question directly to an AI model (without repository context by default).
  - **Key Parameters**: `query` (string), `provider` (string, optional), `model` (string, optional), `reasoningEffort` (enum, optional), `withDoc` (array of strings, optional).

- **`plan`** (`planTool.ts`)

  - **Purpose**: Generate a focused implementation plan for code changes or features.
  - **Key Parameters**: `query` (string), `directory` (string, mandatory), `fileProvider` (string, optional), `thinkingProvider` (string, optional), `fileModel` (string, optional), `thinkingModel` (string, optional), `withDoc` (array of strings, optional).

- **`doc`** (`docTool.ts`)

  - **Purpose**: Generate comprehensive documentation for a code repository.
  - **Key Parameters**: `directory` (string, mandatory), `output` (string, optional), `provider` (string, optional), `model` (string, optional), `maxTokens` (number, optional), `fromGithub` (string, optional), `withDoc` (array of strings, optional).

- **`github`** (`githubTool.ts`)

  - **Purpose**: Get information about GitHub Pull Requests or Issues.
  - **Key Parameters**: `subcommand` (enum: "pr" | "issue"), `directory` (string, mandatory), `number` (number, optional), `fromGithub` (string, optional).

- **`web_search`** (`webTool.ts`)

  - **Purpose**: Search the web for real-time information.
  - **Key Parameters**: `search_term` (string), `provider` (string, optional).

- **`youtube_analysis`** (`youtubeTool.ts`)

  - **Purpose**: Analyze YouTube videos (summaries, transcripts, plans, etc.).
  - **Key Parameters**: `youtube_url` (string), `directory` (string, mandatory), `question` (string, optional), `analysis_type` (enum, optional).

- **`browser_automation`** (`browserTool.ts`)
  - **Purpose**: Automate browser operations (testing, data extraction).
  - **Modes**: `open`, `act`, `observe`, `extract` (selected via `mode` parameter).
  - **Key Parameters**: `mode` (enum), `url` (string), `directory` (string, mandatory), `instruction` (string, optional, for act/observe/extract), and various browser control options (`console`, `html`, `screenshot`, `headless`, etc.).

- **`mcp`** (`mcpTool.ts`)
  - **Purpose**: Interact with MCP servers through the vibe-tools interface.
  - **Key Parameters**: `subcommand` (enum: "run" | "search"), `query` (string), `directory` (string, mandatory), `provider` (string, optional).
  - **Subcommands**: 
    - `run`: Execute MCP server tools using natural language queries
    - `search`: Search the MCP Marketplace for available servers

## 5. Workflow

1.  An MCP client (e.g., an AI assistant) sends a tool invocation request to the `vibe-tools-mcp` server via the established transport (Stdio).
2.  The `McpServer` instance receives the request, identifies the target tool by its name, and validates the provided parameters against the tool's Zod schema.
3.  If validation is successful, the server calls the tool's `handler` function with the validated arguments.
4.  The `handler` constructs the appropriate `vibe-tools` CLI command string.
5.  `executeVibeToolsCommand` is invoked, which runs the CLI command as a child process.
6.  The output (`stdout`, `stderr`) or any execution error from the CLI command is captured.
7.  The `handler` returns a structured response object (containing the output or error information) to the `McpServer`.
8.  The `McpServer` sends this response back to the MCP client.

## 6. Error Handling

- Parameter validation errors are caught by the MCP SDK using the Zod schemas and reported back to the client.
- Errors during the execution of the `vibe-tools` CLI command (e.g., command not found, CLI-specific errors) are caught by `executeVibeToolsCommand`. These are captured from `stderr` or the error object from `execAsync` and included in the `error` field of the MCP response.
- The `executeVibeToolsCommand` also includes a `DEBUG INFO` line in its output indicating the execution directory, which can help in diagnosing issues.

This architecture provides a robust and extensible way to expose `vibe-tools` functionalities over MCP, ensuring type safety for parameters and clear separation of concerns between MCP interfacing and CLI command execution.

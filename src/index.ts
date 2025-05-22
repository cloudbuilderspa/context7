import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { searchLibraries, fetchLibraryDocumentation } from "./lib/api.js";
import { formatSearchResults } from "./lib/utils.js";
import dotenv from "dotenv";
import express from "express";
// Import Express types
import type { Request, Response } from "express";

// Load environment variables from .env file if present
dotenv.config();

// Environment variable configuration
const DEFAULT_PORT = 3000;
const PORT = getEnvVariableAsNumber('PORT', DEFAULT_PORT);
const DEFAULT_MINIMUM_TOKENS = getEnvVariableAsNumber('DEFAULT_MINIMUM_TOKENS', 10000);

// Helper function to safely parse and validate numeric environment variables
interface ToolResponseContent {
  type: "text" | "resource";
  text?: string;
  resource?: { text: string, uri: string };
}

interface ToolResponseType {
  content: ToolResponseContent[];
}

interface ResolveLibraryParams {
  libraryName: string;
}

interface GetLibraryDocsParams {
  context7CompatibleLibraryID: string;
  tokens?: number;
  topic?: string;
}

function getEnvVariableAsNumber(variableName: string, defaultValue: number): number {
  if (process.env[variableName]) {
    const parsedValue = parseInt(process.env[variableName], 10);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      return parsedValue;
    } else {
      console.warn(
        `Warning: Invalid ${variableName} value provided in environment variable. Using default value of ${defaultValue}`
      );
    }
  }
  return defaultValue;
}

// Create server instance
const server = new McpServer({
  name: "Context7",
  description: "Retrieves up-to-date documentation and code examples for any library.",
  version: "1.0.6",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Register Context7 tools
server.tool(
  "resolve-library-id",
  `Resolves a package name to a Context7-compatible library ID and returns a list of matching libraries.

You MUST call this function before 'get-library-docs' to obtain a valid Context7-compatible library ID.

When selecting the best match, consider:
- Name similarity to the query
- Description relevance
- Code Snippet count (documentation coverage)
- GitHub Stars (popularity)

Return the selected library ID and explain your choice. If there are multiple good matches, mention this but proceed with the most relevant one.`,
  {
    libraryName: z.string()
      .describe("Library name to search for and retrieve a Context7-compatible library ID."),
  },
  async (args: ResolveLibraryParams): Promise<{ content: ({ type: "text", text: string } | { type: "resource", resource: { text: string, uri: string } })[] }> => {
    const searchResponse = await searchLibraries(args.libraryName);

    if (!searchResponse || !searchResponse.results) {
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve library documentation data from Context7",
          },
        ],
      };
    }

    if (searchResponse.results.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No documentation libraries available",
          },
        ],
      };
    }

    const resultsText = formatSearchResults(searchResponse);

    return {
      content: [
        {
          type: "text",
          text: `Available Libraries (top matches):

Each result includes:
- Library ID: Context7-compatible identifier (format: /org/repo)
- Name: Library or package name
- Description: Short summary
- Code Snippets: Number of available code examples
- GitHub Stars: Popularity indicator

For best results, select libraries based on name match, popularity (stars), snippet coverage, and relevance to your use case.

---

${resultsText}`,
        },
      ],
    };
  }
);

server.tool(
  "get-library-docs",
  "Fetches up-to-date documentation for a library. You must call 'resolve-library-id' first to obtain the exact Context7-compatible library ID required to use this tool.",
  {
    context7CompatibleLibraryID: z.string()
      .describe(
        "Exact Context7-compatible library ID (e.g., 'mongodb/docs', 'vercel/nextjs') retrieved from 'resolve-library-id'."
      ),
    topic: z
      .string()
      .optional()
      .describe("Topic to focus documentation on (e.g., 'hooks', 'routing')."),
    tokens: z
      .preprocess((val: any) => (typeof val === "string" ? Number(val) : val), z.number())
      .transform((val: number) => (val < DEFAULT_MINIMUM_TOKENS ? DEFAULT_MINIMUM_TOKENS : val))
      .optional()
      .describe(
        `Maximum number of tokens of documentation to retrieve (default: ${DEFAULT_MINIMUM_TOKENS}). Higher values provide more context but consume more tokens.`
      ),
  },
  async (args: GetLibraryDocsParams): Promise<{ content: ({ type: "text", text: string } | { type: "resource", resource: { text: string, uri: string } })[] }> => {
    // Extract folders parameter if present in the ID
    let folders = "";
    let libraryId = args.context7CompatibleLibraryID;

    if (args.context7CompatibleLibraryID.includes("?folders=")) {
      const [id, foldersParam] = args.context7CompatibleLibraryID.split("?folders=");
      libraryId = id;
      folders = foldersParam;
    }

    const documentationText = await fetchLibraryDocumentation(libraryId, {
      tokens: args.tokens,
      topic: args.topic,
      folders,
    });

    if (!documentationText) {
      return {
        content: [
          {
            type: "text",
            text: "Documentation not found or not finalized for this library. This might have happened because you used an invalid Context7-compatible library ID. To get a valid Context7-compatible library ID, use the 'resolve-library-id' with the package name you wish to retrieve documentation for.",
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: documentationText,
        },
      ],
    };
  }
);
// Configure Express with SSE endpoint
function setupExpressWithSSE() {
  const app = express();
  
  // SSE endpoint setup
  app.get('/events', (req: Request, res: Response) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flush the headers to establish the connection

    console.log('Client connected to SSE stream');

    // Send a retry event to the client (e.g., retry after 10 seconds)
    res.write('retry: 10000\n\n');
    
    // Send initial connection message
    res.write('data: {"message": "Connected to MCP SSE Server"}\n\n');
        
    // Keep the connection alive with a heartbeat
    const heartbeatInterval = setInterval(() => {
      // Check if the connection is still open before writing
      if (!res.writableEnded) {
        res.write(':\n\n'); // Comment line as heartbeat
      } else {
        // If not writable, clear interval and log
        clearInterval(heartbeatInterval);
        console.log('SSE heartbeat: Connection was already closed. Interval cleared.');
      }
    }, 30000); // Send heartbeat every 30 seconds
    
    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected from SSE stream');
      clearInterval(heartbeatInterval); // Clear the heartbeat interval
      // Add any other cleanup logic here (e.g., removing listeners from other event sources)
    });

    // Optional: Handle errors on the response stream
    res.on('error', (err) => {
      console.error('Error on SSE response stream:', err);
      clearInterval(heartbeatInterval);
    });
  });
  
  return app;
}

async function main() {
  try {
    // Set up Express with SSE endpoint
    const app = setupExpressWithSSE();
    
    // Configure StreamableHTTPServerTransport (stateless mode)
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    
    // Connect the MCP server to the transport
    await server.connect(transport);

    // Add MCP routes to Express app
    // These routes will delegate to the transport's handleRequest method
    app.all('/mcp', (req: Request, res: Response) => {
      transport.handleRequest(req, res).catch(err => {
        console.error("Error handling MCP request:", err);
        if (!res.headersSent) {
          res.status(500).send("Internal Server Error");
        }
      });
    });
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`MCP SSE server listening at http://localhost:${PORT}/events`);
      console.log(`MCP main endpoint at http://localhost:${PORT}/mcp`);
    });
  } catch (error) {
    console.error('Error starting MCP SSE server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

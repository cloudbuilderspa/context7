declare module '@modelcontextprotocol/sdk/dist/esm/server/http.js' {
  import express from 'express';

  export interface HttpServerTransportConfig {
    expressApp: express.Application;
  }

  export class HttpServerTransport {
    constructor(config: HttpServerTransportConfig);
  }
}

declare module '@modelcontextprotocol/sdk/dist/esm/server/mcp.js' {
  export interface McpServerConfig {
    name: string;
    description: string;
    version: string;
    capabilities: {
      resources: Record<string, any>;
      tools: Record<string, any>;
    };
  }

  export interface ToolContent {
    type: string;
    text: string;
  }

  export interface ToolResponse {
    content: ToolContent[];
  }

  export class McpServer {
    constructor(config: McpServerConfig);
    
    tool<T extends Record<string, any>>(
      name: string,
      description: string,
      schema: Record<string, any>,
      handler: (params: T) => Promise<ToolResponse>
    ): void;
    
    connect(transport: any): Promise<void>;
  }
}


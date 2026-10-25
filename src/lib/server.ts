import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SearchConsoleService } from './gsc/client.js';
import { findTool, listToolDescriptors } from './tools/index.js';

/**
 * Servidor MCP puro: no conoce process.env, ni Hono, ni el transporte.
 * Recibe las credenciales resueltas y expone el registro de herramientas.
 * Los entrypoints (stdio, HTTP/Node, Cloudflare Worker) son adaptadores finos.
 */
export function createServer(credentials: string): Server {
  if (!credentials?.trim()) {
    throw new Error('No credentials provided. Pass a JSON service-account string or a key-file path to createServer().');
  }

  const searchConsole = new SearchConsoleService(credentials);

  const server = new Server(
    {
      name: 'mcp-server-gsc',
      version: '1.0.1',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: listToolDescriptors(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const tool = findTool(request.params.name);
      if (!tool) {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }
      if (!request.params.arguments) {
        throw new Error('Arguments are required');
      }

      const args = tool.schema.parse(request.params.arguments);
      const result = await tool.handler(args as never, { service: searchConsole });
      return result as unknown as Record<string, unknown>;
    } catch (error) {
      console.error(error);
      const message =
        error instanceof z.ZodError
          ? `Invalid arguments: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
          : error instanceof Error
            ? error.message
            : String(error);
      // El SDK exige su tipo ServerResult; la forma { content, isError } es válida en runtime.
      return { content: [{ type: 'text', text: message }], isError: true } as unknown as Record<string, unknown>;
    }
  });

  return server;
}

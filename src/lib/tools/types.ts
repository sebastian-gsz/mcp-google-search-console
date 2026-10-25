import type { z } from 'zod';
import type { SearchConsoleService } from '../gsc/client.js';

/**
 * Contrato de una herramienta MCP del servidor.
 *
 * Cada herramienta es un módulo independiente que declara su esquema Zod y su
 * manejador. El registro (index.ts) las agrega, y el servidor MCP las expone;
 * así una auditoría puede revisar herramienta por herramienta.
 */
export interface ToolContext {
  service: SearchConsoleService;
}

export interface ToolResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

export interface ToolDefinition<S extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  schema: z.ZodTypeAny;
  // Firma de método (bivariante) para que ToolDefinition<S> sea assignable
  // a ToolDefinition<ZodTypeAny> en el registro.
  handler(args: z.infer<S>, ctx: ToolContext): Promise<ToolResult> | ToolResult;
}

export function textResult(data: unknown): ToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

export function errorResult(message: string): ToolResult {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

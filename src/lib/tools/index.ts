import { z } from 'zod';
import { enhancedSearchAnalyticsTool, searchAnalyticsTool } from './search-analytics.js';
import { detectQuickWinsTool } from './quick-wins.js';
import { comparePeriodsTool } from './compare-periods.js';
import { detectCannibalizationTool } from './detect-cannibalization.js';
import { batchIndexInspectionTool } from './batch-inspection.js';
import {
  addSiteTool,
  deleteSiteTool,
  getSitemapTool,
  getSiteTool,
  indexInspectTool,
  listSitesTool,
  listSitemapsTool,
  submitSitemapTool,
  deleteSitemapTool,
} from './sites-and-sitemaps.js';
import type { ToolDefinition } from './types.js';

/**
 * Registro de herramientas del servidor MCP.
 *
 * Para auditar o extender el servidor: cada herramienta es un archivo en
 * src/lib/tools/, declara su esquema Zod y su manejador, y se agrega aquí.
 * El servidor MCP (lib/server.ts) solo itera este registro.
 */
const TOOLS: ToolDefinition[] = [
  listSitesTool,
  getSiteTool,
  addSiteTool,
  deleteSiteTool,
  searchAnalyticsTool,
  enhancedSearchAnalyticsTool,
  detectQuickWinsTool,
  comparePeriodsTool,
  detectCannibalizationTool,
  indexInspectTool,
  batchIndexInspectionTool,
  listSitemapsTool,
  getSitemapTool,
  submitSitemapTool,
  deleteSitemapTool,
];

export function listToolDescriptors() {
  return TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    // JSON Schema nativo de zod 4 (sustituye al paquete zod-to-json-schema, ligado a zod 3).
    inputSchema: z.toJSONSchema(tool.schema),
  }));
}

export function findTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.name === name);
}

export type { ToolDefinition } from './types.js';

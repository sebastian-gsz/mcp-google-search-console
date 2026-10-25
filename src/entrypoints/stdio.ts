#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from '../lib/server.js';
import { resolveCredentials } from '../lib/config.js';

/**
 * Adaptador stdio: el modo clásico de MCP para clientes de escritorio.
 * Solo resuelve credenciales del entorno y conecta el transporte.
 */
async function runServer() {
  const credentials = resolveCredentials();
  if (!credentials) {
    throw new Error(
      'No credentials provided. Set GOOGLE_JSON_KEY or GOOGLE_APPLICATION_CREDENTIALS, or place a credentials.json in the working directory.',
    );
  }
  const server = createServer(credentials);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Servidor MCP de Google Search Console ejecutándose en stdio');
}

runServer().catch((error) => {
  console.error('Error fatal en main():', error);
  process.exit(1);
});

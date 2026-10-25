import { serve } from '@hono/node-server';
import { createApp } from '../lib/app.js';
import { resolveCredentials } from '../lib/config.js';

/**
 * Adaptador HTTP para Node.js (Docker, Code Engine, VMs...).
 * Mapea variables de entorno a la app neutra y la sirve con node-server.
 */
const credentials = resolveCredentials();
if (!credentials) {
  console.error(
    'No credentials provided. Set GOOGLE_JSON_KEY or GOOGLE_APPLICATION_CREDENTIALS, or place a credentials.json in the working directory.',
  );
  process.exit(1);
}

const app = createApp({
  credentials,
  apiToken: process.env.MCP_API_TOKEN,
  corsOrigin: process.env.CORS_ORIGIN,
});

const port = parseInt(process.env.PORT || '8080', 10);

console.error(`Iniciando el servidor MCP de Google Search Console (HTTP/SSE) en el puerto ${port}...`);
console.error('Las credenciales se cargan desde GOOGLE_JSON_KEY o GOOGLE_APPLICATION_CREDENTIALS.');

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.error(`El servidor se está ejecutando en http://localhost:${info.port}`);
  },
);

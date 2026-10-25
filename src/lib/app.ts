import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { bearerAuth } from 'hono/bearer-auth';
import { StreamableHTTPTransport } from '@hono/mcp';
import { createServer } from './server.js';

/**
 * Aplicación HTTP neutra: no lee process.env ni bindings de ninguna plataforma.
 *
 * Cualquier proveedor (Node, Cloudflare Workers, Docker, Code Engine...) crea
 * esta app pasando su configuración explícitamente y la sirve con su runtime
 * preferido (`@hono/node-server`, `app.fetch` de Workers, etc.).
 */
export interface AppOptions {
  /** Service account de Google: cadena JSON o ruta a archivo de claves. */
  credentials: string;
  /** Token exigido como Bearer en /mcp. Si falta, el endpoint se niega. */
  apiToken?: string;
  /** Origen permitido por CORS; por defecto '*'. */
  corsOrigin?: string;
}

export function createApp(options: AppOptions) {
  const app = new Hono();

  app.use('/mcp', async (c, next) => {
    return cors({ origin: options.corsOrigin || '*' })(c, next);
  });

  // El endpoint /mcp expone acceso a Search Console: sin token se niega el acceso.
  app.use('/mcp', async (c, next) => {
    if (!options.apiToken) {
      return c.json(
        { error: 'MCP_API_TOKEN no está configurado. Defínalo para proteger este endpoint.' },
        503,
      );
    }
    return bearerAuth({ token: options.apiToken })(c, next);
  });

  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.all('/mcp', async (c) => {
    try {
      const server = createServer(options.credentials);
      const transport = new StreamableHTTPTransport({ sessionIdGenerator: undefined });

      transport.onclose = () => {
        server.close().catch(() => {});
      };

      await server.connect(transport);
      return transport.handleRequest(c);
    } catch (error) {
      console.error('Error al crear el servidor:', error);
      return c.json(
        {
          error: 'Error al inicializar el servidor. Compruebe la configuración de las credenciales.',
          details: error instanceof Error ? error.message : 'Error desconocido',
        },
        500,
      );
    }
  });

  return app;
}

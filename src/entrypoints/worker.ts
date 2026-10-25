import { createApp } from '../lib/app.js';

/**
 * Adaptador para Cloudflare Workers: mapea los bindings del Worker a la
 * app neutra en cada petición. process.env no existe en Workers, por lo
 * que la configuración llega vía c.env.
 */
type Bindings = {
  /** Service account de Google como cadena JSON. */
  GOOGLE_CREDENTIALS: string;
  MCP_API_TOKEN: string;
  CORS_ORIGIN?: string;
};

export default {
  fetch(request: Request, env: Bindings) {
    const app = createApp({
      credentials: env.GOOGLE_CREDENTIALS || '',
      apiToken: env.MCP_API_TOKEN,
      corsOrigin: env.CORS_ORIGIN,
    });
    return app.fetch(request);
  },
};

export type { Bindings };

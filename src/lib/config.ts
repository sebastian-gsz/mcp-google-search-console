import fs from 'node:fs';
import path from 'node:path';

/**
 * Resolución de credenciales para entornos con process.env (Node local, Docker,
 * Code Engine...). Los entornos sin filesystem (Cloudflare Workers) inyectan
 * las credenciales directamente vía bindings y no usan este módulo.
 *
 * Orden de precedencia:
 * 1. GOOGLE_JSON_KEY: la service account como cadena JSON (contenedores).
 * 2. GOOGLE_APPLICATION_CREDENTIALS: ruta a un archivo de credenciales.
 * 3. credentials.json en el directorio de trabajo (desarrollo local).
 */
export function resolveCredentials(): string | null {
  const jsonKey = process.env.GOOGLE_JSON_KEY;
  if (jsonKey && jsonKey.trimStart().startsWith('{')) {
    try {
      JSON.parse(jsonKey);
      return jsonKey;
    } catch {
      throw new Error('GOOGLE_JSON_KEY La variable de entorno contiene JSON no válido.');
    }
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    return credPath;
  }

  const localPath = path.join(process.cwd(), 'credentials.json');
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  return null;
}

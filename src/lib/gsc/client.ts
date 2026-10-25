import { google, searchconsole_v1 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

type SearchanalyticsQueryRequest =
  searchconsole_v1.Params$Resource$Searchanalytics$Query['requestBody'];
type ListSitemapsRequest = searchconsole_v1.Params$Resource$Sitemaps$List;
type GetSitemapRequest = searchconsole_v1.Params$Resource$Sitemaps$Get;
type SubmitSitemapRequest = searchconsole_v1.Params$Resource$Sitemaps$Submit;
type IndexInspectRequest =
  searchconsole_v1.Params$Resource$Urlinspection$Index$Inspect['requestBody'];

/**
 * Capa de acceso a la API de Google Search Console.
 *
 * Es el único módulo que conoce googleapis/google-auth-library: las herramientas
 * y el servidor MCP trabajan contra esta clase, lo que permite auditar o
 * sustituir el transporte sin tocar la lógica de negocio.
 */
export class SearchConsoleService {
  private auth: GoogleAuth;
  private client?: searchconsole_v1.Searchconsole;

  constructor(credentials: string) {
    const isJsonString = credentials.trimStart().startsWith('{');
    if (isJsonString) {
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(credentials);
      } catch {
        throw new Error('Credenciales no válidas: error al analizar JSON');
      }
      // Scope completo: el servidor expone herramientas de escritura
      // (submit/delete sitemap, add/delete site) además de las de lectura.
      this.auth = new google.auth.GoogleAuth({
        credentials: parsed,
        scopes: ['https://www.googleapis.com/auth/webmasters'],
      });
    } else {
      this.auth = new google.auth.GoogleAuth({
        keyFile: credentials,
        scopes: ['https://www.googleapis.com/auth/webmasters'],
      });
    }
  }

  private async getClient(): Promise<searchconsole_v1.Searchconsole> {
    if (!this.client) {
      const authClient = await this.auth.getClient();
      this.client = new searchconsole_v1.Searchconsole({
        auth: authClient as any,
      });
    }
    return this.client;
  }

  /**
   * Convierte la entrada del usuario en un siteUrl válido:
   * - "sc-domain:example.com" se respeta tal cual (propiedad de dominio).
   * - URLs con protocolo (http/https) se respetan tal cual (propiedad URL-prefix).
   * - Dominios pelados ("example.com") se convierten en propiedad URL-prefix.
   */
  private normalizeUrl(url: string): string {
    if (url.startsWith('sc-domain:')) {
      return url;
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return `https://${url}/`;
  }

  /**
   * Ejecuta la operación con el siteUrl dado y, si falla por permisos y la
   * forma normalizada difiere (p. ej. dominio pelado), reintenta normalizado.
   */
  private async withSiteUrlFallback<T>(
    siteUrl: string,
    operation: (siteUrl: string) => Promise<T>,
  ): Promise<T> {
    try {
      return await operation(siteUrl);
    } catch (err) {
      const normalized = this.normalizeUrl(siteUrl);
      if (
        normalized !== siteUrl &&
        err instanceof Error &&
        err.message.toLowerCase().includes('permission')
      ) {
        return operation(normalized);
      }
      throw err;
    }
  }

  /**
   * searchanalytics.query con paginación automática: la API devuelve como
   * máximo 25 000 filas por llamada, así que rowLimit mayores se obtienen
   * encadenando startRow hasta agotar resultados o alcanzar el límite.
   */
  async searchAnalytics(
    siteUrl: string,
    requestBody: SearchanalyticsQueryRequest,
  ): Promise<{ data: { rows?: any[] } }> {
    if (!requestBody) {
      throw new Error('Request body is required');
    }
    const resolved = await this.withSiteUrlFallback(siteUrl, (site) =>
      this.getClient().then((client) =>
        client.searchanalytics.query({ siteUrl: site, requestBody }),
      ),
    );

    const requestedLimit = requestBody.rowLimit ?? 1000;
    const rows = [...(resolved.data.rows ?? [])];

    // 25 000 es el máximo por llamada de la API.
    while (
      rows.length < requestedLimit &&
      rows.length > 0 &&
      rows.length % 25000 === 0
    ) {
      const startRow = rows.length;
      const page = await this.withSiteUrlFallback(siteUrl, (site) =>
        this.getClient().then((client) =>
          client.searchanalytics.query({
            siteUrl: site,
            requestBody: {
              ...requestBody,
              startRow,
              rowLimit: Math.min(25000, requestedLimit - startRow),
            },
          }),
        ),
      );
      const pageRows = page.data.rows ?? [];
      if (pageRows.length === 0) break;
      rows.push(...pageRows);
    }

    return { data: { rows: rows.slice(0, requestedLimit) } };
  }

  /**
   * Análisis de búsqueda mejorado: filtra por regex sobre la dimensión query
   * (se añade automáticamente si no está presente, requisito de la API) y
   * opcionalmente adjunta detección de quick wins.
   */
  async enhancedSearchAnalytics(
    siteUrl: string,
    requestBody: SearchanalyticsQueryRequest,
    options: {
      regexFilter?: string;
      enableQuickWins?: boolean;
      quickWinsThresholds?: {
        minImpressions?: number;
        maxCtr?: number;
        positionRangeMin?: number;
        positionRangeMax?: number;
      };
    } = {},
  ) {
    if (!requestBody) {
      throw new Error('Request body is required');
    }

    if (options.regexFilter) {
      const dimensions = requestBody.dimensions ? [...requestBody.dimensions] : [];
      if (!dimensions.includes('query')) {
        dimensions.push('query');
      }
      requestBody.dimensions = dimensions;
      requestBody.dimensionFilterGroups = [
        ...(requestBody.dimensionFilterGroups || []),
        {
          groupType: 'and',
          filters: [
            {
              dimension: 'query',
              operator: 'includingRegex',
              expression: options.regexFilter,
            },
          ],
        },
      ];
    }

    const result = await this.searchAnalytics(siteUrl, requestBody);

    if (options.enableQuickWins && result.data.rows) {
      const quickWins = detectQuickWins(result.data.rows, options.quickWinsThresholds);
      return {
        ...result,
        data: {
          ...result.data,
          quickWins,
          enhancedFeatures: {
            regexFilterApplied: !!options.regexFilter,
            quickWinsEnabled: true,
            rowLimit: requestBody.rowLimit || 1000,
          },
        },
      };
    }

    return result;
  }

  async listSites() {
    const client = await this.getClient();
    return client.sites.list();
  }

  async listSitemaps(request: ListSitemapsRequest) {
    return this.withSiteUrlFallback(request.siteUrl!, (siteUrl) =>
      this.getClient().then((client) => client.sitemaps.list({ ...request, siteUrl })),
    );
  }

  async getSitemap(request: GetSitemapRequest) {
    return this.withSiteUrlFallback(request.siteUrl!, (siteUrl) =>
      this.getClient().then((client) => client.sitemaps.get({ ...request, siteUrl })),
    );
  }

  async submitSitemap(request: SubmitSitemapRequest) {
    return this.withSiteUrlFallback(request.siteUrl!, (siteUrl) =>
      this.getClient().then((client) => client.sitemaps.submit({ ...request, siteUrl })),
    );
  }

  async deleteSitemap(request: GetSitemapRequest) {
    return this.withSiteUrlFallback(request.siteUrl!, (siteUrl) =>
      this.getClient().then((client) => client.sitemaps.delete({ ...request, siteUrl })),
    );
  }

  async addSite(siteUrl: string) {
    return this.withSiteUrlFallback(siteUrl, (site) =>
      this.getClient().then((client) => client.sites.add({ siteUrl: site })),
    );
  }

  async deleteSite(siteUrl: string) {
    return this.getClient().then((client) => client.sites.delete({ siteUrl }));
  }

  async getSite(siteUrl: string) {
    return this.withSiteUrlFallback(siteUrl, (site) =>
      this.getClient().then((client) => client.sites.get({ siteUrl: site })),
    );
  }

  async indexInspect(requestBody: IndexInspectRequest) {
    const client = await this.getClient();
    return client.urlInspection.index.inspect({ requestBody });
  }
}

export type { SearchanalyticsQueryRequest };

/**
 * Detección de quick wins: filas con impresiones suficientes, CTR bajo y
 * posición media (4-10 por defecto), ordenadas por clics potenciales.
 *
 * Función pura: no depende del cliente ni de googleapis, fácil de auditar.
 */
export function detectQuickWins(
  rows: any[],
  thresholds: {
    minImpressions?: number;
    maxCtr?: number;
    positionRangeMin?: number;
    positionRangeMax?: number;
  } = {},
) {
  const {
    minImpressions = 50,
    maxCtr = 2.0,
    positionRangeMin = 4,
    positionRangeMax = 10,
  } = thresholds;

  return rows
    .filter((row) => {
      const impressions = row.impressions || 0;
      const ctr = (row.ctr || 0) * 100;
      const position = row.position || 0;

      return (
        impressions >= minImpressions &&
        ctr <= maxCtr &&
        position >= positionRangeMin &&
        position <= positionRangeMax
      );
    })
    .map((row) => {
      const impressions = row.impressions || 0;
      const currentClicks = row.clicks || 0;
      const currentCtr = (row.ctr || 0) * 100;
      const position = row.position || 0;

      // Potencial con un CTR objetivo del 5 %.
      const targetCtr = 5.0;
      const potentialClicks = Math.round((impressions * targetCtr) / 100);
      const additionalClicks = Math.max(0, potentialClicks - currentClicks);

      // Gradación: la mejora es "High" cuando recupera al menos la mitad del
      // potencial (o 10+ clics) y "Medium" cuando hay mejora pero parcial.
      const halfPotential = potentialClicks / 2;
      const opportunity =
        additionalClicks >= Math.max(halfPotential, 10)
          ? 'High'
          : additionalClicks > 0
            ? 'Medium'
            : 'Low';

      return {
        query: row.keys?.[0] || 'N/A',
        page: row.keys?.[1] || 'N/A',
        currentPosition: Number(position.toFixed(1)),
        impressions,
        currentClicks,
        currentCtr: Number(currentCtr.toFixed(2)),
        potentialClicks,
        additionalClicks,
        opportunity,
        optimizationNote: `Move from position ${position.toFixed(1)} toward top 3 to approach a 5% CTR`,
      };
    })
    .sort((a, b) => b.additionalClicks - a.additionalClicks);
}

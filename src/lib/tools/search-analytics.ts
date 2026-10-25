import { z } from 'zod';
import {
  SearchAnalyticsSchema,
  EnhancedSearchAnalyticsSchema,
} from '../schemas.js';
import { textResult, type ToolDefinition } from './types.js';
import type { SearchanalyticsQueryRequest } from '../gsc/client.js';

/**
 * Construye el cuerpo de la llamada searchanalytics.query a partir de los
 * argumentos validados. Compartido por las herramientas de analytics para
 * garantizar filtros homogéneos.
 */
export function buildSearchRequestBody(args: {
  startDate: string;
  endDate: string;
  dimensions?: string;
  type?: 'web' | 'image' | 'video' | 'news';
  dataState?: 'all' | 'final';
  aggregationType?: 'auto' | 'byNewsShowcasePanel' | 'byProperty' | 'byPage';
  rowLimit: number;
  pageFilter?: string;
  queryFilter?: string;
  countryFilter?: string;
  deviceFilter?: 'DESKTOP' | 'MOBILE' | 'TABLET';
  filterOperator?: string;
}): SearchanalyticsQueryRequest {
  const requestBody: any = {
    startDate: args.startDate,
    endDate: args.endDate,
    // La API espera un array: el esquema valida la cadena cruda (zod 4 no
    // representa transforms en JSON Schema) y aquí se hace el split.
    dimensions: args.dimensions?.split(',').map((d) => d.trim()),
    searchType: args.type,
    dataState: args.dataState,
    aggregationType: args.aggregationType,
    rowLimit: args.rowLimit,
  };

  const filters = [];
  if (args.pageFilter) {
    filters.push({
      dimension: 'page',
      operator: args.filterOperator,
      expression: args.pageFilter,
    });
  }
  if (args.queryFilter) {
    filters.push({
      dimension: 'query',
      operator: args.filterOperator,
      expression: args.queryFilter,
    });
  }
  if (args.countryFilter) {
    filters.push({
      dimension: 'country',
      // El filtro de país solo admite 'igual a'.
      operator: 'equals',
      expression: args.countryFilter,
    });
  }
  if (args.deviceFilter) {
    filters.push({
      dimension: 'device',
      // El filtro de dispositivos solo admite 'igual a'.
      operator: 'equals',
      expression: args.deviceFilter,
    });
  }

  if (filters.length > 0) {
    requestBody.dimensionFilterGroups = [{ groupType: 'and', filters }];
  }

  return requestBody as SearchanalyticsQueryRequest;
}

export const searchAnalyticsTool: ToolDefinition<typeof SearchAnalyticsSchema> = {
  name: 'search_analytics',
  description: 'Get search performance data from Google Search Console',
  schema: SearchAnalyticsSchema,
  async handler(args, { service }) {
    const response = await service.searchAnalytics(
      args.siteUrl,
      buildSearchRequestBody(args),
    );
    return textResult(response.data);
  },
};

export const enhancedSearchAnalyticsTool: ToolDefinition<typeof EnhancedSearchAnalyticsSchema> = {
  name: 'enhanced_search_analytics',
  description: 'Enhanced search analytics with up to 25,000 rows, regex filters, and quick wins detection',
  schema: EnhancedSearchAnalyticsSchema,
  async handler(args, { service }) {
    const response = await service.enhancedSearchAnalytics(
      args.siteUrl,
      buildSearchRequestBody(args),
      {
        regexFilter: args.regexFilter,
        enableQuickWins: args.enableQuickWins,
        quickWinsThresholds: args.quickWinsThresholds,
      },
    );
    return textResult(response.data);
  },
};

export { z };

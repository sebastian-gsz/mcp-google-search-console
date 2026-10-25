import { z } from 'zod';

/**
 * Esquemas de entrada de las herramientas MCP.
 *
 * Cada herramienta vive en src/lib/tools/ y declara aquí su esquema Zod,
 * de modo que la validación sea auditable en un único módulo.
 */

export const GSCBaseSchema = z.object({
  siteUrl: z
    .string()
    .describe(
      'The site URL as defined in Search Console. Example: sc-domain:example.com (for domain resources) or http://www.example.com/ (for site prefix resources)',
    ),
});

// Estado de los datos: "all" incluye datos frescos de las últimas 24-48 h;
// "final" solo datos consolidados (2-3 días de retraso).
export const DataStateSchema = z
  .enum(['all', 'final'])
  .optional()
  .describe(
    'Data freshness: "all" includes fresh, not yet finalized data (default); "final" returns only finalized data (2-3 day lag)',
  );

export const SearchAnalyticsSchema = GSCBaseSchema.extend({
  startDate: z.string().describe('Start date in YYYY-MM-DD format'),
  endDate: z.string().describe('End date in YYYY-MM-DD format'),
  dimensions: z
    .string()
    // Validación sobre la cadena cruda (zod 4: los transforms no son
    // representables en JSON Schema; el split a array lo hace el consumidor
    // en buildSearchRequestBody).
    .refine(
      (val) =>
        val
          .split(',')
          .map((d) => d.trim())
          .every((d) => ['query', 'page', 'country', 'device', 'date', 'searchAppearance'].includes(d)),
      { message: 'dimensions must be a comma-separated list of: query, page, country, device, date, searchAppearance' },
    )
    .optional()
    .describe(
      'Comma-separated list of dimensions to break down results by, such as query, page, country, device, date, searchAppearance',
    ),
  type: z
    .enum(['web', 'image', 'video', 'news'])
    .optional()
    .describe('Type of search to filter by, such as web, image, video, news'),
  aggregationType: z
    .enum(['auto', 'byNewsShowcasePanel', 'byProperty', 'byPage'])
    .optional()
    .describe('Type of aggregation, such as auto, byNewsShowcasePanel, byProperty, byPage'),
  rowLimit: z.number().min(1).max(25000).default(1000).describe('Maximum number of rows to return (up to 25,000; larger limits are fetched automatically with pagination)'),
  pageFilter: z.string().optional().describe('Filter by a specific page URL. Use with filterOperator.'),
  queryFilter: z.string().optional().describe('Filter by a specific query string. Use with filterOperator.'),
  countryFilter: z.string().optional().describe('Filter by a country using ISO 3166-1 alpha-3 code (e.g., USA, CHN).'),
  deviceFilter: z.enum(['DESKTOP', 'MOBILE', 'TABLET']).optional().describe('Filter by device type.'),
  filterOperator: z
    .enum(['equals', 'contains', 'notEquals', 'notContains', 'includingRegex', 'excludingRegex'])
    .default('equals')
    .optional()
    .describe('Operator for page and query filters. Defaults to "equals". Supports regex operators.'),
  regexFilter: z.string().optional().describe('Advanced regex filter for intelligent query matching (applied to the query dimension)'),
  dataState: DataStateSchema,
});

export const IndexInspectSchema = GSCBaseSchema.extend({
  inspectionUrl: z
    .string()
    .describe(
      'The fully-qualified URL to inspect. Must be under the property specified in "siteUrl"',
    ),
  languageCode: z
    .string()
    .optional()
    .default('en-US')
    .describe(
      'An IETF BCP-47 language code representing the language of the requested translated issue messages, such as "en-US" or "de-CH". Default is "en-US"',
    ),
});

// siteUrl es obligatorio: la API lo exige y el servicio lo usa directamente.
export const ListSitemapsSchema = GSCBaseSchema.extend({
  sitemapIndex: z
    .string()
    .optional()
    .describe(
      "A URL of a site's sitemap index. For example: http://www.example.com/sitemapindex.xml",
    ),
});

export const GetSitemapSchema = GSCBaseSchema.extend({
  feedpath: z
    .string()
    .describe('The URL of the actual sitemap. For example: http://www.example.com/sitemap.xml'),
});

export const SubmitSitemapSchema = GSCBaseSchema.extend({
  feedpath: z
    .string()
    .describe('The URL of the sitemap to add. For example: http://www.example.com/sitemap.xml'),
});

// Esquema de detección de victorias rápidas
export const QuickWinsDetectionSchema = GSCBaseSchema.extend({
  startDate: z.string().describe('Start date in YYYY-MM-DD format'),
  endDate: z.string().describe('End date in YYYY-MM-DD format'),
  dataState: DataStateSchema,
  minImpressions: z.number().default(50).describe('Minimum impressions threshold for quick wins'),
  maxCtr: z.number().default(2.0).describe('Maximum CTR percentage for quick wins detection'),
  positionRangeMin: z.number().default(4).describe('Minimum position for quick wins (default: 4)'),
  positionRangeMax: z.number().default(10).describe('Maximum position for quick wins (default: 10)'),
});

// Enhanced Search Analytics Schema with Quick Wins
export const EnhancedSearchAnalyticsSchema = SearchAnalyticsSchema.extend({
  enableQuickWins: z.boolean().default(false).describe('Enable automatic quick wins detection'),
  quickWinsThresholds: QuickWinsDetectionSchema.pick({
    minImpressions: true,
    maxCtr: true,
    positionRangeMin: true,
    positionRangeMax: true,
  }).optional().describe('Custom thresholds for quick wins detection'),
});

export const QuickWinsThresholdsSchema = QuickWinsDetectionSchema.pick({
  minImpressions: true,
  maxCtr: true,
  positionRangeMin: true,
  positionRangeMax: true,
});

// Comparación de dos periodos de tiempo sobre la misma dimensión.
export const ComparePeriodsSchema = GSCBaseSchema.extend({
  currentStartDate: z.string().describe('Start of the current period in YYYY-MM-DD format'),
  currentEndDate: z.string().describe('End of the current period in YYYY-MM-DD format'),
  previousStartDate: z.string().describe('Start of the previous comparison period in YYYY-MM-DD format'),
  previousEndDate: z.string().describe('End of the previous comparison period in YYYY-MM-DD format'),
  dimension: z
    .enum(['query', 'page'])
    .default('page')
    .describe('Dimension to compare on: "page" or "query"'),
  type: z
    .enum(['web', 'image', 'video', 'news'])
    .optional()
    .describe('Type of search to filter by, such as web, image, video, news'),
  dataState: DataStateSchema,
  rowLimit: z
    .number()
    .min(1)
    .max(25000)
    .default(1000)
    .describe('Maximum number of rows per period (up to 25,000)'),
});

// Detección de canibalización de keywords entre páginas.
export const DetectCannibalizationSchema = GSCBaseSchema.extend({
  startDate: z.string().describe('Start date in YYYY-MM-DD format'),
  endDate: z.string().describe('End date in YYYY-MM-DD format'),
  minImpressions: z
    .number()
    .default(30)
    .describe('Minimum impressions a query needs to be considered (default: 30)'),
  dataState: DataStateSchema,
  maxCompetingPages: z
    .number()
    .min(2)
    .default(2)
    .describe('Flag a query when at least this many pages receive impressions for it (default: 2)'),
  rowLimit: z
    .number()
    .min(1)
    .max(25000)
    .default(25000)
    .describe('Maximum number of rows to analyze (up to 25,000)'),
});

export type SearchAnalytics = z.infer<typeof SearchAnalyticsSchema>;
export type EnhancedSearchAnalytics = z.infer<typeof EnhancedSearchAnalyticsSchema>;
export type QuickWinsDetection = z.infer<typeof QuickWinsDetectionSchema>;
export type QuickWinsThresholds = z.infer<typeof QuickWinsThresholdsSchema>;
export type IndexInspect = z.infer<typeof IndexInspectSchema>;
export type ComparePeriods = z.infer<typeof ComparePeriodsSchema>;
export type DetectCannibalization = z.infer<typeof DetectCannibalizationSchema>;

// Inspección de indexación en lote.
export const BatchIndexInspectionSchema = GSCBaseSchema.extend({
  urls: z
    .string()
    .describe('URLs to inspect, separated by newlines or commas. Must all be under the property specified in "siteUrl"'),
  languageCode: z
    .string()
    .optional()
    .default('en-US')
    .describe('IETF BCP-47 language code for translated issue messages. Default is "en-US"'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(50)
    .describe('Maximum number of URLs to inspect per call. The inspection API has a strict daily quota, keep batches small (default: 50, max: 100)'),
});

export type BatchIndexInspection = z.infer<typeof BatchIndexInspectionSchema>;

// Eliminación de un sitemap de la propiedad.
export const DeleteSitemapSchema = GSCBaseSchema.extend({
  feedpath: z
    .string()
    .describe('The URL of the sitemap to remove. For example: http://www.example.com/sitemap.xml'),
});

// Gestión de propiedades: alta, baja y detalle.
export const AddSiteSchema = z.object({
  siteUrl: z
    .string()
    .describe('The site URL to add, including protocol. For example: http://www.example.com/'),
});

export const DeleteSiteSchema = z.object({
  siteUrl: z
    .string()
    .describe('The site URL to remove from Search Console, exactly as returned by list_sites'),
});

export type DeleteSitemap = z.infer<typeof DeleteSitemapSchema>;

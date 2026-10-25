import { BatchIndexInspectionSchema } from '../schemas.js';
import { textResult, type ToolDefinition } from './types.js';

/**
 * Inspección de indexación en lote.
 *
 * La API de URL Inspection tiene cuota estricta (2 000 consultas/día por
 * propiedad), así que el límite por llamada se acota en el esquema y los
 * errores individuales no interrumpen el lote.
 */
export const batchIndexInspectionTool: ToolDefinition<typeof BatchIndexInspectionSchema> = {
  name: 'batch_index_inspection',
  description:
    'Inspect multiple URLs in one call and summarize index status: how many are indexed, which are not, and the reasons per URL',
  schema: BatchIndexInspectionSchema,
  async handler(args, { service }) {
    const urls = args.urls
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean);

    const uniqueUrls = [...new Set(urls)].slice(0, args.limit);

    const results: {
      url: string;
      verdict: string;
      indexStatus: string;
      coverageState: string;
      canonicalUrl?: string;
      indexingBlockedBy?: string;
      error?: string;
    }[] = [];

    for (const inspectionUrl of uniqueUrls) {
      try {
        const response = await service.indexInspect({
          siteUrl: args.siteUrl,
          inspectionUrl,
          languageCode: args.languageCode,
        });
        const result = (response.data as any)?.inspectionResult;
        if (!result) {
          results.push({
            url: inspectionUrl,
            verdict: 'unknown',
            indexStatus: 'no inspection data',
            coverageState: 'N/A',
          });
          continue;
        }
        const index = result.indexStatusResult ?? {};
        results.push({
          url: inspectionUrl,
          verdict: result.verdict ?? 'unknown',
          indexStatus: index.indexingState ?? 'unknown',
          coverageState: index.coverageState ?? 'N/A',
          canonicalUrl: index.canonical ?? undefined,
          indexingBlockedBy: index.robotsTxtState !== 'ALLOWED' ? `robots.txt: ${index.robotsTxtState}` : undefined,
        });
      } catch (error) {
        results.push({
          url: inspectionUrl,
          verdict: 'error',
          indexStatus: 'error',
          coverageState: 'N/A',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const indexed = results.filter((r) => r.verdict === 'PASS');
    const notIndexed = results.filter((r) => r.verdict === 'NEUTRAL' || r.verdict === 'FAIL');
    const errored = results.filter((r) => r.verdict === 'error');

    return textResult({
      summary: {
        requested: urls.length,
        inspected: results.length,
        indexed: indexed.length,
        notIndexed: notIndexed.length,
        errors: errored.length,
      },
      notIndexedDetails: notIndexed.map((r) => ({
        url: r.url,
        coverageState: r.coverageState,
        indexingBlockedBy: r.indexingBlockedBy,
      })),
      errors: errored.map((r) => ({ url: r.url, error: r.error })),
      results,
    });
  },
};

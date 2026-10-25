import { DetectCannibalizationSchema } from '../schemas.js';
import { detectCannibalization } from '../gsc/analytics.js';
import { textResult, type ToolDefinition } from './types.js';

export const detectCannibalizationTool: ToolDefinition<typeof DetectCannibalizationSchema> = {
  name: 'detect_cannibalization',
  description:
    'Detect keyword cannibalization: queries where two or more pages of the site compete for impressions, signaling internal URL conflicts',
  schema: DetectCannibalizationSchema,
  async handler(args, { service }) {
    const response = await service.searchAnalytics(args.siteUrl, {
      startDate: args.startDate,
      endDate: args.endDate,
      dimensions: ['query', 'page'],
      dataState: args.dataState,
      rowLimit: args.rowLimit,
    });
    const rows = response.data.rows ?? [];

    if (rows.length === 0) {
      return textResult({ message: 'No data available for cannibalization analysis' });
    }

    const cannibalization = detectCannibalization(rows, {
      minImpressions: args.minImpressions,
      maxCompetingPages: args.maxCompetingPages,
    });

    return textResult({
      cannibalizedQueries: cannibalization,
      totalAffectedQueries: cannibalization.length,
      thresholds: {
        minImpressions: args.minImpressions,
        maxCompetingPages: args.maxCompetingPages,
      },
      rowsAnalyzed: rows.length,
    });
  },
};

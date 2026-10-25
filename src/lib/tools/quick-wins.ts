import { QuickWinsDetectionSchema } from '../schemas.js';
import { detectQuickWins } from '../gsc/client.js';
import { textResult, type ToolDefinition } from './types.js';

export const detectQuickWinsTool: ToolDefinition<typeof QuickWinsDetectionSchema> = {
  name: 'detect_quick_wins',
  description: 'Automatically detect SEO quick wins and optimization opportunities',
  schema: QuickWinsDetectionSchema,
  async handler(args, { service }) {
    const response = await service.searchAnalytics(args.siteUrl, {
      startDate: args.startDate,
      endDate: args.endDate,
      dimensions: ['query', 'page'],
      dataState: args.dataState,
      rowLimit: 25000,
    });
    const rows = response.data.rows ?? [];

    if (rows.length === 0) {
      return textResult({ message: 'No data available for quick wins analysis' });
    }

    const thresholds = {
      minImpressions: args.minImpressions,
      maxCtr: args.maxCtr,
      positionRangeMin: args.positionRangeMin,
      positionRangeMax: args.positionRangeMax,
    };
    const quickWins = detectQuickWins(rows, thresholds);

    return textResult({
      quickWins,
      totalOpportunities: quickWins.length,
      thresholds,
      analysis: 'Quick wins detection completed',
    });
  },
};

import { ComparePeriodsSchema } from '../schemas.js';
import { comparePeriods } from '../gsc/analytics.js';
import { textResult, type ToolDefinition } from './types.js';

export const comparePeriodsTool: ToolDefinition<typeof ComparePeriodsSchema> = {
  name: 'compare_periods',
  description:
    'Compare search performance between two periods (e.g. this month vs last month) by page or query: clicks, impressions, CTR and position deltas',
  schema: ComparePeriodsSchema,
  async handler(args, { service }) {
    const requestBody = {
      dimensions: [args.dimension],
      searchType: args.type,
      dataState: args.dataState,
      rowLimit: args.rowLimit,
    };

    const [current, previous] = await Promise.all([
      service.searchAnalytics(args.siteUrl, {
        ...requestBody,
        startDate: args.currentStartDate,
        endDate: args.currentEndDate,
      }),
      service.searchAnalytics(args.siteUrl, {
        ...requestBody,
        startDate: args.previousStartDate,
        endDate: args.previousEndDate,
      }),
    ]);

    const comparison = comparePeriods(current.data.rows ?? [], previous.data.rows ?? []);

    const gained = comparison.filter((c) => c.deltas.clicks > 0);
    const lost = comparison.filter((c) => c.deltas.clicks < 0);

    return textResult({
      dimension: args.dimension,
      currentPeriod: { start: args.currentStartDate, end: args.currentEndDate },
      previousPeriod: { start: args.previousStartDate, end: args.previousEndDate },
      summary: {
        entriesCompared: comparison.length,
        improved: gained.length,
        declined: lost.length,
        netClicksDelta: gained.reduce((s, c) => s + c.deltas.clicks, 0) + lost.reduce((s, c) => s + c.deltas.clicks, 0),
      },
      topGains: gained.sort((a, b) => b.deltas.clicks - a.deltas.clicks).slice(0, 25),
      topLosses: lost.sort((a, b) => a.deltas.clicks - b.deltas.clicks).slice(0, 25),
      comparison,
    });
  },
};

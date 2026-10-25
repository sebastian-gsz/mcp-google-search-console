/**
 * Analítica pura sobre filas de Search Console.
 *
 * Las funciones de este módulo no tocan la red ni la autenticación: reciben
 * filas ({ keys, clicks, impressions, ctr, position }) y devuelven resultados.
 * Esto las hace trivialmente auditable y testeables.
 */

export interface GscRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface PeriodMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PeriodComparison {
  key: string;
  current: PeriodMetrics;
  previous: PeriodMetrics;
  deltas: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
}

function toMetrics(row: GscRow | undefined): PeriodMetrics {
  if (!row) return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  return {
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: Number(((row.ctr || 0) * 100).toFixed(2)),
    position: Number((row.position || 0).toFixed(1)),
  };
}

function delta(current: number, previous: number): number {
  return Number((current - previous).toFixed(2));
}

/**
 * Compara dos periodos indexando las filas por la clave compuesta
 * (dimensiones en el mismo orden en ambos periodos).
 */
export function comparePeriods(
  currentRows: GscRow[],
  previousRows: GscRow[],
): PeriodComparison[] {
  const index = new Map<string, GscRow>();
  for (const row of previousRows) {
    index.set((row.keys ?? []).join('|'), row);
  }

  const comparisons: PeriodComparison[] = [];
  for (const row of currentRows) {
    const key = (row.keys ?? []).join('|');
    const current = toMetrics(row);
    const previous = toMetrics(index.get(key));
    if (current.clicks === 0 && current.impressions === 0 && previous.clicks === 0 && previous.impressions === 0) {
      // Se elimina la clave antes de omitir la fila: si se dejara en el
      // índice, el bucle de filas desaparecidas la reemitiría con deltas a -0
      // (regresión cubierta por analytics.test.ts).
      index.delete(key);
      continue;
    }
    comparisons.push({
      key: (row.keys ?? []).join(' · '),
      current,
      previous,
      deltas: {
        clicks: delta(current.clicks, previous.clicks),
        impressions: delta(current.impressions, previous.impressions),
        ctr: delta(current.ctr, previous.ctr),
        // Posición: un delta negativo es una mejora (subir posiciones).
        position: delta(current.position, previous.position),
      },
    });
    index.delete(key);
  }

  // Filas que existían antes y ya no: se reportan con métricas a cero.
  for (const row of index.values()) {
    const previous = toMetrics(row);
    comparisons.push({
      key: (row.keys ?? []).join(' · '),
      current: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      previous,
      deltas: {
        clicks: -previous.clicks,
        impressions: -previous.impressions,
        ctr: -previous.ctr,
        position: 0,
      },
    });
  }

  return comparisons;
}

export interface CannibalizationEntry {
  query: string;
  competingPages: {
    page: string;
    clicks: number;
    impressions: number;
    position: number;
  }[];
  totalImpressions: number;
  spread: number;
}

/**
 * Detecta queries canibalizadas: dos o más páginas recibiendo impresiones
 * para la misma query, lo que suele indicar competencia interna de URLs.
 * `spread` mide la diferencia de posición media entre la mejor y la peor
 * página de la query: cuanto mayor, más claro el conflicto.
 */
export function detectCannibalization(
  rows: GscRow[],
  options: { minImpressions?: number; maxCompetingPages?: number } = {},
): CannibalizationEntry[] {
  const { minImpressions = 30, maxCompetingPages = 2 } = options;

  const byQuery = new Map<string, Map<string, GscRow>>();
  for (const row of rows) {
    const query = row.keys?.[0];
    const page = row.keys?.[1];
    if (!query || !page) continue;
    const impressions = row.impressions || 0;
    if (impressions < minImpressions) continue;

    let pages = byQuery.get(query);
    if (!pages) {
      pages = new Map();
      byQuery.set(query, pages);
    }
    // Se acumula si la misma página aparece varias veces.
    const existing = pages.get(page);
    if (existing) {
      existing.clicks = (existing.clicks || 0) + (row.clicks || 0);
      existing.impressions = (existing.impressions || 0) + impressions;
    } else {
      pages.set(page, { ...row, impressions });
    }
  }

  const entries: CannibalizationEntry[] = [];
  for (const [query, pages] of byQuery) {
    if (pages.size < maxCompetingPages) continue;

    const competing = [...pages.entries()]
      .map(([page, row]) => ({
        page,
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        position: Number((row.position || 0).toFixed(1)),
      }))
      .sort((a, b) => a.position - b.position);

    const totalImpressions = competing.reduce((sum, p) => sum + p.impressions, 0);
    const spread = Number(
      (competing[competing.length - 1].position - competing[0].position).toFixed(1),
    );

    entries.push({
      query,
      competingPages: competing,
      totalImpressions,
      spread,
    });
  }

  return entries.sort(
    (a, b) => b.totalImpressions - a.totalImpressions || b.spread - a.spread,
  );
}

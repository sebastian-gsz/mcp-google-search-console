import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { comparePeriods, detectCannibalization, type GscRow } from './analytics.js';

/**
 * Tests unitarios de la analítica pura (item MCP-003).
 * Sin red ni disco: filas fijas en memoria. Cada función cubre su camino
 * feliz y al menos un camino no feliz.
 */
const row = (
  keys: string[],
  clicks: number,
  impressions: number,
  ctr: number,
  position: number,
): GscRow => ({ keys, clicks, impressions, ctr, position });

describe('comparePeriods', () => {
  it('compara por clave compuesta y calcula deltas', () => {
    const current = [row(['query a', '/p1'], 10, 100, 0.05, 3.0)];
    const previous = [row(['query a', '/p1'], 5, 120, 0.04, 6.0)];

    const result = comparePeriods(current, previous);

    assert.equal(result.length, 1);
    assert.equal(result[0].key, 'query a · /p1');
    assert.deepEqual(result[0].deltas, { clicks: 5, impressions: -20, ctr: 1, position: -3 });
  });

  it('una fila que solo existía en el periodo anterior se reporta con métricas a cero', () => {
    const previous = [row(['q', '/p'], 5, 120, 0.04, 6.0)];

    const result = comparePeriods([], previous);

    assert.equal(result.length, 1);
    assert.deepEqual(result[0].current, { clicks: 0, impressions: 0, ctr: 0, position: 0 });
    assert.deepEqual(result[0].deltas, { clicks: -5, impressions: -120, ctr: -4, position: 0 });
  });

  it('filas a cero en ambos periodos se omiten', () => {
    const result = comparePeriods([row(['x'], 0, 0, 0, 0)], [row(['x'], 0, 0, 0, 0)]);

    assert.deepEqual(result, []);
  });

  it('periodos vacíos devuelven comparación vacía', () => {
    assert.deepEqual(comparePeriods([], []), []);
  });
});

describe('detectCannibalization', () => {
  it('detecta dos páginas compitiendo para la misma query y calcula el spread', () => {
    const rows = [
      row(['q1', '/a'], 10, 200, 0.05, 2),
      row(['q1', '/b'], 2, 150, 0.01, 9),
    ];

    const result = detectCannibalization(rows);

    assert.equal(result.length, 1);
    assert.equal(result[0].query, 'q1');
    assert.equal(result[0].competingPages.length, 2);
    assert.equal(result[0].spread, 7);
    assert.equal(result[0].totalImpressions, 350);
  });

  it('una query con una sola página queda fuera', () => {
    const result = detectCannibalization([row(['q1', '/a'], 10, 200, 0.05, 2)]);

    assert.deepEqual(result, []);
  });

  it('filas bajo el umbral de impresiones o sin claves se ignoran', () => {
    const result = detectCannibalization([
      row(['q2', '/a'], 1, 10, 0.01, 5), // 10 < minImpressions (30)
      row([], 1, 100, 0.01, 5), // sin query ni page
    ]);

    assert.deepEqual(result, []);
  });

  it('acumula impresiones y clics de páginas repetidas', () => {
    const result = detectCannibalization([
      row(['q3', '/a'], 1, 40, 0.01, 4),
      row(['q3', '/a'], 1, 40, 0.01, 4),
      row(['q3', '/b'], 1, 35, 0.01, 8),
    ]);

    assert.equal(result.length, 1);
    assert.equal(result[0].competingPages.length, 2);
    assert.equal(result[0].totalImpressions, 115);
    assert.equal(result[0].competingPages[0].impressions, 80);
  });
});

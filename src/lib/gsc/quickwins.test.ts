import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detectQuickWins } from './client.js';

/**
 * Tests unitarios de la detección de quick wins (item MCP-003).
 * Función pura de src/lib/gsc/client.ts: sin red ni disco.
 * Defaults contrastados: minImpressions 50, maxCtr 2 %, posiciones 4-10,
 * CTR objetivo 5 %.
 */
const row = (
  query: string,
  page: string,
  clicks: number,
  impressions: number,
  ctr: number,
  position: number,
) => ({ keys: [query, page], clicks, impressions, ctr, position });

describe('detectQuickWins', () => {
  it('clasifica High cuando recupera al menos la mitad del potencial o 10+ clics', () => {
    // potencial = 400 * 5 % = 20 clics; adicional = 20 >= max(10, 10) → High
    const result = detectQuickWins([row('q', '/a', 0, 400, 0.005, 5)]);

    assert.equal(result.length, 1);
    assert.equal(result[0].opportunity, 'High');
    assert.equal(result[0].additionalClicks, 20);
    assert.equal(result[0].potentialClicks, 20);
  });

  it('clasifica Medium cuando hay mejora pero parcial', () => {
    // potencial = 100 * 5 % = 5; adicional = 5 < max(2.5, 10) → Medium
    const result = detectQuickWins([row('q', '/a', 0, 100, 0.005, 5)]);

    assert.equal(result[0].opportunity, 'Medium');
  });

  it('excluye filas fuera de los umbrales', () => {
    const result = detectQuickWins([
      row('q', '/a', 50, 400, 0.03, 5), // CTR 3 % > maxCtr 2 %
      row('q', '/b', 0, 10, 0.005, 5), // 10 < minImpressions 50
      row('q', '/c', 0, 400, 0.005, 1), // posición 1 < rango mínimo 4
      row('q', '/d', 0, 400, 0.005, 12), // posición 12 > rango máximo 10
    ]);

    assert.deepEqual(result, []);
  });

  it('filas vacías devuelven lista vacía', () => {
    assert.deepEqual(detectQuickWins([]), []);
  });

  it('ordena por clics potenciales adicionales descendente', () => {
    const result = detectQuickWins([
      row('a', '/a', 0, 100, 0.005, 5), // adicional 5 → Medium
      row('b', '/b', 0, 1000, 0.005, 6), // adicional 50 → High
    ]);

    assert.equal(result[0].query, 'b');
    assert.equal(result[0].opportunity, 'High');
    assert.equal(result[1].opportunity, 'Medium');
  });
});

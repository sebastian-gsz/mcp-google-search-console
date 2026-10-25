---
id: MCP-003
title: "Añadir tests unitarios de la analítica pura (comparePeriods, detectCannibalization, detectQuickWins)"
status: done
priority: P2
class: agente
regimen: produccion
timebox: null
node: src/lib
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T00:40:00+02:00
updated_at: 2026-10-25T11:38:00+01:00
closed_at: 2026-10-25T11:38:00+01:00
closed_reason: null
touches:
  - src/lib/gsc/
  - src/lib/ARCHITECTURE.md
  - src/ARCHITECTURE.md
  - docs/ARCHITECTURE.md
  - package.json
blocks: []
blocked_by: []
acceptance:
  - "Batería de tests para comparePeriods, detectCannibalization y detectQuickWins con un runner declarado en package.json"
  - "Cada función cubre al menos un camino no feliz (filas vacías, claves ausentes, métricas a cero, rows sin keys)"
  - "tsconfig.json deja de excluir los nuevos tests del proyecto (o se declara su configuración propia)"
  - "Contratos de src/lib/gsc/ y src/lib/ actualizados en la misma entrega (sección de validación)"
subtasks:
  - "[x] Elegir runner (node:test vía tsx, ya en devDependencies — cero dependencias nuevas)"
  - "[x] Tests de analítica pura con caminos no felices (analytics.test.ts + quickwins.test.ts)"
  - "[x] Actualizar contratos afectados (src/, src/lib/gsc/, mapa maestro §2)"
external:
  - null
decision_log:
  - "2026-10-25T00:40:00+02:00 · agente-constructor · Ítem creado como hallazgo del diagnóstico del montaje."
  - "2026-10-25T11:14:00+01:00 · agente-constructor · Alcance ampliado de forma trazable (touches): los contratos src/ARCHITECTURE.md, src/lib/ARCHITECTURE.md y docs/ARCHITECTURE.md entran en la entrega para sincronizar la validación y el artefacto tsconfig.test.json."
  - "2026-10-25T11:30:00+01:00 · agente-constructor · Decisión de runner: node:test + tsx (ya en devDependencies) en lugar de vitest — cero dependencias nuevas y cero cambios en pnpm-lock.yaml, para no interferir con OPS-003/OPS-004."
  - "2026-10-25T11:32:00+01:00 · agente-constructor · El test «filas a cero en ambos periodos se omiten» reprodujo un bug real de comparePeriods antes del fix (patrón test first mode, §6.4 del fruto): el continue omitía la fila sin eliminar su clave del índice y el bucle de filas desaparecidas la reemitía con deltas a -0. Corregido en analytics.ts (index.delete(key) antes del continue) dentro de touches; el test queda como regresión permanente."
  - "2026-10-25T11:35:00+01:00 · agente-constructor · Nota de entorno: tsc agota el heap por defecto (~950 MB) con el d.ts de googleapis en máquinas con ~2 GB RAM; se ejecutó con NODE_OPTIONS=--max-old-space-size=1400. Limitación del entorno, no del repo (el Docker build corre tal cual)."
---

## Contexto

Hallazgo del diagnóstico estructural ligero (montaje del harness, 2026-10-25): `tsconfig.json` excluye `src/**/*.test.ts` y `src/**/*.spec.ts`, pero no existe ningún test en el repositorio. La capa de mayor valor para testear ya está aislada por diseño: `analytics.ts`, `detectQuickWins` y las funciones puras no tocan red ni disco (ley 15 del mapa maestro). El contrato de `src/lib/gsc/` declara hoy ese hueco como límite de validación.

## Clasificación y protocolo

- **Clase de problema**: `agente` (proceso de verificación; la analítica pura no plantea retos de datos/red/cómputo).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — test first mode (§6.4 de la plantilla de fruto): en features no triviales, tests primero.
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- Empezar por `comparePeriods` (la más densa: fusión por clave compuesta, filas desaparecidas a cero, redondeos).
- No testear `client.ts` en este ítem (requiere mocks de googleapis; valor/coste peor — ítem propio si el operador lo quiere).

## Evidencia (al cierre)

- **Criterio 1 ✓ — Batería con runner declarado**: `src/lib/gsc/analytics.test.ts` (comparePeriods ×4, detectCannibalization ×4) y `src/lib/gsc/quickwins.test.ts` (detectQuickWins ×5). Runner en `package.json`: `"test": "tsx --test …"` (node:test) y `"test:types": "tsc -p tsconfig.test.json"`. **Cero dependencias nuevas**: node:test es nativo y tsx ya estaba en devDependencies — `pnpm-lock.yaml` intacto.
- **Criterio 2 ✓ — Caminos no felices**: periodos vacíos, fila solo en el periodo anterior (deltas negativos), filas a cero en ambos periodos, filas sin claves, filas bajo umbrales (CTR > 2 %, < 50 impresiones, posición fuera de 4–10), página única por query. Salida cruda: `pnpm test` → **tests 13, pass 13, fail 0, exit 0**.
- **Criterio 3 ✓ — tsconfig**: los tests quedan cubiertos por el chequeo de tipos vía `tsconfig.test.json` (configuración propia, `noEmit`, extiende el principal) — el build de `tsconfig.json` sigue excluyéndolos y `dist/` no se contamina. `pnpm test:types` → exit 0.
- **Criterio 4 ✓ — Contratos sincronizados en la misma entrega**: `src/lib/gsc/ARCHITECTURE.md` (mapa con los dos `.test.ts`, §6.1 con comandos reales, §6.2 con evidencia y límites, §8 con el antipatrón del bug), `src/ARCHITECTURE.md` (§6 fila de tests reales), `docs/ARCHITECTURE.md` (§2 añade `tsconfig.test.json` a artefactos). `src/lib/ARCHITECTURE.md` sin cambios: ni sus reglas ni su mapa varían (los tests viven en el fruto).
- **Bug encontrado y corregido (dentro de touches)**: `comparePeriods` omitía filas a cero con `continue` sin borrar la clave del índice → el bucle de filas desaparecidas las reemitía como entrada espuria con deltas a `-0`. Fix de una línea en `analytics.ts` (`index.delete(key)` antes del `continue`) tras reproducirlo con el test en rojo; el test queda como regresión permanente. Efecto observable: `compare_periods` ya no devuelve entradas todo-cero espurias.
- **Verificación completa**: `pnpm test` 13/13 ✓ · `pnpm test:types` exit 0 · `pnpm exec tsc --noEmit` exit 0 · `pnpm run build` exit 0 (`dist/entrypoints/` con los 3 entrypoints, sin tests).
- **Instalación**: `pnpm install --frozen-lockfile --ignore-scripts` (el `prepare`/tsc abortaba el install por heap en este entorno de ~2 GB RAM; los scripts de ciclo de vida no son necesarios para tests; el build se ejecutó después a mano con heap ampliado, en verde).
- **No verificado**: llamada real a la API de GSC (sin credenciales en el entorno) — los tests cubren las funciones puras, no el transporte.
- **Responsable**: agente-constructor (autorización del operador: «Reclámala», sesión 2026-10-25).

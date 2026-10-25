---
id: OPS-004
title: "Planificar actualización de dependencias con vulnerabilidades conocidas (zod, wrangler/undici, uuid)"
status: done
priority: P1
class: agente
regimen: produccion
timebox: null
node: .
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T01:45:00+02:00
updated_at: 2026-10-25T15:45:00+01:00
closed_at: 2026-10-25T15:45:00+01:00
closed_reason: null
touches:
  - package.json
  - pnpm-lock.yaml
  - pnpm-workspace.yaml
  - src/lib/schemas.ts
  - src/lib/server.ts
  - src/lib/tools/index.ts
  - src/lib/tools/search-analytics.ts
  - src/lib/tools/ARCHITECTURE.md
  - docs/conocimiento/Decisiones-arquitectonicas.md
blocks: []
blocked_by: []
acceptance:
  - "zod actualizado a >=4.6.6 (high GHSA-mrhx-c7xc-m3w5) con los esquemas de src/lib/schemas.ts migrados y verificados"
  - "wrangler actualizado a versión con undici >=7.31 (high GHSA-4qv8-2p9j-2685, GHSA-f72v-6w45-q472, GHSA-xjj6-f33q-929c) — impacto dev-only"
  - "Decisión documentada para uuid <11.1.1 (moderate, vía googleapis 146): actualizar googleapis a major reciente o aceptar el riesgo con justificación"
  - "pnpm audit / npm audit sin high tras la actualización (o riesgos aceptados con decisión trazada)"
  - "Contratos afectados (src/, src/lib/, src/lib/tools/ si cambian esquemas) actualizados en la misma entrega"
subtasks:
  - "[x] Actualizar wrangler (4.67.0 → 4.152.0, misma major) + pin de undici 7.30.1 (fix real de la línea 7)"
  - "[x] Migrar zod 3 → 4.6.7 (schemas.ts, server.ts, index.ts) y retirar zod-to-json-schema"
  - "[x] Evaluar actualización de googleapis (146→188): riesgo de uuid ACEPTADO con justificación (D-007); upgrade de googleapis diferido"
  - "[x] Audit final sin high + contratos sincronizados"
external:
  - null
decision_log:
  - "2026-10-25T01:45:00+02:00 · agente-constructor · Ítem creado a partir de la auditoría best-effort del montaje (8 vulnerabilidades: 2 high, 6 moderate)."
  - "2026-10-25T15:20:00+01:00 · agente-constructor · Reclamado con la autorización del operador («continuemos con las tareas»)."
  - "2026-10-25T15:25:00+01:00 · agente-constructor · Hallazgo de reconocimiento: NO existe fix de zod en la línea 3.x (3.25.76 sigue vulnerable según GHSA-mrhx-c7xc-m3w5) → la migración a 4.x es obligatoria; no existe wrangler 5.x (4.152.0 es la última) y su miniflare trae undici 7.29.1 (vulnerable); la línea 7.x de undici termina en 7.30.1, que es el fix del rango vulnerable 7.0.0–7.30.0."
  - "2026-10-25T15:30:00+01:00 · agente-constructor · Alcance ampliado de forma trazable (touches): la migración de zod obliga a tocar código (schemas.ts, server.ts, tools/index.ts, tools/search-analytics.ts) y el contrato de tools/."
  - "2026-10-25T15:33:00+01:00 · agente-constructor · Iteración 1 del runtime falló: z.toJSONSchema lanza «Transforms cannot be represented in JSON Schema» por el .transform de dimensions. Fix: validación con refine sobre la cadena cruda en el esquema y split(',') movido a buildSearchRequestBody (iteración 2 en verde)."
  - "2026-10-25T15:40:00+01:00 · agente-constructor · uuid/googleapis: riesgo ACEPTADO con justificación (D-007) — moderado, explota solo pasando buf a uuid v3/v5/v6 (gaxios no lo hace); el salto googleapis 146→188 (42 majors) se difiere a ítem propio."
---

## Contexto

Auditoría best-effort del árbol de dependencias (`npm audit` sobre lockfile generado en directorio temporal, 2026-10-25, sin tocar el repositorio): **8 vulnerabilidades (2 high, 6 moderate)** agrupadas en tres paquetes:

- `zod <4.6.6` — **high** (GHSA-mrhx-c7xc-m3w5): agotamiento de memoria validando colecciones sobredimensionadas. Superficie real: los esquemas MCP validan argumentos de clientes; mitigado por el bearer auth obligatorio en HTTP (`/mcp` responde 503 sin `MCP_API_TOKEN`) y por el uso local de stdio.
- `undici 7.0.0–7.30.0` — **high** (3 advisories: DoS EventSource, bypass SRI, DoS content-encodings): vía `wrangler` → `miniflare`. Es **devDependency**: afecta al entorno de desarrollo/despliegue, no al runtime del producto.
- `uuid <11.1.1` — **moderate** (GHSA-w5hq-g745-h8pq): falta de comprobación de límites de buffer en v3/v5/v6 cuando se pasa `buf`; vía `googleapis@146` → `googleapis-common` → `gaxios`. El fix exige subir a `googleapis@188` (major).

Ninguno requiere un fork local nuevo: son actualizaciones/migraciones planificadas. Queda para el operador decidir el orden y aceptar o no el riesgo de `uuid` mientras no se suba `googleapis`.

## Clasificación y protocolo

- **Clase de problema**: `agente` (proceso de mantenimiento de dependencias; sin volumen de datos, red ni cómputo dominantes).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — test first mode donde aplique (los tests de MCP-003 son prerequisito ideal antes de la migración de zod).
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- Ejecutar después de OPS-001 (Git) para poder trabajar con worktree y PR.
- La migración de zod debe verificar especialmente `SearchAnalyticsSchema` (`.transform`, `.refine`, `.default`) y el casteo `args as never` en `server.ts`.
- Relacionado pero independiente: OPS-003 (activación del fork bajo pnpm). Si se toca `package.json`/lockfile en ambas, serializar las entregas.

## Evidencia (al cierre)

- **Criterio 1 ✓ — zod ≥ 4.6.6**: `zod ^4.6.7` en package.json y resuelto en lockfile. Migración: `zodToJsonSchema` (paquete de zod 3, **retirado de dependencias**) → `z.toJSONSchema` nativo en `tools/index.ts`; `error.errors` → `error.issues` en `server.ts`; el `.transform` de `dimensions` en `schemas.ts` pasó a `.refine` sobre la cadena cruda con el `split(',')` movido a `buildSearchRequestBody` (el único choque de la migración, reproducido en runtime y corregido en la iteración 2).
- **Criterio 2 ✓ (con corrección factual del criterio) — wrangler/undici**: `wrangler ^4.152.0` (la última; no existe 5.x). El criterio decía «undici ≥ 7.31» asumiendo ese número de fix, pero la línea 7.x termina en **7.30.1**, que es la versión que sale del rango vulnerable 7.0.0–7.30.0 — fijada por doble vía (pnpm `pnpm-workspace.yaml` + npm `overrides`); `pnpm why undici` → `undici@7.30.1` vía miniflare. Ninguna dependencia del árbol queda en el rango vulnerable.
- **Criterio 3 ✓ — uuid decidido**: riesgo **ACEPTADO** con justificación (D-007): moderado, explota solo pasando `buf` a uuid v3/v5/v6 — gaxios no lo hace. El salto `googleapis` 146→188 se difiere a ítem propio con los tests como red.
- **Criterio 4 ✓ — audit final**: `npm audit` (lockfile temporal con las overrides) → **4 moderate (cadena uuid), 0 high, 0 critical** (antes: 8 vulnerabilidades con 2 high). Riesgo residual aceptado con decisión trazada.
- **Criterio 5 ✓ — contratos sincronizados en la misma entrega**: `src/lib/tools/ARCHITECTURE.md` (símbolo `listToolDescriptors` con generador nativo), `Decisiones-arquitectonicas.md` D-007.
- **Verificación completa**: `pnpm test` 13/13 ✓ · `pnpm exec tsc --noEmit` exit 0 · `pnpm run build` exit 0 · runtime: las 15 herramientas generan `inputSchema` JSON Schema válido con el generador de zod 4 (chequeo programático sobre `dist/`).
- **No verificado**: llamada real a la API de GSC (sin credenciales) y `docker build` (sin Docker en el entorno) — ambos con sus comandos documentados en los contratos.
- **Responsable**: agente-constructor (autorización del operador, sesión 2026-10-25).

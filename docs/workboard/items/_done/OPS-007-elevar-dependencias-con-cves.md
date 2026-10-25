---
id: OPS-007
title: "Elever dependencias con CVEs de la auditoría OSV (hono, @modelcontextprotocol/sdk, @hono/node-server)"
status: done
priority: P1
class: agente
regimen: produccion
timebox: null
node: src
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T16:35:00+01:00
updated_at: 2026-10-25T17:20:00+01:00
closed_at: 2026-10-25T17:20:00+01:00
closed_reason: null
touches:
  - package.json
  - pnpm-lock.yaml
  - src/
  - docs/runbooks/
blocks: []
blocked_by: []
acceptance:
  - "hono elevada a ≥ 4.13.14 (misma major) y @modelcontextprotocol/sdk a ≥ 1.32.2 (misma major) con tests 13/13, tsc y build en verde"
  - "@hono/node-server 2.x evaluado (salto de major: revisar breaking changes de serve() en server-http.ts) y elevado o riesgo aceptado con decisión"
  - "Re-escaneo OSV con el manifiesto pineado regenerado: los CVEs de las dependencias elevadas desaparecen o se documentan los residuales"
  - "Contratos afectados actualizados en la misma entrega"
  - "Transitivos ligados a googleapis (fast-uri, uuid) y de wrangler (brace-expansion, minimatch, qs, body-parser, ajv, proxy-addr): elevar si la re-resolución lo permite; si no, riesgo aceptado con decisión (línea con D-007)"
subtasks:
  - "[x] Elevar hono (4.12.0 → 4.13.14) y @modelcontextprotocol/sdk (1.25.1 → 1.32.2)"
  - "[x] Evaluar y aplicar @hono/node-server 2.1.5 (API serve() compatible: tsc + smoke runtime en verde)"
  - "[x] Re-escaneo OSV de verificación con mcp-cves (77 → 31)"
  - "[x] Contratos sincronizados + cierre (aditamento en la bitácora de runbooks)"
external:
  - null
decision_log:
  - "2026-10-25T16:35:00+01:00 · agente-constructor · Ítem creado a partir de los hallazgos de la auditoría SCA de OPS-006 (bitácora docs/runbooks/2026-10-25-auditoria-sca-mcp-cves.md): 77 CVEs en 11 paquetes; 0 KEV/arma; las versiones objetivo existen en las mismas majors excepto @hono/node-server (2.x)."
  - "2026-10-25T16:55:00+01:00 · agente-constructor · Reclamado con autorización del operador («quiero que abras tareas, cambies la versión»)."
  - "2026-10-25T17:00:00+01:00 · agente-constructor · pnpm update resolvió hono 4.13.13 (cache de registro) — se forzó 4.13.14 con pnpm add hono@4.13.14, fijando la versión exacta en package.json."
  - "2026-10-25T17:05:00+01:00 · agente-constructor · @hono/node-server elevado a 2.1.5 (major): la API usada (serve({fetch, port}, cb)) resultó compatible — verificado con tsc y smoke runtime real (servidor en puerto efímero, GET /health → 200). Sin cambios de código."
  - "2026-10-25T17:10:00+01:00 · agente-constructor · Los transitivos de wrangler/miniflare y de googleapis no se elevan: dependen de sus cadenas padre (riesgo aceptado, D-007 y re-escaneo lo confirma: 31 residuales, 0 KEV/arma)."
---

## Contexto

La auditoría SCA con mcp-cves (OPS-006, bitácora del 2026-10-25) encontró 77 CVEs sobre el árbol resuelto de 235 paquetes, concentrados en: `hono 4.12.0` (36 — framework HTTP en la ruta de producción), `@modelcontextprotocol/sdk 1.25.1` (7), `@hono/node-server 1.19.7` (3) y transitivos de wrangler/miniflare (`brace-expansion` 7, `qs` 4, `minimatch` 3, `body-parser` 2, `ajv`, `proxy-addr`). Sin KEV ni armas públicas y con scores proxy ≤ 42.8: la remediación es elevación de versiones, no respuesta a incidente.

Versiones objetivo verificadas: `hono 4.13.14` (misma major), `@modelcontextprotocol/sdk 1.32.2` (misma major), `@hono/node-server 2.1.5` (**major nuevo**: revisar la API `serve()` usada en `src/entrypoints/server-http.ts`).

## Clasificación y protocolo

- **Clase de problema**: `agente` (mantenimiento de dependencias; la re-verificación incluye consultas OSV).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — test first no aplica; la red de seguridad son los 13 tests + tsc + build y el re-escaneo OSV.
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- Repetir la metodología de OPS-006 para el re-escaneo (manifiesto pineado desde el lockfile regenerado + tool `escanear_dependencias` con whitelist mínima).
- `fast-uri` y `uuid` dependen del upgrade de `googleapis` (D-007, riesgo aceptado); los transitivos de wrangler solo se elevan si la re-resolución de wrangler 4.152.0 lo permite — no forzar majors ajenos.
- El runbook/bitácora de la auditoría se marca `reviewed` cuando el operador apruebe este plan.

## Evidencia (al cierre)

- **Criterio 1 ✓ — hono y SDK elevados**: `hono 4.13.14` (exacta, forzada con `pnpm add` tras resolver el cache a 4.13.13) y `@modelcontextprotocol/sdk 1.32.2` (peer zod `^3.25 || ^4.0` — compatible con nuestra zod 4.6.7). Red de seguridad en verde: **13/13 tests · `tsc --noEmit` exit 0 · `pnpm run build` exit 0**.
- **Criterio 2 ✓ — @hono/node-server 2.1.5 evaluado y aplicado**: salto de major **sin cambios de código** — la API usada (`serve({fetch, port}, cb)` en `server-http.ts`) es compatible; verificado con tsc (tipos de v2) y **smoke runtime real**: servidor con la app Hono en puerto efímero → `GET /health` → 200 `{"status":"ok"}`.
- **Criterio 3 ✓ — re-escaneo OSV**: manifiesto pineado regenerado desde el lockfile nuevo (236 paquetes) y `escanear_dependencias` re-ejecutado con la metodología de OPS-006: **31 vulnerabilidades (antes 77)** — desaparecieron los 46 CVEs de hono/SDK/node-server. Residuales: `fast-uri 3.1.0` (12, googleapis — riesgo aceptado D-007) y transitivos de wrangler/miniflare (`brace-expansion` 7, `qs` 4, `minimatch` 3, `body-parser` 2, `ajv`, `proxy-addr`, `uuid` — 1 c/u). **0 KEV, 0 arma pública** en todo el árbol. Aditamento registrado en la bitácora de runbooks (sin reescribir el histórico).
- **Criterio 4 ✓ — contratos sincronizados**: mapa del dominio runbooks actualizado (descripción de la bitácora con el post-remediación); el resto de contratos no varía (no cambió comportamiento de código ni topología).
- **Criterio 5 ✓ — transitivos**: elevados solo los que la re-resolución permitió; los ligados a googleapis/wrangler permanecen documentados como riesgo aceptado (línea D-007), con el re-escaneo como evidencia.
- **No verificado**: llamada real a la API de GSC (sin credenciales) y `docker build` (sin Docker en el entorno).
- **Responsable**: agente-constructor (autorización del operador: «quiero que abras tareas, cambies la versión», sesión 2026-10-25).

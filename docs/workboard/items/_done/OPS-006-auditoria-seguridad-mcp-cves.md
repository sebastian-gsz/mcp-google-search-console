---
id: OPS-006
title: "Auditoría de seguridad de dependencias con mcp-cves (SCA vía OSV)"
status: done
priority: P1
class: red
regimen: produccion
timebox: null
node: .
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T16:05:00+01:00
updated_at: 2026-10-25T16:40:00+01:00
closed_at: 2026-10-25T16:40:00+01:00
closed_reason: null
touches:
  - docs/runbooks/
blocks: []
blocked_by: []
acceptance:
  - "Servidor MCP de mcp-cves invocado por su protocolo (stdio JSON-RPC) con la tool escanear_dependencias sobre el árbol resuelto de gsc-server (manifiesto pineado desde pnpm-lock.yaml)"
  - "Hallazgos priorizados (score CVSS/KEV/EPSS/arma pública) y contrastados con la auditoría npm de OPS-004"
  - "Bitácora de la ejecución en docs/runbooks/ con el formato canónico"
  - "Hallazgos accionables convertidos en ítems nuevos (o riesgo aceptado documentado)"
  - "Cero modificaciones en mcp-cves (uso solo como herramienta)"
subtasks:
  - "[x] Preparar entorno de ejecución de mcp-cves (venv con sus dependencias)"
  - "[x] Sintetizar manifiesto pineado desde pnpm-lock.yaml (235 paquetes)"
  - "[x] Ejecutar el servidor MCP y las tools de auditoría (escanear_dependencias)"
  - "[x] Analizar hallazgos y contrastar con npm audit (OPS-004)"
  - "[x] Bitácora + cierre (remediación propuesta en OPS-007)"
external:
  - null
decision_log:
  - "2026-10-25T16:05:00+01:00 · operador (J. Sebastián G. Sánchez) · Orden: «emplea mcp-cves para auditar el proyecto en términos de seguridad»."
---

## Contexto

Auditoría de seguridad del software del que se compone `mcp-server-gsc` (árbol de dependencias resuelto + runtime), empleando el escáner CVE del proyecto hermano `mcp-cves` **como herramienta** (su servidor MCP sobre stdio; sin modificar su código). El árbol resuelto (no los rangos de package.json) es la superficie real: el parser de manifiestos de mcp-cves solo acepta versiones exactas, lo que fuerza el manifiesto pineado — y de paso audita también los transitivos.

## Clasificación y protocolo

- **Clase de problema**: `red` (consultas HTTPS a OSV/NVD con presupuesto de peticiones; el escáner impone su propio rate limit).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/red.md` (timeout, reintentos ya implementados en el escáner) + `secretos.md` (sin credenciales: OSV/NVD/EPSS son APIs sin key; whitelist MCP_DEPS_ROOTS al directorio mínimo).
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- No se usan las tools de red local (`escanear`, `descubrir_hosts`): el objetivo es el árbol de dependencias, no la LAN. Whitelist mínima.
- Los informes CSV/PDF que genera el escáner caen en `outputs/` de mcp-cves (su directorio de salidas; no se versionan).

## Evidencia (al cierre)

- **Criterio 1 ✓ — servidor MCP invocado por protocolo**: cliente stdio stdlib (`/tmp/mcp_client.py`) contra `mcp_server.py` de mcp-cves: `initialize` → `notifications/initialized` → `tools/list` (7 tools) → `tools/call escanear_dependencias` con `MCP_DEPS_ROOTS=/tmp/gsc-sca` (whitelist mínima, fail-closed respetado). `isError: false`. Objetivo: manifiesto pineado con las **235 versiones exactas** de `pnpm-lock.yaml` (el parser de mcp-cves solo acepta versiones exactas — de este modo se audita el árbol resuelto real, incluidos los transitivos).
- **Criterio 2 ✓ — hallazgos priorizados y contrastados**: **77 CVEs en 11 paquetes** de 235 (4,7 %): `hono 4.12.0` (36), `fast-uri 3.1.0` (12), `@modelcontextprotocol/sdk 1.25.1` (7), `brace-expansion 1.1.12` (7), `qs 6.14.0` (4), `@hono/node-server 1.19.7` (3), `minimatch 3.1.2` (3), `body-parser 2.2.1` (2), `ajv`/`proxy-addr`/`uuid` (1 c/u). **0 en KEV, 0 con arma pública**, score proxy máximo 42.8. Cruce con npm audit coherente (uuid presente en ambos; undici 7.30.1 limpia en ambos; OSV agrega más fuentes sin deduplicar). Detalle completo en la bitácora `docs/runbooks/2026-10-25-auditoria-sca-mcp-cves.md`.
- **Criterio 3 ✓ — bitácora canónica**: `docs/runbooks/2026-10-25-auditoria-sca-mcp-cves.md` (formato `_template-bitacora.md`, `document_status: draft` hasta aprobación del operador); mapa del dominio runbooks actualizado en la misma entrega.
- **Criterio 4 ✓ — hallazgos accionables convertidos en ítems**: **OPS-007** (abierta, P1) para elevar hono 4.13.14 / @modelcontextprotocol/sdk 1.32.2 / @hono/node-server 2.x + re-escaneo OSV; `fast-uri`/`uuid` permanecen en el riesgo aceptado de D-007 (ligados a googleapis).
- **Criterio 5 ✓ — cero modificaciones en mcp-cves**: solo ejecución (escrituras del escáner en su propio `outputs/` y caché SQLite, según su diseño). El Python del sistema no se tocó (venv aislado; pip bootstrap dentro del venv por PEP 668).
- **No verificado**: enriquecimiento EPSS/KEV del vector SCA (columnas a 0.0 — limitación del escáner, documentada en la bitácora); verificación manual CVE a CVE (se prioriza por paquete/versión objetivo).
- **Responsable**: agente-constructor (orden del operador: «emplea mcp-cves para auditar el proyecto», sesión 2026-10-25).

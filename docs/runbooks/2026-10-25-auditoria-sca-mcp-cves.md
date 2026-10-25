---
title: "Auditoría SCA de mcp-server-gsc con mcp-cves — desarrollo local"
type: execution-log
document_status: reviewed
outcome: "77 CVEs en 11 de 235 paquetes del árbol resuelto; 0 en KEV y 0 con arma pública; remediación propuesta en OPS-007"
system: "mcp-cves 0.1.0 (servidor MCP stdio) sobre mcp-server-gsc 0.3.0"
environment: "WSL2 Debian — Python 3.14.7 (venv /tmp/mcv-venv), Node 24.19.0"
execution_date: "2026-10-25"
recorded_date: 2026-10-25
version: "mcp-server-gsc develop c9a5077"
source: "agente-constructor (verificación directa)"
confidence: "directly-verified"
---

# Auditoría SCA de mcp-server-gsc con mcp-cves — desarrollo local

## Objetivo y alcance

Auditar la seguridad de la composición software de `mcp-server-gsc` (árbol de dependencias **resuelto**, no los rangos de `package.json`) empleando el escáner del proyecto hermano `mcp-cves` como herramienta, sin modificar su código. Queda fuera: escaneo de red local (tools `escanear`/`descubrir_hosts` no invocadas), auditoría de código propio y del sistema operativo anfitrión.

## Fuente y límites de evidencia

Evidencia directamente verificada por el agente que ejecutó la auditoría (salidas del protocolo MCP y del CSV del escáner, presentes durante la ejecución). Límites: las puntuaciones de los hallazgos SCA son **proxies por severidad declarada de OSV** (LOW..CRITICAL → 2..9.5), no CVSS calculados; las columnas `epss` salieron a 0.0 en todos los hallazgos SCA — el enriquecimiento EPSS/KEV del pipeline de red no parece aplicarse al vector SCA (limitación del escáner, no del objetivo); el CVE/arma pública reportado como `False` es ausencia en las fuentes consultadas, no garantía absoluta.

## Entorno observado

- Sistema/versión: mcp-cves 0.1.0 — servidor MCP stdio, JSON-RPC 2.0 línea a línea (stdlib puro).
- Host/entorno: WSL2 Debian; Python 3.14.7 con venv `/tmp/mcv-venv` (requests 2.32.3, python-dotenv, tabulate, python-nmap, scapy — nmap/scapy no usados); Node 24.19.0 para la síntesis del manifiesto.
- Configuración: `MCP_DEPS_ROOTS=/tmp/gsc-sca` (whitelist mínima, fail-closed respetado); manifiesto de auditoría `/tmp/gsc-sca/package.json` con las **235 versiones exactas** extraídas de `pnpm-lock.yaml` (el parser de mcp-cves solo acepta versiones exactas: los rangos `^` de un package.json real se omiten, de ahí el manifiesto pineado — audita también los transitivos).

## Pasos ejecutados

1. **Acción:** sintetizar el manifiesto pineado desde `pnpm-lock.yaml` (sección `packages`, deduplicación nombre→versión).
   **Resultado:** 235 paquetes con versión exacta en `/tmp/gsc-sca/package.json`.
2. **Acción:** arrancar `mcp_server.py` (venv) y completar el protocolo MCP: `initialize` → `notifications/initialized` → `tools/list`.
   **Resultado:** serverInfo `mcp-cves 0.1.0`; 7 tools expuestas (`puntuar`, `buscar_cves`, `armas_publicas`, `escanear_dependencias`, `advisories`, `descubrir_hosts`, `escanear`).
3. **Acción:** `tools/call escanear_dependencias {ruta: /tmp/gsc-sca}` (cliente stdlib `/tmp/mcp_client.py`).
   **Resultado:** `isError: false` — «77 vulnerabilidad(es) de dependencias», CSV generado en `outputs/reporte_vulnerabilidades.csv` de mcp-cves (artefacto local, no versionado); PDF no generado (reportlab no instalado en el venv — opcional y perezoso por diseño).
4. **Acción:** agregación del CSV (node): totales, distribución, paquetes, cruce con la auditoría npm de OPS-004.
   **Resultado:** ver §Verificación.

## Verificación

| Comprobación | Resultado observado | Fuente |
|---|---|---|
| Hallazgos totales | 77 (77 CVEs distintos) en **11 paquetes** de 235 (4,7 % del árbol) | CSV del escáner |
| Distribución por score proxy | ~50 low · ~27 moderate · máximo 42.8 (proxy-addr, CVE-2026-90711) | CSV |
| KEV | 0 hallazgos en el catálogo KEV de CISA | CSV |
| Arma pública (Exploit-DB/PoC GitHub) | 0 hallazgos | CSV |
| Paquetes afectados | `hono 4.12.0` (36), `fast-uri 3.1.0` (12), `@modelcontextprotocol/sdk 1.25.1` (7), `brace-expansion 1.1.12` (7), `qs 6.14.0` (4), `@hono/node-server 1.19.7` (3), `minimatch 3.1.2` (3), `body-parser 2.2.1` (2), `ajv 8.17.1`, `proxy-addr 2.0.7`, `uuid 9.0.1` (1 c/u) | CSV |
| Cruce con npm audit (OPS-004) | Coherente: `uuid 9.0.1` aparece en ambos (CVE-2026-41907 ≙ GHSA-w5hq-g745-h8pq, riesgo aceptado en D-007); `undici 7.30.1` limpia en ambos; OSV reporta 77 vs 4 de npm audit porque agrega más fuentes de advisories por (paquete, versión) sin deduplicar | Comparación directa |
| Discrepancia a triar | `hono 4.12.0` (framework HTTP en producción) concentra 36 CVEs; fix disponible en la misma major (`4.13.14`); `@modelcontextprotocol/sdk 1.25.1` (7 CVEs) → `1.32.2`; `@hono/node-server` → `2.1.5` (**salto de major**, evaluar breaking changes de `serve()`) | pnpm view |

## Problemas y resolución

| Incidencia | Diagnóstico | Resolución | Resultado |
|---|---|---|---|
| `pip` ausente en el sistema y PEP 668 bloqueaba `--user` | Debian sin `python3-pip` ni `ensurepip`; venv sin pip | Bootstrap oficial `get-pip.py` **dentro del venv** | venv funcional; sin tocar el Python del sistema |

## Rollback

No aplicable: la ejecución es de solo lectura sobre el objetivo (más escrituras en `outputs/` de mcp-cves y caché SQLite del escáner). No se modificó ningún archivo de `mcp-cves` ni de `gsc-server` durante el escaneo.

## Estado al cierre

Auditoría completada con `isError: false`; árbol de 235 paquetes auditado con el árbol resuelto real. Remediación propuesta y registrada como ítem abierto **OPS-007** (hono 4.13.14, @modelcontextprotocol/sdk 1.32.2, @hono/node-server 2.x, re-escaneo OSV de verificación). Los transitivos ligados a googleapis (`fast-uri`, `uuid`) permanecen en el riesgo aceptado de D-007 hasta el upgrade de googleapis.

## Aditamento — verificación post-remediación (OPS-007, 2026-10-25T17:10:00+01:00)

Tras elevar `hono` 4.12.0→**4.13.14**, `@modelcontextprotocol/sdk` 1.25.1→**1.32.2** y `@hono/node-server` 1.19.7→**2.1.5** (ítem OPS-007; tsc + 13 tests + build + smoke runtime de `serve()` v2 en verde), se regeneró el manifiesto pineado (236 paquetes) y se repitió el escaneo con la misma metodología:

| Comprobación | Resultado observado | Fuente |
|---|---|---|
| Hallazgos totales | **31** (antes 77) — los 46 CVEs de los paquetes elevados desaparecieron | CSV del re-escaneo |
| Residuales | `fast-uri 3.1.0` (12, ligado a googleapis — riesgo aceptado D-007), `brace-expansion 1.1.12` (7), `qs 6.14.0` (4), `minimatch 3.1.2` (3), `body-parser 2.2.1` (2), `ajv 8.17.1`, `proxy-addr 2.0.7`, `uuid 9.0.1` (1 c/u — transitivos de wrangler/miniflare) | CSV |
| KEV / arma pública | 0 / 0 | CSV |

Los residuales son transitivos de `wrangler`/`miniflare` (devDependency) y de `googleapis` (riesgo aceptado): su elevación depende de las cadenas padre, no de este repo directamente.

## Aspectos no acreditados

- El enriquecimiento EPSS/KEV completo del vector SCA (columnas a 0.0/False — ver límites de evidencia).
- La verificación manual CVE a CVE de los 77 hallazgos (se confía en los rangos afectados declarados por OSV/GHSA; la priorización para remediación usa paquete+versión objetivo, no el mérito individual de cada CVE).
- Escaneo del runtime Node (imagen base `node:22-slim` del Dockerfile) — recomendación registrada: pinear la versión exacta de la imagen y auditarla aparte.

## Trazabilidad

- Workboard/autorización: ítem OPS-006 de `docs/workboard/` (orden del operador, 2026-10-25).
- **Aprobación del operador**: J. Sebastián G. Sánchez aprueba esta bitácora como registro vigente de la ejecución — «La apruebo» — 2026-10-25T17:40:32+01:00.
- Contratos relacionados: `ARCHITECTURE.md` de la raíz de **mcp-cves** (proyecto hermano, tronco escáner — §3, tool `escanear_dependencias` fail-closed; referencia por nombre: sin enlaces fuera del repo); dominio runbooks de gsc-server.
- Fecha de registro: 2026-10-25.

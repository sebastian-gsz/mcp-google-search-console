# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [SemVer](https://semver.org/lang/es/). Las tareas de cada entrega viven documentadas en `docs/workboard/items/_done/` con su evidencia.

## [1.0.1] - 2026-10-25

Primera release pública: servidor MCP completo para Google Search Console con el harness documental operativo.

### Añadido

- **Servidor MCP** (`mcp-server-gsc`): 15 herramientas que cubren el 100 % de la API de Search Console (9/9 métodos) — search analytics (hasta 25 000 filas con paginación automática, filtros regex), sites, sitemaps y URL inspection (individual y en lote, acotada a la cuota).
- **Analítica SEO pura y testeable**: detección de quick wins (gradación High/Medium/Low), comparación de periodos con deltas, detección de canibalización de keywords.
- **Tres transportes** sobre un núcleo neutral de plataforma: stdio (escritorio/Smithery), HTTP/SSE con Bearer auth obligatorio (Docker/Code Engine) y Cloudflare Workers.
- **Harness documental** (red de contratos `ARCHITECTURE.md` navegable por hipervínculos, workboard con claims atómicos y 15 ítems cerrados con evidencia, protocolos canónicos de optimización, bitácora de auditoría aprobada).
- **Capa determinista**: hook pre-commit (verificador del workboard + bloqueo de `.env`/`worktrees/` + patrones de secretos) y verificador mecánico `verify-workboard.mjs`.
- **Tests unitarios** de la analítica pura (13 casos, node:test vía tsx, con caminos no felices) y scripts `test` / `test:types`.
- **README**, **LICENSE** (MIT) y este changelog.

### Seguridad

- Fork local activo por doble vía (npm `overrides` + pnpm `pnpm-workspace.yaml`) de `buffer-equal-constant-time` 1.0.2: `crypto.timingSafeEqual` sin manipular `Buffer.prototype` (el original 1.0.x parcheaba el prototipo global).
- **Migración zod 3 → 4.6.7** (GHSA-mrhx-c7xc-m3w5, high): JSON Schema nativo de zod 4 para los descriptores MCP, `error.issues`, y el split de `dimensions` movido al consumidor.
- **`undici` fijada a 7.30.1** (fix de la línea 7; GHSA-4qv8-2p9j-2685, GHSA-f72v-6w45-q472, GHSA-xjj6-f33q-929c vía wrangler/miniflare) y **`wrangler` 4.152.0**.
- **Auditoría SCA del árbol resuelto** (235 paquetes) con el escáner de `mcp-cves`: 77 CVEs detectados → **31 residuales tras remediación**, 0 en el catálogo KEV de CISA y 0 con arma pública. Elevaciones: `hono` 4.13.14, `@modelcontextprotocol/sdk` 1.32.2, `@hono/node-server` 2.1.5.
- Riesgo aceptado y documentado: `uuid 9.0.1` vía `googleapis@146` (moderate; explota solo pasando `buf` a uuid v3/v5/v6 — gaxios no lo hace). El upgrade de googleapis se evaluará en una entrega futura.
- VCS con rama única `main`, capa determinista activa y sin secretos en el repositorio (`.env`/`credentials.json` ignorados desde el primer commit).

### Cambiado

- Versión del paquete y `ServerInfo` del servidor: 0.3.0 → **1.0.1**.
- Historial de Git colapsado a un commit inicial a petición del operador; la trazabilidad de las tareas vive en `docs/workboard/items/_done/`.

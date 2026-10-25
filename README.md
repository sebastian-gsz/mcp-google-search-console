# mcp-server-gsc — Servidor MCP para Google Search Console

Servidor de [Model Context Protocol](https://modelcontextprotocol.io) (MCP) para **Google Search Console**, escrito en TypeScript: expone la API de GSC como herramientas que un cliente MCP (Claude Desktop, agentes LLM, MCP Inspector…) puede invocar directamente — analítica de búsqueda con hasta 25 000 filas y filtros regex, detección de quick wins, canibalización de keywords, comparación de periodos e inspección de indexación en lote.

## Características

- **15 herramientas MCP** que cubren el **100 % de la API de Search Console** (9/9 métodos): search analytics, sites, sitemaps y URL inspection.
- **Analítica SEO incluida**: quick wins (impresiones/CTR/posición con gradación High/Medium/Low), comparación de periodos con deltas, detección de canibalización, inspección de URLs en lote (acotada a la cuota de la API).
- **Paginación automática**: `rowLimit` hasta 25 000 filas encadenando `startRow`.
- **Filtros avanzados**: regex sobre la dimensión `query` (`includingRegex`/`excludingRegex`), filtros por página, país y dispositivo.
- **Tres transportes**: stdio (escritorio), HTTP/SSE con **Bearer auth obligatorio** (Docker/Code Engine) y Cloudflare Workers.
- **Núcleo neutral de plataforma**: los entrypoints solo adaptan transporte; la lógica vive en `src/lib/` y no lee `process.env` ni bindings.

## Herramientas

`list_sites` · `get_site_details` · `add_site` · `delete_site` · `search_analytics` · `enhanced_search_analytics` · `detect_quick_wins` · `compare_periods` · `detect_cannibalization` · `index_inspect` · `batch_index_inspection` · `list_sitemaps` · `get_sitemap` · `submit_sitemap` · `delete_sitemap`

## Instalación y uso

```bash
pnpm install && pnpm run build   # compila a dist/ (Node >= 20)
```

**stdio** (Claude Desktop, Smithery):

```bash
GOOGLE_JSON_KEY='<service-account JSON>' node dist/entrypoints/stdio.js
```

**HTTP/SSE** (Docker, Code Engine):

```bash
GOOGLE_JSON_KEY='<service-account JSON>' MCP_API_TOKEN='<token>' PORT=8080 node dist/entrypoints/server-http.js
# GET /health (sin auth) · /mcp exige Authorization: Bearer <MCP_API_TOKEN> (sin token responde 503)
```

**Cloudflare Workers**: `wrangler deploy` con el binding `GOOGLE_CREDENTIALS`.

Credenciales (orden de precedencia): `GOOGLE_JSON_KEY` (cadena JSON) → `GOOGLE_APPLICATION_CREDENTIALS` (ruta a keyfile) → `credentials.json` en el directorio de trabajo. Scope completo `webmasters`: las herramientas de escritura (`add_site`, `delete_site`, `submit_sitemap`, `delete_sitemap`) operan sobre la propiedad real.

## Verificación

```bash
pnpm test          # batería unitaria de la analítica pura (node:test vía tsx)
pnpm test:types    # tsc sobre tests + producto
pnpm exec tsc --noEmit
pnpm run build     # solo a petición explícita
```

## Seguridad

- Dependencia transitiva `buffer-equal-constant-time` sustituida por un **fork local** (`patches/`, activo por doble vía npm/pnpm) que usa `crypto.timingSafeEqual` sin manipular `Buffer.prototype`.
- Auditoría SCA del árbol resuelto (235 paquetes) con el escáner CVE de [`mcp-cves`](https://github.com/sebastian-gsz/mcp-cves): 77 CVEs detectados → 31 residuales tras remediación, **0 en el catálogo KEV de CISA y 0 con arma pública**; los residuales son transitivos de googleapis/wrangler con riesgo aceptado y documentado.
- Sin secretos en el repositorio: `.env`, `.env.*` y `credentials.json` ignorados desde el primer commit; hook pre-commit que bloquea workboard inválido, `.env` y patrones de secretos.

## Navegación del proyecto

Este repositorio se navega como un **árbol de contratos**: empieza por [`AGENTS.md`](AGENTS.md) → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) (mapa central, leyes y tabla de ruteo) y desciende por los contratos de cada nodo. El trabajo se gestiona en [`docs/workboard/`](docs/workboard/README.md) (claims atómicos, evidencia y cierre); los cambios de comportamiento se sincronizan con su contrato en la misma entrega.

Historial de cambios: [`CHANGELOG.md`](CHANGELOG.md).

## Licencia

[MIT](LICENSE) — J. Sebastián G. Sánchez

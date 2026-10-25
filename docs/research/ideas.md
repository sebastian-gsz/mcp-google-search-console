# Ideas de explotación — destilado de investigación

> Fuente: `docs/research/raw/` (Google Search Central blog con artículos completos, referencia oficial de searchanalytics.query, SEJ/Moz/Ahrefs/Semrush vía RSS, docs de la API).
> Fecha: 2026-10-21. Método: fetch ligero (ver `tools/research/fetch-research.mjs`).

## A. Hallazgos de máxima prioridad — la API ya soporta más de lo que exponemos

Verificado contra la referencia oficial de `searchanalytics.query` descargada
(`raw/gsc-api-searchanalytics.txt`):

### A1. Nuevos valores de `type` que nuestro schema NO acepta ★
La API acepta hoy: `discover`, `googleNews`, `news`, `image`, `video`, `web`.
Nuestro `SearchAnalyticsSchema` solo acepta `web|image|video|news`.
- **Acción**: ampliar el enum en `schemas.ts` (una línea).
- **Herramienta nueva que habilita (T8)**: `discover_performance` — rendimiento de
  Discover y Google News separado de la búsqueda clásica. Combina con
  `aggregationType: byPage` (no soportado por byProperty en discover).
- Cubre la idea del notebook T3 (discover breakdown) sin depender de searchAppearance.
- Fuente: blog oficial "web multimodal Search performance reporting" (sep-2026) —
  Google está empujando este reporting ahora; el multimodal se filtra por
  `searchAppearance`, ver A2.

### A2. `dataState: "hourly_all"` + dimensión `hour` ★
La API acepta `dataState:"hourly_all"` cuando se agrupa por `hour` (nuestro schema
tampoco lista `hour` entre dimensiones válidas).
- **Acción**: añadir `hour` a la lista de dimensiones y `"hourly_all"` como valor
  de `dataState`.
- **Herramienta nueva (T9)**: `hourly_performance` — patrón horario de clics
  (cuándo publica/actualiza la competencia, cuándo pico de impresiones). Además la
  respuesta incluye `metadata.first_incomplete_hour` que conviene propagar.
- Fuente: referencia oficial, campos `dataState` y `metadata`.

### A3. `searchAppearance` como filtro, no solo dimensión
Se puede filtrar por feature concreto (p. ej. `NEWS_SHOWCASE`, y los nuevos valores
multimodal) aunque no se agrupe por ello. Listado de valores obtenible con una query
agrupando por `searchAppearance`.
- **Acción (T10)**: herramienta `search_appearance_breakdown` que primero agrupa por
  searchAppearance (inventario de features) y luego permite filtrar por uno.
- Complementa el tipo multimodal anunciado en el blog (Lens, Circle to Search):
  aparecerá como valor de searchAppearance.

### A4. `responseAggregationType` y `metadata` en la respuesta
Nuestros handlers devuelven `response.data` completo, así que ya viajan — pero
`detect_quick_wins`, `compare_periods` y `detect_cannibalization` reconstruyen el
objeto y los pierden. **Acción**: propagar `metadata` (aviso de datos incompletos)
cuando `dataState != final`.

## B. Ideas del ecosistema (blogs) mapeadas al servidor

| Idea (fuente) | Encaje en el MCP | Estado |
|---|---|---|
| "35 formas de usar Claude Code para SEO" (Ahrefs) — análisis GSC automatizado con agentes | Nuestro MCP es exactamente la capa de datos para ello; priorizar T2 `page_performance` y T1 `daily_trend` del notebook | Refuerza roadmap |
| Bulk data exports + APIs para automatizar (blog técnico Google, oct-2026) | El MCP ya cubre lo que los exports dan; idea de negocio: exponer `compare_periods` como informe automático | Ya cubierto |
| Reporting multimodal / Lens (blog oficial, sep-2026) | A1 + A3 arriba | **Nueva herramienta T8/T10** |
| Plataformas sociales y vídeo como propiedades (blog oficial, jul-2026) | `list_sites` ya las listará si la cuenta las tiene; nada que hacer salvo documentar | Nota |
| Site reputation policy (ago-2026) | Auditoría: `page_performance` agrupado por subcarpeta detecta secciones de terceros | Encaja en T2 |

## C. Fuentes: qué funcionó y qué no

| Fuente | Resultado |
|---|---|
| Google Search Central (RSS + 5 artículos completos) | ✔ oro: novedades oficiales |
| Referencia oficial searchanalytics.query | ✔ verificable, la base de la sección A |
| Search Engine Journal / Moz / Ahrefs / Semrush (RSS) | ✔ resúmenes; Ahrefs dio la pista de agentes SEO |
| Search Engine Land | ✘ HTTP 403 (anti-bot); usar su sitemap manualmente si hace falta |
| Reddit r/SEO, r/bigseo | ✘ robots.txt bloquea; alternativa: old.reddit o búsqueda manual |
| Docs urlInspection/limits | ✘ URL 404 en la descarga; recuperables de la referencia index |

Re-ejecutable: `node tools/research/fetch-research.mjs`.

## D. Priorización actualizada

| # | Herramienta / cambio | Esfuerzo | Valor | Origen |
|---|---|---|---|---|
| 1 | A1: enum `type` + `discover_performance` (T8) | Muy bajo | Alto | API + blog oficial |
| 2 | A2: `hour` + `hourly_all` + `hourly_performance` (T9) | Bajo | Medio-alto | API |
| 3 | T1 `daily_trend` (notebook) | Bajo | Alto | Notebook |
| 4 | T2 `page_performance` (notebook) | Bajo | Alto | Notebook + Ahrefs |
| 5 | A3 `search_appearance_breakdown` (T10) | Medio | Medio | API |
| 6 | A4 propagar `metadata` | Mínimo | Medio | API |

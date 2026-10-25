# Notebook — GSC Server: documentación, cobertura de API y herramientas nuevas

> Fecha: 2026-10-21 · Proyecto: `P:\.workspace\archive\gsc-server` (mcp-server-gsc 0.3.0)

---

## 1. Documentación oficial (enlaces vivos)

| Recurso | URL |
|---|---|
| Portal de la API | https://developers.google.com/webmaster-tools |
| Referencia REST v1 (autoritativa) | https://developers.google.com/webmaster-tools/v1/api_reference_index |
| searchanalytics.query | https://developers.google.com/webmaster-tools/v1/searchanalytics/query |
| urlInspection.index.inspect | https://developers.google.com/webmaster-tools/v1/urlInspection/index/inspect |
| Sitemaps | https://developers.google.com/webmaster-tools/v1/sitemaps |
| Sites | https://developers.google.com/webmaster-tools/v1/sites |
| Límites y cuotas | https://developers.google.com/webmaster-tools/v1/limits |
| Client libraries (Node) | https://developers.google.com/webmaster-tools/v1/libraries |

**Estado de la versión**: `searchconsole_v1` sigue siendo la versión actual (estable desde
2019); no hay v2 anunciada. Cambios recientes relevantes: `dataState` (datos frescos) y
operadores de filtro regex (`includingRegex` / `excludingRegex`) en searchanalytics.

## 2. Cuotas y límites (a respetar en las herramientas)

| API | Límite |
|---|---|
| Search Analytics | 1 200 queries/minuto por proyecto |
| URL Inspection | **2 000 consultas/día** y 600/minuto por propiedad |
| Sitemaps / Sites | Sin cuota documentada específica |

Implicación de diseño: `batch_index_inspection` ya acota a 100 URLs por llamada;
una herramienta que recorra un sitemap completo debe planificar por lotes y días.

## 3. Superficie completa de la API vs. cobertura del servidor

La API tiene **9 métodos**. Cobertura actual: **9/9 (100 %)**.

| Método API | Herramienta en el servidor | Estado |
|---|---|---|
| `searchanalytics.query` | `search_analytics`, `enhanced_search_analytics`, `detect_quick_wins`, `compare_periods`, `detect_cannibalization` | ✔ completa (rowLimit paginado, regex, dataState) |
| `sitemaps.list` | `list_sitemaps` | ✔ |
| `sitemaps.get` | `get_sitemap` | ✔ |
| `sitemaps.submit` | `submit_sitemap` | ✔ (scope completo corregido) |
| `sitemaps.delete` | `delete_sitemap` | ✔ |
| `sites.list` | `list_sites` | ✔ |
| `sites.get` | `get_site_details` | ✔ |
| `sites.add` | `add_site` | ✔ |
| `sites.delete` | `delete_site` | ✔ |
| `urlInspection.index.inspect` | `index_inspect`, `batch_index_inspection` | ✔ |

**Conclusión**: no quedan endpoints por descubrir. El valor nuevo está en (a) parámetros
de `searchanalytics.query` que aún no exponemos y (b) herramientas analíticas que
combinan datos. Eso es la sección 4.

## 4. Parámetros de searchanalytics.query aún sin explotar

| Parámetro | Qué da | Herramienta nueva que habilita |
|---|---|---|
| `dimensions: ["searchAppearance"]` | Desglose por **tipo de resultado**: Discover, News Showcase, AMP, resultados ricos | `discover_news_breakdown` |
| `aggregationType: "byPage"` | Métricas por página sin re-sumar entre queries | `page_performance` |
| `dimensions: ["date"]` | Serie temporal diaria | `daily_trend` |
| `dimensionFilterGroups` multi-grupo | Filtros AND/OR anidados | Filtros avanzados en `search_analytics` |
| `type: "news"` / `"video"` / `"image"` | Rendimiento vertical no-web | Ya disponible como parámetro, falta herramienta dedicada con comparativa |

## 5. Herramientas nuevas propuestas (a desplegar y probar)

Ordenadas por valor/esfuerzo. Las marcadas 🔧 son funciones puras en
`src/lib/gsc/analytics.ts` (testeables sin red).

### T1. `daily_trend` — serie temporal con media móvil
**Esfuerzo: bajo · API: `dimensions:["date"]` + 🔧**
Serie diaria de clics/impresiones/CTR/posición + media móvil de 7 días + detección
de caídas anómalas (> 30 % sobre la media móvil). Responde: "¿me cayó el tráfico ayer
o es ruido?".
**Probar**: periodo de 90 días en una propiedad con tráfico estable.

### T2. `page_performance` — rendimiento consolidado por página
**Esfuerzo: bajo · API: `aggregationType:"byPage"`, `dimensions:["page"]`**
Top páginas con clics, impresiones, CTR, posición, agrupables por prefijo de URL
(p. ej. `/blog/`). El Python tenía un equivalente; superarlo añadiendo agrupación por
patrón.
**Probar**: agrupar `/blog/` vs `/productos/` y validar que las sumas cuadran.

### T3. `discover_news_breakdown` — rendimiento por tipo de resultado
**Esfuerzo: medio · API: `searchAppearance`**
Descubre cuánto tráfico viene de Discover vs. búsqueda clásica vs. News. Muchas
propiedades ni saben que tienen Discover.
**Probar**: cualquier propiedad con tráfico de Discover; sinón: filas vacías (informativo).

### T4. `ctr_curve_benchmark` — CTR real vs. curva esperada por posición 🔧
**Esfuerzo: medio · API: `dimensions:["query"]` + función pura**
Compara el CTR de cada query con el CTR mediano esperado para su posición (curva
conocida del sector). Señala queries cuyo snippet pierde clics frente a pares.
Complementa a `detect_quick_wins` con un criterio distinto al del umbral fijo.
**Probar**: función pura con tabla de posiciones 1-20 sintética antes de conectar API.

### T5. `keyword_clusters` — agrupación de queries por intención 🔧
**Esfuerzo: medio-alto · sin API nueva (n-gramas + shared-pages)**
Agrupa queries por n-gramas compartidos y páginas de aterrizaje comunes. Solo
heurística léxica (sin embeddings para mantener el servidor sin dependencias
externas). Responde: "¿qué familias temáticas tengo?".
**Probar**: función pura con 100 queries sintéticas; medir silueta simple no requerido.

> **Actualización 2026-10-21** — la investigación de fuentes (`docs/research/ideas.md`)
> añadió las propuestas T8 `discover_performance`, T9 `hourly_performance` y
> T10 `search_appearance_breakdown`, y verificó contra la referencia oficial que la
> API ya acepta `type: discover|googleNews`, la dimensión `hour` con
> `dataState: "hourly_all"`, y `searchAppearance` como filtro. La priorización
> actualizada está en la sección D de ese documento.

### T6. `sitemap_coverage_gap` — URLs del sitemap no indexadas
**Esfuerzo: alto · API: `sitemaps.list` + `urlInspection` en lotes**
Cruza URLs declaradas en sitemap contra su estado de indexación (lotes de 100/día
por la cuota). Informe de brechas: declaradas pero excluidas, canónicas a otra URL, etc.
**Probar**: sitemap pequeño (≤ 50 URLs) para no quemar la cuota diaria.

### T7. `search_analytics` avanzado — filtros multi-grupo
**Esfuerzo: bajo · API: dimensionFilterGroups**
Permitir pasar grupos de filtros con `groupType` and/or en `search_analytics`
(hoy solo se puede un grupo AND con 2 filtros). Habilita consultas tipo
"(país = ESP o MEX) y (query contiene 'precio')".

## 6. Plan de prueba sugerido para cada despliegue

1. Compilar: `npm run build` (tsc estricto, sin errores).
2. Humo stdio: `tools/list` → contar herramientas nuevas.
3. Funciones puras 🔧: script node con datos sintéticos antes de gastar cuota.
4. Contra la API real: 1 propiedad con tráfico conocido, comparar 2-3 cifras con la
   interfaz web de Search Console (mismo rango de fechas, `dataState:"final"`).
5. Registrar resultado de la prueba en este notebook (sección 7).

## 7. Registro de pruebas

| Fecha | Herramienta | Resultado | Notas |
|---|---|---|---|
| 2026-10-21 | (build + humo 15 herramientas) | OK | tsc limpio; tools/list correcto |
| 2026-10-21 | investigación de fuentes (tools/research/) | OK | 6 fuentes capturadas → `docs/research/ideas.md`: nuevos `type` (discover/googleNews), `hour`+`hourly_all`, searchAppearance como filtro |

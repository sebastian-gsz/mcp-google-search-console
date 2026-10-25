---
title: ARCHITECTURE.md — Fruto «src/lib/tools»
Rol: Registro y definiciones de las herramientas MCP del servidor
Objetivo: Regular y documentar el catálogo de herramientas expuestas por el servidor MCP y el patrón para añadir nuevas.
Nivel: Fruto
Estado: implemented
Padre: ../ARCHITECTURE.md
Lectura obligatoria: SÍ — antes de inspeccionar o modificar archivos de este fruto.
---

<br>**↑ Padre**: [src/lib/ARCHITECTURE.md](../ARCHITECTURE.md) — reglas del núcleo neutral y colocación entre capas.<br/>

## 1. Alcance y autoridad

Este contrato se aplica exclusivamente a `src/lib/tools/`. Documenta el catálogo de herramientas MCP, el contrato `ToolDefinition` y el flujo de alta de una herramienta nueva.

- **Entrada**: argumentos validados por el esquema Zod de cada herramienta y `ToolContext` con el `SearchConsoleService` ya autenticado.
- **Proceso**: cada herramienta construye peticiones a la API (vía el servicio) y/o analítica pura; resultados serializados a JSON.
- **Salida**: `ToolResult` — `{ content: [{ type: 'text', text: JSON }], isError? }`.

Quedan fuera la autenticación y las llamadas HTTP reales (`src/lib/gsc/`) y la exposición del protocolo MCP (`src/lib/server.ts`).

## 2. Cláusulas de comportamiento e implementación

1. Lee este contrato, el contrato del padre y la cadena superior antes de modificar el fruto.
2. Antes de trabajo operativo, consulta [docs/workboard](../../../docs/workboard/ARCHITECTURE.md) y cumple claim, autorización, bloqueos y criterios.
3. **Clasifica antes de implementar**: declara en el ítem la clase de problema dominante y aplica el protocolo canónico correspondiente; registra la elección en el `decision_log`.
4. **Ley 14 — una herramienta = un módulo + esquema + registro**: módulo aquí, esquema Zod en `src/lib/schemas.ts`, alta en el array `TOOLS` de `index.ts`. Sin alta, la herramienta no existe para `ListTools`/`CallTool`.
5. Toda herramienta implementa `ToolDefinition` (`types.ts`): `name`, `description`, `schema`, `handler(args, ctx)`. Los resultados usan los helpers `textResult`/`errorResult`.
6. Las herramientas son **finas**: no validan (eso es del esquema), no autentican (eso es del servicio), no contienen analítica propia (eso vive en `src/lib/gsc/` o en funciones puras importadas).
7. Los filtros de país y dispositivo solo admiten operador `equals` (limitación de la API, aplicada en `buildSearchRequestBody`); los filtros de página y query aceptan el `filterOperator` del argumento.
8. Herramientas de lote (batch): los errores individuales **no interrumpen** la iteración; se reportan por URL en el resultado final.
9. Los cambios de comportamiento, archivos, símbolos públicos o dependencias requieren actualizar este contrato en la misma entrega.
10. No alteres ni relajes contratos superiores. Si el cambio requiere hacerlo, detén la ejecución y solicita resolución.

## 3. Mapa real de archivos y símbolos

Contrastado contra la implementación el 2026-10-25 (lectura íntegra de los ocho archivos).

| Archivo | Responsabilidad comprobada | Símbolos / contenido |
|---|---|---|
| `types.ts` | Contrato de herramienta y helpers de resultado. | `interface ToolContext`, `interface ToolResult`, `interface ToolDefinition<S>`, `function textResult`, `function errorResult` |
| `index.ts` | Registro único `TOOLS` (15 herramientas) y lookup. | `const TOOLS`, `function listToolDescriptors` (con `z.toJSONSchema` nativo de zod 4), `function findTool` |
| `search-analytics.ts` | `search_analytics` y `enhanced_search_analytics`; constructor de cuerpo de petición compartido. | `function buildSearchRequestBody`, `const searchAnalyticsTool`, `const enhancedSearchAnalyticsTool`, re-export de `z` |
| `quick-wins.ts` | `detect_quick_wins` (fija 25 000 filas y dimensiones query+page). | `const detectQuickWinsTool` |
| `compare-periods.ts` | `compare_periods` (dos llamadas en paralelo + deltas, top 25 ganancias/pérdidas). | `const comparePeriodsTool` |
| `detect-cannibalization.ts` | `detect_cannibalization` (query+page, umbral de impresiones). | `const detectCannibalizationTool` |
| `batch-inspection.ts` | `batch_index_inspection` (split por coma/salto de línea, dedup, límite `args.limit` ≤ 100). | `const batchIndexInspectionTool` |
| `sites-and-sitemaps.ts` | Gestión de propiedades y sitemaps + inspección individual. | `listSitesTool`, `getSiteTool`, `addSiteTool`, `deleteSiteTool`, `indexInspectTool`, `listSitemapsTool`, `getSitemapTool`, `submitSitemapTool`, `deleteSitemapTool` |

**Catálogo contrastado** (orden del registro en `index.ts`): `list_sites`, `get_site_details`, `add_site`, `delete_site`, `search_analytics`, `enhanced_search_analytics`, `detect_quick_wins`, `compare_periods`, `detect_cannibalization`, `index_inspect`, `batch_index_inspection`, `list_sitemaps`, `get_sitemap`, `submit_sitemap`, `delete_sitemap` — 15 herramientas.

## 4. Grafo funcional aprobado

```text
server.ts (CallToolRequest) → findTool(name) en index.ts
    ↓
tool.schema.parse(arguments)  ← esquema Zod de src/lib/schemas.ts
    ↓
tool.handler(args, { service: SearchConsoleService })
    ├── Analytics tools → buildSearchRequestBody → service.searchAnalytics / enhancedSearchAnalytics
    ├── Sites/sitemaps/inspection → service.<operación>
    └── Analítica pura → comparePeriods / detectCannibalization / detectQuickWins (src/lib/gsc)
    ↓
textResult(JSON) → ServerResult del SDK (content/isError)
```

Dependencias aprobadas:

- Las herramientas importan de `../schemas.js` (esquemas), `../gsc/client.js` (servicio y `detectQuickWins`), `../gsc/analytics.js` (comparePeriods, detectCannibalization) y `./types.js`. Ninguna importa `googleapis` directamente.
- Errores y efectos comprobados: toda llamada a la API puede lanzar (el handler de `server.ts` convierte en `isError`); `batch_index_inspection` captura por URL; herramientas de análisis devuelven mensaje cuando no hay filas.

## 5. Configuración, datos y resultados

| Parámetro / dato | Fuente | Efecto |
|---|---|---|
| `siteUrl` | Argumento obligatorio de casi todas las herramientas | Propiedad de GSC objetivo (`sc-domain:` o URL-prefix; el servicio normaliza) |
| `rowLimit` | Argumento (default 1000, máx 25 000) | Volumen de filas; paginación automática en el servicio |
| `dataState` | Argumento (`all` default / `final`) | Datos frescos vs consolidados |
| `limit` (batch) | Argumento (default 50, máx 100) | Techo anti-cuota de `batch_index_inspection` (cuota: 2 000 inspecciones/día por propiedad) |
| `quickWinsThresholds` | Argumento opcional | Umbrales de detección de quick wins |

## 6. Verificación reproducible

### 6.1 Verificación por archivo (ley 10 del mapa maestro)

| Verificación | Comando | Cobertura |
|---|---|---|
| Tipado estático | `pnpm exec tsc --noEmit` (proyecto completo, heredado del tronco) | Todos los archivos del fruto |
| Build completo | `pnpm run build` | Solo a petición explícita |
| Test unitario | no configurado — límite declarado; puntero: workboard (MCP-003) | — |
| Listado del catálogo | `node -e "import('./dist/entrypoints/stdio.js')"` no aplica en stdio; verificación del registro vía build + lectura de `index.ts` | Coherencia módulo ↔ registro |

### 6.2 Prueba o validación funcional

- **Realismo**: la validación incluye al menos un camino no feliz (entrada inválida, fuente caída, resultado vacío) — un flujo solo probado en su camino feliz no está validado.
- **Prueba o comando**: `pnpm exec tsc --noEmit` en verde tras cualquier cambio (requiere `pnpm install` previo; durante el montaje documental no se ejecutó — sin `node_modules` en el entorno, y el parasitaje no instala dependencias).
- **Superficie cubierta**: coherencia estática del registro y de las firmas `ToolDefinition`.
- **Límites**: no se han invocado herramientas contra la API real (sin credenciales en el entorno); los caminos no felices documentados (filas vacías, error por URL en batch, 503 de `/mcp` sin token) provienen del contraste de código, no de ejecución.

No presentes pruebas no ejecutadas como aprobadas; conserva la evidencia de cada tarea en el workboard.

### 6.3 Checklist de PR (convención ítem → rama → PR del workboard)

- Rama `<tipo>/<ID>-<slug>` creada al reclamar; un PR por ítem.
- Título `(<ID>) <título del ítem>`.
- Criterios de aceptación verificados y evidencia pegada en el cuerpo del PR y del ítem.
- Diff pequeño y enfocado; resumen de qué cambió y por qué.
- Validaciones de §6.1 y `node verify-workboard.mjs` en verde.
- Sin logs de depuración ni comentarios sobrantes.

### 6.4 Test first mode (cláusula opcional del nodo)

- En herramientas con lógica de transformación propia (p. ej. `buildSearchRequestBody`, parsing de URLs del batch): tests primero hasta verde.
- El default: tareas de lógica no trivial.

## 7. Parámetros de protocolo especializados

Sin caso real medido: este fruto usa los defaults canónicos de `docs/conocimiento/protocolos/` y no declara parámetros. (El lote máximo de 100 URLs de la inspección es un límite de cuota de la API aplicado en el esquema, no una especialización de protocolo.)

## 8. Convenciones y antipatrones locales

- Descripciones de herramientas en inglés (son la interfaz hacia el LLM cliente); mensajes de error de negocio en español, coherente con el resto del producto.
- `search-analytics.ts` re-exporta `z` — acceso conveniente para módulos del fruto; no abuses: los esquemas viven en `schemas.ts`.
- Prohibido: registrar una herramienta sin esquema en `schemas.ts`; duplicar lógica de filtros fuera de `buildSearchRequestBody`; devolver filas crudas sin `textResult`.
- La descripción de cada herramienta es contrato ante el cliente LLM: si cambias parámetros, actualiza la descripción y el esquema en la misma entrega.

## 9. Términos y condiciones

1. **Autoridad**: este contrato está subordinado a `src/lib/ARCHITECTURE.md` y a la cadena superior.
2. **Estado `implemented`**: mapa y grafo describen comportamiento existente, aprobado y contrastado, no trabajo futuro.
3. **Propiedad**: el conocimiento específico del catálogo permanece en este fruto; las reglas compartidas pertenecen al nivel compartido autorizado.
4. **Workboard**: es la fuente exclusiva para ciclo de trabajo, claims, autorizaciones y evidencia.
5. **Finalización y fallo**: comunica límites, errores y validaciones fallidas; no declares éxito completo si queda una condición de aceptación sin verificar.

---
*Fin del contrato de `src/lib/tools/`. Sube a [src/lib/ARCHITECTURE.md](../ARCHITECTURE.md) para las reglas de la rama.*

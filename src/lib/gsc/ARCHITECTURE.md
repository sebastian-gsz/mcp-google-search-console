---
title: ARCHITECTURE.md — Fruto «src/lib/gsc»
Rol: Capa de acceso a la API de Google Search Console y analítica pura
Objetivo: Regular y documentar el acceso a la API de GSC, la paginación, la normalización de propiedades y las funciones de analítica sobre filas.
Nivel: Fruto
Estado: implemented
Padre: ../ARCHITECTURE.md
Lectura obligatoria: SÍ — antes de inspeccionar o modificar archivos de este fruto.
---

<br>**↑ Padre**: [src/lib/ARCHITECTURE.md](../ARCHITECTURE.md) — reglas del núcleo neutral y colocación entre capas.<br/>

## 1. Alcance y autoridad

Este contrato se aplica exclusivamente a `src/lib/gsc/`. Documenta el comportamiento aprobado y contrastado: el cliente de la API, la analítica pura y la detección de oportunidades.

- **Entrada**: credenciales de service account (cadena JSON o ruta a keyfile), cuerpos de petición `searchanalytics` y parámetros de las herramientas.
- **Proceso**: autenticación (`GoogleAuth`, scope completo `webmasters`), normalización de `siteUrl` con reintento, paginación automática, y análisis en memoria sobre filas.
- **Salida**: respuestas de la API (`{ data }`) y resultados de analítica puros (`PeriodComparison[]`, `CannibalizationEntry[]`, quick wins).

Quedan fuera la definición de herramientas (`src/lib/tools/`), la validación de argumentos (`src/lib/schemas.ts`) y el transporte (entrypoints).

## 2. Cláusulas de comportamiento e implementación

1. Lee este contrato, el contrato del padre y la cadena superior antes de modificar el fruto.
2. Antes de trabajo operativo, consulta [docs/workboard](../../../docs/workboard/ARCHITECTURE.md) y cumple claim, autorización, bloqueos y criterios.
3. **Clasifica antes de implementar**: declara en el ítem la clase de problema dominante (`datos | red | cómputo | agente`) y aplica el protocolo canónico correspondiente de `docs/conocimiento/protocolos/`; registra la elección y los umbrales en el `decision_log`.
4. **Encapsulación** (ley 15): solo `client.ts` importa `googleapis`/`google-auth-library`. Cualquier nueva llamada a la API de GSC se añade como método de `SearchConsoleService`; prohibido instanciar clientes de Google fuera de este fruto.
5. `normalizeUrl` + `withSiteUrlFallback` son la única vía para resolver propiedades: `sc-domain:` y URLs con protocolo se respetan; dominios pelados se convierten a `https://<dominio>/`; el reintento normalizado solo ocurre ante errores de permisos.
6. La paginación de `searchAnalytics` encadena `startRow` mientras la API devuelva exactamente bloques de 25 000 filas y no se alcance el límite pedido; el resultado se recorta al `rowLimit` solicitado.
7. La analítica (`analytics.ts`, `detectQuickWins`) es **pura**: recibe filas `{ keys, clicks, impressions, ctr, position }` y no toca red, disco ni reloj — testeable con datos fijos.
8. Los errores de la API se propagan como excepción hacia el llamador (`server.ts` los convierte en `ToolResult` con `isError`); este fruto no devuelve errores silenciosos.
9. Los cambios de comportamiento, archivos, símbolos públicos o dependencias requieren actualizar este contrato en la misma entrega.
10. No alteres ni relajes contratos superiores. Si el cambio requiere hacerlo, detén la ejecución y solicita resolución.

## 3. Mapa real de archivos y símbolos

Contrastado contra la implementación el 2026-10-25 (lectura íntegra de ambos archivos).

| Archivo | Responsabilidad comprobada | Símbolos / contenido |
|---|---|---|
| `src/lib/gsc/client.ts` | Única puerta a la API de GSC: auth, propiedades, paginación, operaciones de sites/sitemaps/inspección; detección de quick wins. | `class SearchConsoleService` (métodos: `searchAnalytics`, `enhancedSearchAnalytics`, `listSites`, `getSite`, `addSite`, `deleteSite`, `listSitemaps`, `getSitemap`, `submitSitemap`, `deleteSitemap`, `indexInspect`; privados: `getClient`, `normalizeUrl`, `withSiteUrlFallback`), `function detectQuickWins`, `type SearchanalyticsQueryRequest` |
| `src/lib/gsc/analytics.ts` | Analítica pura en memoria: comparación de periodos y detección de canibalización. | `interface GscRow`, `interface PeriodMetrics`, `interface PeriodComparison`, `function comparePeriods`, `interface CannibalizationEntry`, `function detectCannibalization` (privadas: `toMetrics`, `delta`) |
| `src/lib/gsc/analytics.test.ts` | Batería unitaria de `comparePeriods` y `detectCannibalization` con caminos felices y no felices (node:test). | `describe/it` sobre `comparePeriods` (4 casos) y `detectCannibalization` (4 casos) |
| `src/lib/gsc/quickwins.test.ts` | Batería unitaria de `detectQuickWins` con caminos felices y no felices (node:test). | `describe/it` sobre `detectQuickWins` (5 casos) |

## 4. Grafo funcional aprobado

```text
Herramienta (src/lib/tools) — service: SearchConsoleService
    ↓
SearchConsoleService.getClient()  ← GoogleAuth (scope https://www.googleapis.com/auth/webmasters)
    ↓
API call (searchanalytics / sites / sitemaps / urlInspection)
    ├── withSiteUrlFallback(siteUrl) → normalizeUrl + reintento ante «permission»
    └── searchAnalytics → paginación por bloques de 25 000 (startRow) → recorte a rowLimit
    ↓
Filas { keys, clicks, impressions, ctr, position }
    ↓
Analítica pura: comparePeriods · detectCannibalization · detectQuickWins
    ↓
Resultado JSON a la herramienta (textResult)
```

Dependencias aprobadas:

- `client.ts` importa de `googleapis` y `google-auth-library` (comprobado: únicos imports externos); `analytics.ts` no importa nada.
- Efectos externos comprobados: llamadas HTTPS a la API de Search Console con credenciales de service account; sin disco, sin estado persistente (el cliente API se cachea en la instancia).
- Errores comprobados: JSON de credenciales inválido (constructor lanza), cuerpo ausente en `searchAnalytics`/`enhancedSearchAnalytics` (lanza), fallo de red/permisos (propaga el `Error` de la API).

## 5. Configuración, datos y resultados

| Parámetro / dato | Fuente | Efecto |
|---|---|---|
| Credenciales (JSON string o keyfile) | Argumento de `createServer` → entrypoints | Autenticación de toda la capa; scope `webmasters` (lectura + escritura) |
| `rowLimit` | Cuerpo de la petición (default 1000, máx 25 000 por schema) | Filas solicitadas; >25 000 se pagina automáticamente |
| Umbrales de `detectQuickWins` | Argumentos de la herramienta (defaults: 50 impresiones, CTR ≤ 2 %, posiciones 4–10; CTR objetivo 5 %) | Filtrado y gradación High/Medium/Low de oportunidades |
| Umbrales de `detectCannibalization` | Argumentos de la herramienta (defaults: 30 impresiones, ≥ 2 páginas) | Filtrado de queries canibalizadas y cálculo de `spread` |

## 6. Verificación reproducible

### 6.1 Verificación por archivo (ley 10 del mapa maestro)

| Verificación | Comando | Cobertura |
|---|---|---|
| Tipado estático | `pnpm exec tsc --noEmit` (proyecto completo, heredado del tronco) | Ambos archivos contra `tsconfig.json` |
| Tipado de tests | `pnpm test:types` (`tsc -p tsconfig.test.json`) | Tests y producto juntos, sin emitir a `dist/` |
| Build completo | `pnpm run build` | Solo a petición explícita (los tests quedan excluidos del build) |
| Test unitario | `pnpm test` (`tsx --test`, node:test) | comparePeriods, detectCannibalization y detectQuickWins — 13 casos con caminos no felices |

### 6.2 Prueba o validación funcional

- **Realismo**: la validación incluye al menos un camino no feliz (entrada inválida, fuente caída, resultado vacío) — un flujo solo probado en su camino feliz no está validado.
- **Prueba o comando**: `pnpm test` en verde (13 casos, incluidos filas vacías, claves ausentes, métricas a cero y filas fuera de umbrales) + `pnpm test:types` + `pnpm exec tsc --noEmit`. Los caminos no felices de la API real (credenciales inválidas, `requestBody` ausente, error de red/permisos) están cubiertos por contrato y regresión unitaria de las funciones puras.
- **Superficie cubierta**: analítica pura al 100 % con regresiones; cliente de API por contraste estático y tipado.
- **Límites**: sin llamadas reales a la API de Google (sin credenciales en el entorno). Nota de entorno: `tsc` necesita `NODE_OPTIONS=--max-old-space-size=1400` en máquinas con ~2 GB de RAM (el `index.d.ts` de googleapis agota el heap por defecto); en Docker/máquinas con más RAM el comando corre tal cual.

No presentes pruebas no ejecutadas como aprobadas; conserva la evidencia de cada tarea en el workboard.

### 6.3 Checklist de PR (convención ítem → rama → PR del workboard)

- Rama `<tipo>/<ID>-<slug>` creada al reclamar; un PR por ítem.
- Título `(<ID>) <título del ítem>`.
- Criterios de aceptación verificados y evidencia pegada en el cuerpo del PR y del ítem.
- Diff pequeño y enfocado; resumen de qué cambió y por qué.
- Validaciones de §6.1 y `node verify-workboard.mjs` en verde.
- Sin logs de depuración ni comentarios sobrantes.

### 6.4 Test first mode (cláusula opcional del nodo)

- En features no triviales de analítica: escribe o actualiza los tests **primero**, luego código hasta verde.
- En regresiones: un test que **reproduce el bug antes del fix** — y queda como regresión para siempre.
- El default de este fruto: toda lógica nueva en `analytics.ts` o en funciones puras de `client.ts` entra con tests.

## 7. Parámetros de protocolo especializados

Sin caso real medido: este fruto usa los defaults canónicos de `docs/conocimiento/protocolos/` y no declara parámetros. Los umbrales de negocio de §5 son comportamiento expuesto por las herramientas, no especializaciones de protocolo.

## 8. Convenciones y antipatrones locales

- Los métodos de escritura (`addSite`, `deleteSite`, `submitSitemap`, `deleteSitemap`) no envuelven la llamada en lógica extra: la herramienta que los expone es la responsable de la confirmación del usuario (ley 16 del mapa maestro).
- `enhancedSearchAnalytics` muta el `requestBody` recibido (añade dimensión `query` y filtro regex): los llamadores no deben reutilizar el objeto tras la llamada.
- La paginación asume que la API devuelve bloques exactos de 25 000 filas: si Google cambia ese invariante, revisar el bucle de `searchAnalytics`.
- Prohibido: catch silencioso de errores de API; instancias de `GoogleAuth` fuera del constructor de `SearchConsoleService`.
- En `comparePeriods`, toda omisión de una fila debe eliminar también su clave del índice (`index.delete(key)`) antes del `continue`: si la clave queda, el bucle de filas desaparecidas la reemite como entrada espuria con deltas a `-0` (bug corregido con MCP-003; regresión fijada en `analytics.test.ts`).

## 9. Términos y condiciones

1. **Autoridad**: este contrato está subordinado a `src/lib/ARCHITECTURE.md` y a la cadena superior.
2. **Estado `implemented`**: mapa y grafo describen comportamiento existente, aprobado y contrastado, no trabajo futuro.
3. **Propiedad**: el conocimiento específico de la API de GSC permanece en este fruto; las reglas compartidas pertenecen al nivel compartido autorizado.
4. **Workboard**: es la fuente exclusiva para ciclo de trabajo, claims, autorizaciones y evidencia.
5. **Finalización y fallo**: comunica límites, errores y validaciones fallidas; no declares éxito completo si queda una condición de aceptación sin verificar.

---
*Fin del contrato de `src/lib/gsc/`. Sube a [src/lib/ARCHITECTURE.md](../ARCHITECTURE.md) para las reglas de la rama.*

---
title: ARCHITECTURE.md — Tronco «tools»
Rol: Pipeline de investigación SEO del proyecto
Objetivo: Regular y documentar el pipeline de descarga de fuentes de investigación que alimenta docs/research/raw/.
Nivel: Tronco
Estado: implemented
Padre: ../docs/ARCHITECTURE.md
Lectura obligatoria: SÍ — antes de inspeccionar o modificar archivos de este tronco.
---

<br>**↑ Padre**: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — mapa maestro, leyes universales y protocolo de lectura.<br/>

## 1. Alcance y autoridad

Este contrato se aplica exclusivamente a `tools/` y regula el pipeline de investigación: descarga de feeds RSS/Atom, páginas de referencia de la API y hilos de Reddit, con conversión a texto plano y salida a `docs/research/raw/`.

- **Entradas**: ninguna del usuario salvo `--max N` (límite de artículos completos por host); fuentes fijadas en constantes internas del script.
- **Proceso**: fetch con `User-Agent` identificable, verificación básica de `robots.txt`, retardos de cortesía entre peticiones, extracción/limpieza de HTML.
- **Salidas**: archivos `.txt` en `docs/research/raw/` (uno por fuente) + resumen por `stdout`.

No regula el producto (`src/`), los parches de dependencias (`patches/`) ni el consumo que se haga del corpus descargado (`docs/research/`).

## 2. Cláusulas de comportamiento e implementación

1. Lee este contrato y todos sus contratos superiores antes de actuar; desciende al nodo específico de la tarea.
2. Antes de trabajo operativo, consulta [docs/workboard](../docs/workboard/ARCHITECTURE.md) y cumple su claim, autorización, bloqueo y cierre.
3. Si no existe autorización o hay conflicto con un contrato superior, detén la acción y registra el impedimento en el workboard.
4. **Sin dependencias**: el script usa solo módulos nativos de Node (>=20: `fetch` global, `AbortSignal.timeout`). Prohibido añadir `node_modules` para una utilidad que el runtime cubre.
5. **Cortesía de red obligatoria**: `User-Agent` identificable (`mcp-server-gsc-research/…`), retardo ≥ 1 500 ms entre peticiones, comprobación de `robots.txt` (regla pragmática global `User-agent: *` + `Disallow: /`) y límite de artículos completos por fuente (`--max`, default 50).
6. **Idempotencia**: re-ejecutar refresca el contenido (sobrescritura); el script no acumula estado propio fuera de `docs/research/raw/`.
7. Los fallos de una fuente se reportan y continúan con las demás (el pipeline no aborta por una fuente caída).
8. Los cambios de comportamiento, archivos, símbolos públicos o dependencias requieren actualizar este contrato en la misma entrega.
9. Para nodos nuevos bajo `tools/`, aplica el protocolo de topología de la [guía de plantillas](../docs/templates/architecture/README.md).

## 3. Topología y tabla de ruteo

| Nodo | Nivel | Estado | Responsabilidad | Contrato |
|---|---|---|---|---|
| `tools/research/fetch-research.mjs` | Fruto de archivo | implemented | Pipeline de investigación (ver §4). | Este contrato (sin contrato propio por archivo) |

No hay subdirectorios con responsabilidad contractual propia: `tools/research/` es agrupador del único script del tronco.

## 4. Mapa y grafo funcional aprobado

Contrastado contra la implementación el 2026-10-25 (lectura íntegra, 229 líneas).

| Archivo | Responsabilidad comprobada | Símbolos / contenido |
|---|---|---|
| `tools/research/fetch-research.mjs` | Pipeline completo: feeds, páginas semilla, Reddit JSON, robots.txt, limpieza HTML, persistencia. | `FEEDS` (6 fuentes), `SEED_PAGES` (3 páginas de la API), `robotsAllows`, `stripHtml`, `extractCdataOrText`, `slugify`, `fetchText`, `save`, `fetchFeed`, `fetchSeed`, `redditJson`, `main` |

```text
node tools/research/fetch-research.mjs [--max N]
    ↓
FEEDS (Google Search Central, SEL, SEJ, Moz, Ahrefs, Semrush)
    ├── fetchText (UA + timeout 20 s) → parse RSS/Atom por regex → título/URL/fecha/resumen
    └── artículos completos solo de Google/SEL (≤5 por fuente, tras robotsAllows + delay 1,5 s, ≤30 000 chars)
    ↓
SEED_PAGES (searchanalytics.query · urlInspection · limits — referencia oficial)
    ↓
redditJson (r/SEO, r/bigseo — búsqueda «search console api», top del año)
    ↓
save() → docs/research/raw/<nombre>.txt  +  resumen por stdout
```

- Salidas reales contrastadas: `docs/research/raw/` contiene los seis `.txt` de fuentes feed/página generados por este pipeline.
- Dirección de dependencias: `tools/` escribe en `docs/research/raw/` y no importa nada del producto (`src/`); el producto no importa de `tools/`.

## 5. Entorno reproducible

Hereda el entorno del proyecto (Node >=20, pnpm — ver `src/ARCHITECTURE.md` §5); este tronco no añade dependencias.

- **Ejecución**: `node tools/research/fetch-research.mjs` (o `--max 10` para una pasada ligera). Requiere salida a internet; sin red, las fuentes fallan una a una y el script termina con su resumen.
- **Variables de entorno**: ninguna (los secretos no intervienen en este tronco; principio 10).

## 6. Validación del dominio

| Verificación | Comando | Cobertura |
|---|---|---|
| Sintaxis del script | `node --check tools/research/fetch-research.mjs` | Parseo del módulo |
| Ejecución controlada | `node tools/research/fetch-research.mjs --max 1` | Pipeline completo con carga mínima (red externa) |

- Límites: sin tests ni lint (no configurados en el proyecto); el camino no feliz verificado por contrato es fuente caída/bloqueada por robots (el pipeline continúa y lo reporta). No se ejecutó el pipeline durante el montaje documental.

## 7. Términos y condiciones

1. **Autoridad**: este contrato está subordinado a `docs/ARCHITECTURE.md`.
2. **Unidad de cambio**: el pipeline de investigación y su cortesía de red; nuevos tipos de fuente = extensión de este tronco con su cláusula de cortesía correspondiente.
3. **Límite**: este contrato no regula el análisis editorial del corpus (ideas del dominio `docs/research/` son material de conocimiento enlazable, no contrato).
4. **Integridad del mapa**: todo nodo bajo su autoridad debe estar correctamente enrutado.
5. **Workboard**: es la fuente exclusiva de estado, coordinación y trazabilidad del trabajo.
6. **Conflicto o fallo**: no relajes una regla superior ni presentes un resultado no verificado como funcional; detén y escala el conflicto.

---
*Fin del contrato de `tools/`. Sube a [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) para las normas superiores.*

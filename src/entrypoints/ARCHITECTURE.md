---
title: ARCHITECTURE.md — Rama «src/entrypoints»
Rol: Adaptadores de transporte del servidor MCP
Objetivo: Definir las reglas locales de los puntos de entrada (stdio, HTTP/Node, Cloudflare Worker).
Nivel: Rama
Estado: contract
Padre: ../ARCHITECTURE.md
Lectura obligatoria: SÍ — antes de modificar o enrutar trabajo bajo esta rama.
---

<br>**↑ Padre**: [src/ARCHITECTURE.md](../ARCHITECTURE.md) — reglas transversales del tronco de producto (leyes 13–16, entorno, despliegue).<br/>

## 1. Alcance y autoridad

Este contrato se aplica exclusivamente a `src/entrypoints/` y especializa la ley 13 (entradas finas, núcleo neutral): aquí vive **todo** el código que conoce el transporte y el origen de la configuración.

No redefine reglas superiores ni documenta el estado operativo detallado de los frutos.

## 2. Cláusulas de comportamiento e implementación

1. Lee este contrato y sus contratos superiores antes de actuar; detente en este nivel si la tarea solo exige una decisión de enrutamiento.
2. Antes de trabajo operativo, consulta [docs/workboard](../../docs/workboard/ARCHITECTURE.md) y cumple su contrato.
3. Un entrypoint **solo**: resuelve credenciales/configuración de su plataforma → crea la app o servidor neutro (`src/lib/`) → conecta el transporte. Cero lógica de negocio, cero manejo de filas o herramientas.
4. Un canal de transporte nuevo = un archivo nuevo aquí, sin tocar `src/lib/` (ley 13). Si requiere tocar `lib/`, es señal de que la app neutra necesita una opción nueva en su interfaz (`AppOptions`), no de lógica en el entrypoint.
5. Los errores fatales de arranque (credenciales ausentes) terminan el proceso con mensaje claro en `stderr` — en stdio, `stdout` está reservado al protocolo MCP.
6. Mantén los detalles específicos de cada transporte en su archivo; no crees abstracciones por anticipación.
7. Si cambia comportamiento de un entrypoint, modifica este contrato solo si cambia una regla o el mapa de la rama; el detalle del archivo vive en su propia sección del contrato del padre cuando proceda.

## 3. Mapa de hijos y tabla de enrutamiento

La rama contiene tres archivos-entrypoint (sin subdirectorios); su detalle operativo vive en el contrato del padre `src/lib/` para lo que toca al núcleo y aquí para lo que toca al transporte.

| Archivo | Transporte | Plataforma objetivo | Contrato de referencia |
|---|---|---|---|
| `stdio.ts` | MCP sobre stdio (`StdioServerTransport`) | Clientes de escritorio (Claude Desktop, registro Smithery) | [src/ARCHITECTURE.md](../ARCHITECTURE.md) |
| `server-http.ts` | HTTP/SSE (`@hono/node-server` + `StreamableHTTPTransport`) | Docker / IBM Code Engine (puerto `PORT`, default 8080) | [src/ARCHITECTURE.md](../ARCHITECTURE.md) |
| `worker.ts` | HTTP (`app.fetch` de Hono) | Cloudflare Workers (bindings, `nodejs_compat`) | [src/ARCHITECTURE.md](../ARCHITECTURE.md) |

No hay hijos con contrato propio: esta rama declara su mapa y enruta hacia el tronco.

## 4. Criterios de colocación y dependencias

```text
Plataforma (desktop · Node/contenedor · Cloudflare Worker)
    ↓
entrypoint: credenciales + transporte de la plataforma
    ↓
src/lib (app/server neutros — sin conocimiento de la plataforma)
```

- **Pertenece aquí**: `process.env`, bindings de Worker, señales de proceso, elección de puerto.
- **Pertenece al núcleo (`src/lib/`)**: routing HTTP, autenticación del endpoint, registro de herramientas, cliente de la API.
- **Dependencias**: cada entrypoint importa solo de `../lib/` (app/server/config); prohibido importar de frutos (`lib/gsc/`, `lib/tools/`) directamente.
- Particularidad contrastada: `worker.ts` no usa `lib/config.ts` (no hay filesystem en Workers); las credenciales llegan como binding `GOOGLE_CREDENTIALS`.

## 5. Términos y condiciones

1. **Autoridad**: este contrato está subordinado a `src/ARCHITECTURE.md` y a `docs/ARCHITECTURE.md`.
2. **Especialización**: concreta la ley 13 sin contradecirla ni relajarla.
3. **Integridad del mapa**: refleja solo archivos reales y enlaces verificables.
4. **Workboard**: mantiene en exclusiva estados, claims, autorizaciones y trazabilidad del trabajo.
5. **Conflicto**: ante una frontera ambigua (¿config o transporte?), la regla de colocación es §4; si persiste la duda, detén y consulta.

---
*Fin del contrato de `src/entrypoints/`. Sube a [src/ARCHITECTURE.md](../ARCHITECTURE.md) para las reglas del tronco.*

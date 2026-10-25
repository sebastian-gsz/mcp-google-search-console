---
title: ARCHITECTURE.md — Rama «src/lib»
Rol: Núcleo neutral del servidor MCP (app, servidor, configuración y esquemas)
Objetivo: Definir las reglas locales del núcleo que no conoce plataforma ni transporte.
Nivel: Rama
Estado: contract
Padre: ../ARCHITECTURE.md
Lectura obligatoria: SÍ — antes de modificar o enrutar trabajo bajo esta rama.
---

<br>**↑ Padre**: [src/ARCHITECTURE.md](../ARCHITECTURE.md) — reglas transversales del tronco de producto (leyes 13–16, entorno, despliegue).<br/>

## 1. Alcance y autoridad

Este contrato se aplica exclusivamente a `src/lib/` (archivos raíz de la rama; los subdirectorios `gsc/` y `tools/` son frutos con contrato propio) y regula el núcleo neutral: la aplicación HTTP, el servidor MCP, la resolución de credenciales y los esquemas de entrada.

No redefine reglas superiores ni documenta el estado operativo detallado de sus frutos.

## 2. Cláusulas de comportamiento e implementación

1. Lee este contrato y sus contratos superiores antes de actuar; detente en este nivel si la tarea solo exige una decisión de enrutamiento.
2. Antes de trabajo operativo, consulta [docs/workboard](../../docs/workboard/ARCHITECTURE.md) y cumple su contrato.
3. **Núcleo neutral** (ley 13): ningún archivo de esta rama lee `process.env` ni bindings; la configuración entra por parámetros (`AppOptions`, argumentos de `createServer`). Excepción única y localizada: `config.ts` existe precisamente para resolver credenciales en plataformas con filesystem, y los entrypoints la llaman — `lib/` nunca la llama.
4. `server.ts` es un servidor MCP puro: recibe credenciales resueltas, itera el registro de herramientas y traduce errores a `ToolResult` (`isError: true`). No conoce Hono ni transportes.
5. `app.ts` es la aplicación HTTP neutra: `GET /health` sin auth; `ALL /mcp` con CORS y **bearer auth obligatorio** — sin `MCP_API_TOKEN` el endpoint responde 503 (no se expone la API de Search Console sin protección). El transporte `StreamableHTTPTransport` se crea por petición, sin sesión (`sessionIdGenerator: undefined`).
6. `schemas.ts` es el módulo único de esquemas Zod de entrada de las herramientas (auditable en un solo lugar); las herramientas no declaran esquemas inline.
7. Los errores de validación (`ZodError`) se presentan al cliente con ruta del campo y mensaje; nunca se filtran stack traces.
8. Los cambios de comportamiento de un fruto se modifican en su contrato; esta rama solo cambia si mutan las reglas del núcleo o su mapa.

## 3. Mapa de hijos y tabla de enrutamiento

| Nodo | Nivel | Estado | Responsabilidad local | Contrato |
|---|---|---|---|---|
| `src/lib/gsc/` | Fruto | implemented | Capa de acceso a la API de GSC y analítica pura sobre filas. | [ARCHITECTURE.md](gsc/ARCHITECTURE.md) |
| `src/lib/tools/` | Fruto | implemented | Registro y definiciones de las 15 herramientas MCP. | [ARCHITECTURE.md](tools/ARCHITECTURE.md) |

Archivos de la rama (sin contrato individual, regulados por este contrato):

| Archivo | Responsabilidad |
|---|---|
| `app.ts` | `createApp(AppOptions)`: aplicación Hono neutra con `/health` y `/mcp` (CORS + bearer auth obligatorio). |
| `server.ts` | `createServer(credentials)`: servidor MCP puro con handlers `ListTools`/`CallTool` sobre el registro de `tools/`. |
| `config.ts` | `resolveCredentials()`: precedencia `GOOGLE_JSON_KEY` → `GOOGLE_APPLICATION_CREDENTIALS` → `credentials.json` en CWD. Solo plataformas con filesystem. |
| `schemas.ts` | Esquemas Zod de entrada de todas las herramientas (GSCBaseSchema + extensiones por herramienta). |

Los hijos enlazan aquí como padre inmediato. Cambiar este mapa no sustituye la actualización de los mapas superiores cuando sea requerida por la ley universal.

## 4. Criterios de colocación y dependencias

```text
src/entrypoints (transporte + credenciales de la plataforma)
    ↓
src/lib: app.ts / server.ts / config.ts / schemas.ts
    ↓
src/lib/tools (herramientas)  →  src/lib/gsc (API de Google)
```

- **Pertenece a esta rama**: wiring del núcleo, interfaces de configuración, esquemas compartidos.
- **Pertenece a un fruto**: cualquier lógica que conozca googleapis (→ `gsc/`) o una herramienta concreta (→ `tools/`).
- **Dependencias**: `server.ts` → `tools/index.ts` y `gsc/client.ts`; `app.ts` → `server.ts`; `tools/*` → `schemas.ts` y `gsc/client.ts`. `config.ts` no importa de ningún otro archivo de `lib/`.
- Hermanos no se importan entre sí salvo por las flechas anteriores.

## 5. Términos y condiciones

1. **Autoridad**: este contrato está subordinado a `src/ARCHITECTURE.md` y a `docs/ARCHITECTURE.md`.
2. **Especialización**: concreta las leyes 13–16 sin contradecirlas ni relajarlas.
3. **Integridad del mapa**: refleja solo hijos y archivos reales con enlaces verificables.
4. **Workboard**: mantiene en exclusiva estados, claims, autorizaciones y trazabilidad del trabajo.
5. **Conflicto**: ante una frontera ambigua entre núcleo y fruto, detén la acción y solicita resolución.

---
*Fin del contrato de `src/lib/`. Sube a [src/ARCHITECTURE.md](../ARCHITECTURE.md) o desciende a un hijo listado arriba.*

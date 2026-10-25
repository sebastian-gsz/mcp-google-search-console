---
title: ARCHITECTURE.md — Tronco «src»
Rol: Responsable técnico del servidor MCP de Google Search Console
Objetivo: Definir el contrato transversal del código de producto TypeScript que implementa el servidor MCP.
Nivel: Tronco
Estado: contract
Padre: ../docs/ARCHITECTURE.md
Lectura obligatoria: SÍ — antes de modificar cualquier responsabilidad de este tronco.
---

<br>**↑ Padre**: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — mapa maestro, leyes universales 1–16 y protocolo de lectura.<br/>

## 1. Alcance y autoridad

Este contrato se aplica exclusivamente a `src/` y regula la arquitectura transversal del producto: separación entrypoints/núcleo, patrón de herramientas MCP, encapsulación de la API de Google, configuración y entorno reproducible.

- **Entradas**: credenciales de service account de Google (entorno o bindings), peticiones MCP de clientes (stdio o HTTP/SSE).
- **Proceso**: exposición de 15 herramientas MCP sobre la API de Google Search Console (lectura y escritura).
- **Salidas**: resultados JSON estructurados vía protocolo MCP; errores tipados como `ToolResult` con `isError`.

No regula las utilidades de investigación (`tools/`), el fork de dependencias (`patches/`) ni la documentación (`docs/`). El detalle de ramas y frutos permanece en sus contratos descendientes.

## 2. Cláusulas de comportamiento e implementación

1. Lee este contrato y todos sus contratos superiores antes de actuar; desciende al nodo específico de la tarea.
2. Antes de trabajo operativo, consulta [docs/workboard](../docs/workboard/ARCHITECTURE.md) y cumple su claim, autorización, bloqueo y cierre.
3. Si no existe autorización o hay conflicto con un contrato superior, detén la acción y registra el impedimento en el workboard.
4. **Entradas finas, núcleo neutral** (ley 13): los entrypoints solo resuelven credenciales/configuración y conectan el transporte; `src/lib/` no lee `process.env` ni bindings de plataforma.
5. **Una herramienta MCP = un módulo + esquema + registro** (ley 14): módulo en `src/lib/tools/`, esquema Zod en `src/lib/schemas.ts`, alta en el array `TOOLS` de `src/lib/tools/index.ts`.
6. **Encapsulación de la API de Google** (ley 15): solo `src/lib/gsc/client.ts` importa `googleapis`/`google-auth-library`; la analítica es pura (sin red ni disco).
7. **Escrituras destructivas bajo control explícito** (ley 16): `delete_site`, `add_site`, `submit_sitemap`, `delete_sitemap` operan sobre la propiedad real; sin defaults que amplíen el alcance de una escritura.
8. TypeScript en modo `strict` (`tsconfig.json`); los errores de las herramientas se devuelven como `ToolResult` con `isError: true`, nunca propagados como excepción no capturada al cliente.
9. Mantén la lógica específica de un sistema en su nodo descendiente; comparte solo abstracciones demostrablemente comunes (dos o más usos reales).
10. Para nodos nuevos, aplica el protocolo de topología de la [guía de plantillas](../docs/templates/architecture/README.md).
11. Actualiza este contrato solo cuando cambie una regla, responsabilidad, ruta o mapa bajo autoridad de este tronco.

## 3. Topología y tabla de ruteo

Este tronco enruta las ramas y frutos reales bajo `src/`. Cada fila describe un nodo existente y enlaza su contrato.

| Nodo | Nivel | Estado | Responsabilidad | Contrato |
|---|---|---|---|---|
| `src/entrypoints/` | Rama | contract | Adaptadores finos de transporte: stdio, HTTP/Node y Cloudflare Worker. | [ARCHITECTURE.md](entrypoints/ARCHITECTURE.md) |
| `src/lib/` | Rama | contract | Núcleo neutral: app HTTP, servidor MCP, configuración y esquemas Zod. | [ARCHITECTURE.md](lib/ARCHITECTURE.md) |
| `src/lib/gsc/` | Fruto | implemented | Capa de acceso a la API de Google Search Console y analítica pura. | [ARCHITECTURE.md](lib/gsc/ARCHITECTURE.md) |
| `src/lib/tools/` | Fruto | implemented | Registro y definiciones de las 15 herramientas MCP. | [ARCHITECTURE.md](lib/tools/ARCHITECTURE.md) |

## 4. Principios de enrutamiento y dependencias

```text
Cliente MCP (stdio · HTTP/SSE · Worker)
    ↓
src/entrypoints/   ← adaptadores finos (transporte + credenciales)
    ↓
src/lib/           ← núcleo neutral (app · server · config · schemas)
    ↓
src/lib/tools/  →  src/lib/gsc/  ← única puerta a googleapis
```

- Dirección permitida de dependencias: `entrypoints → lib` (nunca al revés); `tools → schemas` y `tools → gsc`; `gsc` no importa de `tools` ni de `entrypoints`.
- `lib/server.ts` consume el registro de `tools/index.ts`; ninguna otra parte del núcleo conoce herramientas individuales.
- Límite con nodos hermanos: la investigación (`tools/`) y los parches (`patches/`) no son dependencias de `src/` en runtime.

## 5. Entorno reproducible

Si una herramienta no está declarada en esta sección o en [package.json](../package.json), **asume que no existe** en el entorno de cualquier agente.

| Herramienta | Versión | Cómo se obtiene |
|---|---|---|
| Node.js | >=20 (engines); node:22-slim en Docker | `.nvmrc` no existe: usa el runtime declarado en Dockerfile/devenv |
| pnpm | gestor del proyecto (`pnpm-lock.yaml`); corepack activado en devenv | `corepack enable pnpm` |
| TypeScript | ^5.7 (devDependency) | `pnpm install` |
| tsx | ^4.19 (devDependency, modo dev) | `pnpm install` |
| wrangler | ^4.67 (devDependency, Cloudflare Workers) | `pnpm install` |

- **Setup reproducible**: `pnpm install && pnpm run build` (compila a `dist/` con `tsc`). Desarrollo: `pnpm run dev:stdio` / `dev:ibm` (HTTP local) / `dev:remote` (wrangler).
- **Variables de entorno** (nombres, nunca valores — principio 10): `GOOGLE_JSON_KEY` (service account como cadena JSON, precedencia 1), `GOOGLE_APPLICATION_CREDENTIALS` (ruta a archivo de claves, precedencia 2), `credentials.json` en el CWD (precedencia 3, desarrollo local), `MCP_API_TOKEN` (obligatorio para exponer `/mcp` por HTTP: sin token el endpoint responde 503), `CORS_ORIGIN`, `PORT` (default 8080), y en Cloudflare Workers el binding `GOOGLE_CREDENTIALS`. Cada secreto viaja únicamente en las llamadas a la API de Google (aislamiento por servicio; protocolo `secretos` de `docs/conocimiento/protocolos/`).
- **Despliegue**: Docker (multi-stage, CMD `dist/entrypoints/server-http.js`, puerto 8080 — configurado para IBM Code Engine; variante Hugging Face comentada en el Dockerfile), Cloudflare Workers (`wrangler deploy`, `wrangler.toml` con `nodejs_compat`), registro Smithery (transporte stdio, `smithery.yaml`). No hay CI configurado en el repositorio.
- **Parcheo de dependencias**: el fork local `patches/buffer-equal-constant-time` está activo por doble vía — `overrides` de npm (`package.json`) y `overrides` de pnpm (`pnpm-workspace.yaml`); ver el contrato del fruto `patches/`.
- Los frutos de este tronco heredan este entorno y solo añaden el suyo propio (ley 5).

## 6. Validación del dominio

- **Verificación por archivo** (ley 10 del mapa maestro): comandos transversales de este tronco:

| Verificación | Comando | Cobertura |
|---|---|---|
| Tipado estático (proyecto) | `pnpm exec tsc --noEmit` | Todo `src/` contra `tsconfig.json` (segundos; usar tras cada cambio) |
| Build completo | `pnpm run build` | Compilación a `dist/` — solo a petición explícita |
| Test unitario | `pnpm test` + `pnpm test:types` | Batería de la analítica pura en `src/lib/gsc/` (node:test vía tsx; detalle en el contrato del fruto) |
| Lint/format | no configurados | Límite declarado: sin `.eslintrc`/`prettier` en el repositorio |

- No hay tests: la verificación disponible es el tipado estricto y la ejecución controlada (`dev:stdio`). Los huecos quedan declarados como límites y referenciados al workboard; este contrato se actualiza en la misma entrega cuando se activen.
- Al cerrar un trabajo, registra evidencia y límites de validación en el ítem del workboard.

## 7. Términos y condiciones

1. **Autoridad**: este contrato está subordinado a `docs/ARCHITECTURE.md` y, por cascada, a sus leyes universales y de stack.
2. **Unidad de cambio**: reglas transversales de `src/` (arquitectura de capas, entorno, despliegue, dependencias de producto). Los cambios de comportamiento de un sistema concreto pertenecen a su fruto.
3. **Límite**: este contrato no autoriza cambios de producto por sí mismo; todo trabajo pasa por el workboard.
4. **Integridad del mapa**: todo nodo bajo su autoridad debe estar correctamente enrutado; los mapas superiores se actualizan limitados a la fila de ruteo.
5. **Workboard**: es la fuente exclusiva de estado, coordinación y trazabilidad del trabajo.
6. **Conflicto o fallo**: no relajes una regla superior ni presentes un resultado no verificado como funcional; detén y escala el conflicto.

---
*Fin del contrato de `src/`. Sube a [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) para las normas superiores.*

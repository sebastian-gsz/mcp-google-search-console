# Decisiones arquitectónicas — mcp-server-gsc

Registro razonado de decisiones del proyecto. Contrato del dominio: [ARCHITECTURE.md](ARCHITECTURE.md).

Formato de cada entrada: contexto → decisión → alternativas consideradas → consecuencias. Una decisión no modifica contratos: si difiere de la arquitectura vigente, prevalece el contrato hasta que se cambie por el proceso correspondiente.

---

## D-001 — Montaje del harness documental en modo parasitar

- **Fecha**: 2026-10-25T00:30:00+02:00 · **Actor**: operador (J. Sebastián G. Sánchez), ejecutado por agente constructor.
- **Contexto**: el repositorio contiene código de producto activo (servidor MCP para Google Search Console, ~1 750 líneas en `src/` y `tools/`) sin red de contratos. El trabajo con agentes operaba sin fuente única de contexto ni ciclo de trabajo trazable.
- **Decisión**: montar el harness documental **en modo parasitar**: la red de contratos se instala alrededor del código existente sin tocar una línea de producto. El inventario de troncos y la contratación top-down se ejecutan como ítems del workboard recién montado.
- **Alternativas**: (a) modo sembrar — descartado: hay código de producto que contratar, no nada que fundar; (b) seguir sin harness — descartado: riesgo de contexto incorrecto y trabajo duplicado entre sesiones.
- **Consecuencias**: todo nodo nace `contract` y solo asciende a `implemented` con contraste verificado contra el código real; las mejoras de código detectadas durante el montaje se registran como ítems abiertos y se ejecutan después.

## D-002 — Idioma documental, zona horaria y operador

- **Fecha**: 2026-10-25T00:30:00+02:00 · **Actor**: operador.
- **Decisión**: idioma documental **español** para toda la documentación (código y comentarios del producto ya lo usan); zona horaria oficial **UTC+02:00 (CEST)** — todas las marcas temporales ISO-8601 con offset; operador y autoridad de aprobación: **J. Sebastián G. Sánchez**.
- **Consecuencias**: cualquier documento en otro idioma o marca sin offset es una violación del mapa maestro; las aprobaciones de runbooks, SOP y promociones de experimentos pasan por el operador.

## D-003 — Prefijos de dominio para los IDs del workboard

- **Fecha**: 2026-10-25T00:30:00+02:00 · **Actor**: operador.
- **Decisión**: prefijos de 2–4 letras por ámbito técnico: **`MCP`** (código de producto en `src/`), **`DOC`** (dominio documental), **`RES`** (investigación: `tools/research/` y `docs/research/`), **`OPS`** (operación transversal: build, despliegue, dependencias, parches, VCS). Un ítem usa el prefijo del nodo principal que toca; las tareas transversales usan `OPS`.
- **Consecuencias**: `DOC-001` queda reservado por convención de montaje a la verificación del harness; los IDs no se reutilizan.

## D-004 — Leyes de stack propias del servidor MCP (13–16)

- **Fecha**: 2026-10-25T00:30:00+02:00 · **Actor**: operador, a partir del inventario del código.
- **Decisión**: se añaden al mapa maestro cuatro leyes de stack (además de las 12 universales): entradas finas y núcleo neutral; una herramienta MCP = un módulo + esquema Zod centralizado + registro; encapsulación de la API de Google en un único módulo con analítica pura; y control explícito de las operaciones destructivas del scope `webmasters`.
- **Consecuencias**: quedan plasmadas como leyes 13–16 en `docs/ARCHITECTURE.md` §4 y rigen en cascada para todos los nodos de `src/`.

## D-005 — El parche local de dependencia queda documentado como fruto, sin activarlo en esta entrega

- **Fecha**: 2026-10-25T00:30:00+02:00 · **Actor**: agente constructor, hallazgo del inventario; sin modificación de producto (modo parasitar).
- **Contexto**: `patches/buffer-equal-constant-time/` es un fork local (1.0.2) que sustituye la manipulación de `Buffer.prototype` por `crypto.timingSafeEqual`, activado vía el campo `overrides` de npm en `package.json`. Evidencia contrastada: `pnpm-lock.yaml` resuelve `buffer-equal-constant-time@1.0.1` desde el registro y `.dockerignore` excluye `patches/` — pnpm ignora el campo `overrides` de npm, por lo que el fork **no se aplica** en los builds pnpm (Dockerfile).
- **Decisión**: documentar el hallazgo en el contrato del fruto `patches/` y registrar la activación real bajo pnpm como ítem abierto del workboard para el operador. No se modifica `package.json` ni el lockfile durante el montaje (el parasitaje es exclusivamente documental).
- **Alternativas**: activar `pnpm.overrides` en la misma entrega — descartada: violaría la regla de cero cambios de producto del montaje.
- **Consecuencias**: hasta que el operador active el override pnpm, los builds Docker/pnpm siguen sirviendo la versión 1.0.1 del registro; la situación queda declarada como límite en el contrato de `patches/`.

## D-006 — Activación del fork `buffer-equal-constant-time` bajo pnpm (mecanismo dual)

- **Fecha**: 2026-10-25T14:50:00+01:00 · **Actor**: operador (orden de continuar con la siguiente tarea), ejecutado por agente constructor en el ítem OPS-003.
- **Contexto**: D-005 documentó que pnpm ignoraba el campo `overrides` de npm (lockfile en 1.0.1, `.dockerignore` excluyendo `patches/`). Hallazgo adicional de esta ejecución: **pnpm 12 ya no lee el campo `pnpm` de `package.json`** — sus settings migraron a `pnpm-workspace.yaml` — y los build scripts no aprobados (esbuild, sharp, workerd) son un error duro de instalación.
- **Decisión**: activar el fork por doble vía — `overrides` de npm en `package.json` (intacto, para usuarios de npm) y `overrides` en el nuevo `pnpm-workspace.yaml`; `.dockerignore` deja de excluir `patches/`; y la política `ignoredBuiltDependencies` declara explícitamente que esbuild/sharp/workerd no ejecutan scripts de build (todos publican binarios precompilados por plataforma y el Dockerfile ya instalaba con `--ignore-scripts`).
- **Alternativas**: `pnpm patch` (diff sobre la versión del registro) — descartada: ya existe un fork completo auditado; dejar el campo `pnpm` en `package.json` — descartada: está muerto en pnpm 12 y genera warning en cada install.
- **Consecuencias**: el lockfile resuelve `file:patches/buffer-equal-constant-time` y `jwa` consume el fork (1.0.2, `crypto.timingSafeEqual`) en installs pnpm y npm por igual; verificación local equivalente en verde (tests 13/13, `tsc`, `pnpm run build`); el `docker build` queda como límite declarado hasta ejecutarse en una máquina con Docker.

## D-007 — Migración de zod 3 a 4 y política frente a las vulnerabilidades de dependencias (OPS-004)

- **Fecha**: 2026-10-25T15:35:00+01:00 · **Actor**: operador (continuación de tareas), ejecutado por agente constructor.
- **Contexto**: la auditoría de OPS-004 reportaba 2 vulnerabilidades **high** (`zod <4.6.6`, GHSA-mrhx-c7xc-m3w5: agotamiento de memoria validando colecciones sobredimensionadas; `undici 7.0.0–7.30.0` vía wrangler/miniflare, 3 advisories) y moderadas en `uuid <11.1.1` vía `googleapis@146`. Sin fix en la línea 3.x de zod (3.25.76 sigue vulnerable): la migración a 4.x era el único camino para resolver la high.
- **Decisiones**:
  1. **zod migrado a `^4.6.7`**. El único choque real: `z.toJSONSchema` (nativo de zod 4, sustituye al paquete `zod-to-json-schema`, que se retira) **no representa transforms**. El split de `dimensions` se movió del esquema al consumidor: el esquema ahora valida la cadena cruda con `refine` (mensaje con la lista válida) y `buildSearchRequestBody` hace el `split(',')` — el `inputSchema` que ve el cliente LLM sigue descriptivo y la validación en runtime es equivalente. Además `error.errors` → `error.issues` en `server.ts` (API de `ZodError` de v4).
  2. **`undici` fijada a `7.30.1`** (doble vía: `overrides` de pnpm y de npm): la última de wrangler 4.152.0 traía 7.29.1 (vulnerable); la 7.x termina en 7.30.1, que es el fix del rango vulnerable 7.0.0–7.30.0. Intra-major, sin riesgo de API para miniflare.
  3. **`uuid@9.0.1`: riesgo ACEPTADO** — moderado, explota solo si se pasa `buf` a uuid v3/v5/v6 (gaxios no lo hace); actualizar `googleapis` 146→188 es un salto de 42 majors con regeneración total de APIs generadas, que se difiere a un ítem propio con la batería de tests como red.
- **Consecuencias**: auditoría sin high (quedan 4 moderadas de la cadena uuid, riesgo aceptado); los 15 `inputSchema` se regeneran con el generador nativo de zod 4 y se verifican en runtime; `zod-to-json-schema` deja de ser dependencia; el campo `dimensions` de los descriptores pierde el refinamiento estructural del generador antiguo (la validación vive en runtime y el error indica la lista válida).

## D-008 — Rama única `main`: retirada de `develop`

- **Fecha**: 2026-10-25T18:00:00+01:00 · **Actor**: operador (orden directa: «elimina la rama develop o fusiona y elimínala, y haz lo mismo con el remoto»), ejecutado por agente constructor en el ítem OPS-008.
- **Contexto**: tras la primera release (fusión `develop` → `main`, commit `ccd9c04` del 2026-10-25), `develop` quedó fusionada al 100 % — su eliminación no pierde ningún commit (verificado con `git branch --merged`).
- **Decisión**: **rama única `main`**. `develop` eliminada en local y en el remoto; los PR se abren contra `main`; §5.3 del contrato del workboard y la convención ítem → rama → PR del README actualizadas en la misma entrega.
- **Alternativas**: mantener `develop` como rama de integración para futuras releases multiagente — descartada por el operador (simplicidad en un repo de un solo flujo); puede reinstaurarse con una nueva decisión si el flujo multiagente paralelo lo exige.
- **Consecuencias**: el ciclo ítem → rama → PR apunta a `main`; la capa determinista (hook pre-commit) y el verificador aplican igual que antes; la etapa de release pierde el paso `develop` → `main` (la fusión a `main` es el propio PR/commit); los ítems archivados que citan `develop` (OPS-001, OPS-005) quedan como histórico sin reescribir (principio 8).

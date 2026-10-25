# Workboard — Tablero de trabajo del repositorio

Contrato del nodo: [ARCHITECTURE.md](./ARCHITECTURE.md). Este README es el procedimiento resumido; el contrato define autoridad, sincronización, claims, multiagente y cierre.

Fuente única de **pendientes operativos** (backlog, tareas, claims). Los `ARCHITECTURE.md` describen contratos y estado factual; **no** alojan listas de backlog.

## Convención

| Ruta | Rol |
|---|---|
| `INDEX.md` | Vista rápida de ítems `open` / `in_progress` / `blocked` |
| `SCHEMA.md` | Campos obligatorios de cada ítem |
| `_template-item.md` | Esqueleto para copiar al crear un ítem |
| `items/ID-slug.md` | Un archivo por tarea primaria |
| `items/_done/` | Ítems cerrados (mover aquí al completar o cancelar) |
| `verify-workboard.mjs` | Verificación mecánica (ejecutar antes de cerrar y en CI) |

**IDs estables** por dominio: `<DOM>-###`, `<DOM2>-###`, … (prefijo por ámbito técnico, fijado en las decisiones de montaje).

**Estados:** `open` · `in_progress` · `blocked` · `done` · `cancelled`.

**Prioridades:** `P0` (bloqueante) · `P1` (alta) · `P2` (normal) · `P3` (baja / aplazada).

**Clases de problema** (ley 11 del mapa maestro): `datos` · `red` · `cómputo` · `agente`. Cada ítem declara la suya y consulta el protocolo canónico correspondiente en `docs/conocimiento/protocolos/`.

## Protocolo de claim (agentes y humanos)

1. **Antes de tocar código** de una tarea: lee los contratos hasta el nodo, abre su archivo en `items/` y comprueba que `status` sea `open` (o que ya eres el `claimed_by`).
2. **Claim:** cambia atómicamente `status`, `claimed_by`, `claimed_at` y `updated_at`, y refleja la fila en `INDEX.md`.
3. **Un claim a la vez** por agente salvo indicación expresa del owner. Ante colisión, conserva el primer claim persistido y no sobrescribas.
4. **No implementes** ítems aplazados o bloqueados sin la autorización y desbloqueo correspondientes.
5. **Toda modificación** del ítem exige sincronizar su archivo, `INDEX.md` si es activo y la evidencia/decisión en el cuerpo, en la misma entrega.
6. **Al cerrar:** verifica aceptación y validaciones, ejecuta `node verify-workboard.mjs`, actualiza solo los contratos afectados por cambios reales, registra evidencia, limpia el claim, mueve el archivo a `items/_done/` y quítalo de `INDEX.md`.
7. **Cancelar** no equivale a completar: conserva `closed_reason`, evidencia y decisión, y mueve el ítem a `_done/`.
8. **Bloqueos:** usa `blocked_by` / `blocks` solo con dependencias reales; `status: blocked` exige explicación y referencia.
9. **Agentes en paralelo:** cada agente en su propio worktree según la convención §5.1 del contrato (`worktrees/<ID>-<slug>`, creado al reclamar con su rama, `remove`/`prune` al cerrar); un claim activo por agente; `touches` no solapados.
10. **Recursos locales (§5.2):** antes de levantar servidores, consulta `INDEX.md` y declara en las Notas del ítem tu rango de puertos; registra los procesos que lances y detenlos al cerrar — un ítem no se cierra con procesos vivos ni puertos ocupados.

## Convención ítem → rama → PR

El vínculo entre el ítem del workboard y su entrega en git no se deja a la memoria del agente:

1. **Rama**: `<tipo>/<ID>-<slug>` (tipo ∈ `feature | fix | docs | chore`; `docs` por defecto para trabajo documental). Se crea al reclamar, junto con el worktree: `git worktree add worktrees/<ID>-<slug> -b <tipo>/<ID>-<slug>`.
2. **PR**: título `(<ID>) <título del ítem>`; cuerpo con los criterios de aceptación y la evidencia del ítem. El campo `external` del ítem enlaza el PR (y la rama, si difiere). Se abre contra **`main`** (rama única, decisión D-008).
3. **Sincronización**: antes de abrir el PR, sincroniza tu rama con la de integración; re-sincroniza si otro ítem se fusionó tocando tus archivos (§5.3).
4. **Entrega directa** (sin PR): solo para cambios triviales de documentación, justificados en la evidencia del ítem; nunca para código de producto.
5. **Cierre**: PR fusionado (o entrega directa justificada) → limpiar worktree (§5.1) → borrar la rama fusionada → mover el ítem a `_done/`. `INDEX.md` refleja el estado; rama y PR viven en `external` y las Notas, sin columnas nuevas. Las fusiones se serializan y los conflictos de `INDEX.md` se resuelven por unión de filas (§5.3).

## Regímenes

- **Producción** (default): el ciclo completo del protocolo de claim.
- **Exploración** (`EXP-###`): trabajo barato y acotado cuyo producto es un **aprendizaje** — `timebox` obligatorio, sin `touches` estrictos ni checklist de PR, ejecutado en su worktree desechable. Tres cierres: **promoción** (solo el operador autoriza el ítem de producción), **descarte** (el aprendizaje negativo se archiva) y **caducidad** (timebox vencido). Detalle: contrato §4.6.

## Capa determinista (hooks nativos de git)

El corpus es ley aquí: **lo consultivo vive en los contratos** (se sigue ~80% de las veces); **lo que debe pasar siempre se mecaniza** (100%). Instalación — una vez por clon, la decide el operador:

    git config core.hooksPath docs/workboard/hooks

El `pre-commit` bloquea automáticamente, sin depender de la memoria del agente:

1. **workboard inválido**: ejecuta `verify-workboard.mjs` (solo si el nodo tiene `items/`);
2. **higiene**: commits con `worktrees/` o `.env` (§5.1, principio 10);
3. **secretos obvios** en el diff (best-effort; el grep exhaustivo es parte de la verificación de secretos del montaje).

Degradación: sin `node` disponible, el verificador se omite con aviso; la higiene sigue activa. Desinstalar: `git config --unset core.hooksPath`.

`.gitattributes` fuerza `eol=lf` en los scripts de hook: sin él, un checkout con `autocrlf` convierte `#!/bin/sh\n` en `#!/bin/sh\r` y el exec falla («cannot exec pre-commit: No such file or directory»).

## Regla de oro

> Los pendientes viven **solo** en `docs/workboard/`. Si un `ARCHITECTURE.md` acumula otra lista de backlog, es un bug de documentación: migra el ítem aquí y deja un puntero corto.

## Sincronización obligatoria

La fuente primaria es el archivo del ítem. `INDEX.md` es una proyección de los ítems activos y `_done/` es el historial. Crear, modificar, reclamar, bloquear, desbloquear, cancelar o cerrar exige actualizar todas las proyecciones afectadas en una única entrega; nunca se edita solo el índice.

La correspondencia `items/ ↔ INDEX.md ↔ _done/` se verifica mecánicamente: `node verify-workboard.mjs` (sin dependencias; sale con código 1 si hay violaciones). Ejecutar antes de cerrar cualquier ítem y en CI.

## Trabajo multiagente

Una tarea conserva un único coordinador y un único claim primario. Los colaboradores trabajan en subtareas no solapadas y entregan evidencia; no cambian el estado global ni cierran el ítem. Si una subtarea necesita autonomía, se promueve a ítem con ID y dependencia propia. Con agentes en paralelo, cada uno en su propio worktree (contrato §5).

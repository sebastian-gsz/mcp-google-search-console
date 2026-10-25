# SCHEMA — Campos de un ítem del workboard

Cada archivo `items/ID-slug.md` empieza con un bloque YAML (front-matter) y un cuerpo Markdown breve. Esqueleto para copiar: [_template-item.md](_template-item.md).

## Front-matter (obligatorio)

```yaml
---
id: <DOM>-001                # ID estable (prefijo de dominio + número). No se reutiliza.
title: "Título corto"        # Una línea
status: open                 # open | in_progress | blocked | done | cancelled
priority: P2                 # P0 | P1 | P2 | P3
class: datos                 # datos | red | cómputo | agente — clase de problema dominante (ley 11)
regimen: produccion          # produccion | exploracion — los ítems EXP-### son exploración (§4.6)
timebox: null                # Solo exploración: fecha límite ISO-8601; vencida, el verificador exige el cierre
node: <ruta/del/nodo>        # Ruta del nodo afectado (o "." para la raíz)
parent: null                 # ID padre si es subtarea volcada como ítem, o null
claimed_by: null             # string | null
claimed_at: null             # ISO-8601 con offset (<zona horaria del proyecto>) | null
created_at: 2026-10-23T11:00:00+02:00
updated_at: 2026-10-23T11:00:00+02:00
closed_at: null              # Obligatorio para done/cancelled
closed_reason: null          # Obligatorio para cancelled; opcional para done
touches:                     # Rutas/archivos que la tarea prevé tocar (delimita el alcance)
  - <ruta/>
blocks: []                   # IDs que esta tarea bloquea
blocked_by: []               # IDs que bloquean esta tarea
acceptance:                  # Criterios verificables (lista de strings)
  - "…"
subtasks:                    # Checklist local (no son archivos aparte salvo que se promuevan)
  - "[ ] …"
external:                    # Enlaces externos (issues, PRs) o null
  - null
decision_log: []             # Decisiones que cambian alcance, prioridad, bloqueo o cierre
---
```

## Cuerpo Markdown

1. **Contexto** — de dónde salió (sección de ARCHITECTURE, nota, conversación aprobada, etc.).
2. **Notas** — restricciones («no empezar sin indicación», orden sugerido, etc.) y **cacheo de hallazgos** de la sesión (qué se auditó y qué se encontró, para no re-auditar).
3. **Clasificación y protocolo** — clase de problema declarada, protocolo canónico aplicado y umbrales elegidos con su justificación.
4. Opcional: detalle de subtareas si el YAML se queda corto.
5. En el cierre: **Evidencia** — qué se validó, con qué comando/resultado, qué queda fuera («No verificado: …»).

## Reglas

- Un **ítem primario** = un archivo. Agrupa micro-tareas del mismo nodo como `subtasks`.
- Al completar una subtarea, márcala `[x]` en el mismo archivo.
- No dupliques el mismo pendiente en un `ARCHITECTURE.md`.
- Los campos de tiempo y `decision_log` son obligatorios en ítems nuevos y modificados. Si no es posible reconstruir una fecha histórica, se deja `null` y se registra esa limitación en `decision_log`; **no se inventa una marca temporal**.
- Cada entrada de `decision_log` lleva: marca temporal, autor/actor y la decisión con su justificación.
- `done` exige evidencia de aceptación; `cancelled` exige `closed_reason` y decisión trazable.
- Al cerrar se limpia el claim (`claimed_by: null`, `claimed_at: null`); el responsable queda en la evidencia del cuerpo.
- `INDEX.md` debe reflejar exactamente los ítems activos; los cerrados viven en `items/_done/`.
- `regimen` es opcional (default `produccion`). Los IDs `EXP-###` son exploración y exigen `regimen: exploracion` + `timebox` válido; una exploración activa con timebox vencido es violación del contrato (§4.6).
- `blocks`/`blocked_by` solo con dependencias **reales**; las relaciones informativas van en el cuerpo.
- Secretos, credenciales y datos sensibles: prohibidos en cualquier campo o evidencia.
- La correspondencia mecánica `items/ ↔ INDEX.md ↔ _done/` y la presencia de campos la verifica `node verify-workboard.mjs` (sale con código 1 si hay violaciones).

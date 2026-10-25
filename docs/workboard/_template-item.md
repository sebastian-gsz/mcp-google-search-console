---
id: <DOM>-000
title: "<Título corto de la tarea>"
status: open
priority: P2
class: datos
regimen: produccion          # produccion | exploracion (los EXP-### son exploración, §4.6)
timebox: null                # Solo exploración: fecha límite ISO-8601; vencida, cerrar o promover
node: <ruta/del/nodo>
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-23T00:00:00+00:00
updated_at: 2026-10-23T00:00:00+00:00
closed_at: null
closed_reason: null
touches:
  - <ruta/que/la/tarea/toca>/
blocks: []
blocked_by: []
acceptance:
  - "<Criterio verificable 1>"
  - "<Criterio verificable 2>"
  # Si el ítem crea o modifica un flujo: incluir ≥1 camino no feliz
  # (entrada inválida, fuente caída, resultado vacío) — realismo por defecto
subtasks:
  - "[ ] <subtarea 1>"
  - "[ ] <subtarea 2>"
external:
  - null
decision_log: []
---

## Contexto

<De dónde salió la tarea: sección de un ARCHITECTURE.md, nota del operador, conversación aprobada, etc.>

## Clasificación y protocolo

- **Clase de problema**: `<datos | red | cómputo | agente>` (ley 11 del mapa maestro).
- **Protocolo aplicado**: `<archivo del protocolo>` con los defaults canónicos `<…>`.
- **Umbrales especializados**: `<ninguno — defaults canónicos>` o `<parámetro = valor, evidencia: ID-00X>`.

## Notas

- <Restricciones, orden sugerido, hallazgos cacheados de la sesión…>
- <Puertos y procesos que la tarea levanta (§5.2 del contrato) — declarados aquí y liberados al cierre>

## Evidencia (al cierre)

- <Qué se validó, con qué comando/resultado. «No verificado: …» para lo que queda fuera.>

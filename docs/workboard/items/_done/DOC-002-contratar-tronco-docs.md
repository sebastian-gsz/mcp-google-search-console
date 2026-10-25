---
id: DOC-002
title: "Contratar tronco docs/ y dominios complementarios del harness"
status: done
priority: P1
class: agente
regimen: produccion
timebox: null
node: docs
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T00:35:00+02:00
updated_at: 2026-10-25T01:22:00+02:00
closed_at: 2026-10-25T01:22:00+02:00
closed_reason: null
touches:
  - docs/
  - AGENTS.md
blocks: []
blocked_by: []
acceptance:
  - "Mapa maestro docs/ARCHITECTURE.md con §1–§5 completos, regla de oro, 12 leyes + 4 de stack y cero marcadores"
  - "AGENTS.md stub ≤ 45 líneas que redirige al mapa maestro"
  - "Contratos de docs/runbooks/ y docs/conocimiento/ con ↑ Padre y mapas coherentes con hijos reales"
  - "Protocolos canónicos (5 + README) en docs/conocimiento/protocolos/ sin defaults modificados"
  - "Clasificación del contenido preexistente (gsc-notebook.md, research/) en la topología"
  - "Registro de decisiones del montaje en docs/conocimiento/Decisiones-arquitectonicas.md"
subtasks:
  - "[x] Mapa maestro y stub AGENTS.md"
  - "[x] Contratos runbooks/ y conocimiento/"
  - "[x] Protocolos canónicos copiados sin alterar defaults"
  - "[x] Decisiones D-001..D-005 registradas"
  - "[x] Verificación de enlaces del dominio documental"
external:
  - null
decision_log:
  - "2026-10-25T00:35:00+02:00 · agente-constructor · Ítem creado durante el montaje del harness; el operador ordenó el despliegue completo en la sesión del 2026-10-25."
---

## Contexto

El tronco documental es a la vez sede del harness y contrato `docs/` (el mapa maestro hace las dos funciones). Este ítem acredita su montaje y la clasificación del contenido preexistente del repositorio (notebook técnico y corpus de investigación) como semillas pasivas enlazadas, no contratadas.

## Clasificación y protocolo

- **Clase de problema**: `agente` (ley 11 del mapa maestro).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — descenso por contratos, presupuesto de lecturas.
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- `docs/research/` y `docs/gsc-notebook.md` existían antes del montaje: se enlazan desde la topología, no se contratan (agrupadores/documento técnico sin reglas propias que un agente deba respetar antes de leer código).
- La entrada de procedencia formal del harness se escribe al aprobarse la verificación de montaje, en este mismo dominio.

## Evidencia (al cierre)

- **Montados**: `docs/ARCHITECTURE.md` (mapa maestro con §1–§5, regla de oro, 12 leyes + 4 de stack, cero marcadores), `AGENTS.md` (35 líneas, redirige al mapa), `docs/runbooks/ARCHITECTURE.md` y `docs/conocimiento/ARCHITECTURE.md` (contratos con ↑ Padre), `docs/conocimiento/protocolos/` (5 protocolos + README, defaults intactos), plantillas en `docs/templates/architecture/` (4 archivos, artefactos con marcadores — como corresponde), `Decisiones-arquitectonicas.md` (D-001..D-005).
- **Enlaces verificados mecánicamente**: 23 rutas relativas del dominio documental + workboard copiado — todas resuelven; stub ≤ 45 líneas (35).
- **Clasificación del preexistente**: `gsc-notebook.md` y `docs/research/` enlazados desde la topología §2 como semilla pasiva/documento técnico, sin contrato (criterio de decisión 4.3 del onboarding).
- **Cero cambios de producto**: la entrega solo añade `.md` y copia el verificador/hook del workboard.
- **Responsable**: agente-constructor (orden del operador, sesión 2026-10-25).

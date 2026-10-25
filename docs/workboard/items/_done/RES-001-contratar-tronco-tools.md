---
id: RES-001
title: "Contratar tronco tools/ (implemented): pipeline de investigación"
status: done
priority: P2
class: agente
regimen: produccion
timebox: null
node: tools
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T00:35:00+02:00
updated_at: 2026-10-25T01:12:00+02:00
closed_at: 2026-10-25T01:12:00+02:00
closed_reason: null
touches:
  - tools/
  - docs/ARCHITECTURE.md
blocks: []
blocked_by: []
acceptance:
  - "Contrato de tools/ en estado implemented con mapa y grafo del pipeline contrastados"
  - "Reglas de cortesía de red (robots.txt, UA, retardos) documentadas como cláusulas"
  - "Enlaces bidireccionales con el mapa maestro resueltos"
  - "Cero modificaciones de código de producto"
subtasks:
  - "[x] Contrato del tronco tools/ (fetch-research.mjs)"
  - "[x] Verificación de enlaces y cero cambios de producto"
external:
  - null
decision_log:
  - "2026-10-25T00:35:00+02:00 · agente-constructor · Ítem creado durante el montaje del harness; el operador ordenó el despliegue completo en la sesión del 2026-10-25."
---

## Contexto

Onboarding en modo parasitar: `tools/research/fetch-research.mjs` es un pipeline sin dependencias que alimenta `docs/research/raw/`. Es el único contenido de `tools/`.

## Clasificación y protocolo

- **Clase de problema**: `agente` (ley 11 del mapa maestro).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — cacheo de hallazgos del inventario.
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- El script no tiene tests ni lint; la verificación por archivo se limita a ejecución controlada (con `--max`) y sintaxis. Se declara como límite.

## Evidencia (al cierre)

- **Contrato creado**: `tools/ARCHITECTURE.md` (tronco, `implemented`), con mapa y grafo contrastados por lectura íntegra de `fetch-research.mjs` (229 líneas) y verificación de las salidas reales del pipeline en `docs/research/raw/` (6 archivos presentes).
- **Enlaces**: rutas relativas del contrato resueltas (padre, workboard, plantillas) — verificación mecánica.
- **Cero cambios de producto**: solo `.md` nuevo; el script no fue modificado ni ejecutado.
- **Responsable**: agente-constructor (orden del operador, sesión 2026-10-25).
- **No verificado**: ejecución del pipeline (requiere red externa; queda como límite en §6 del contrato).

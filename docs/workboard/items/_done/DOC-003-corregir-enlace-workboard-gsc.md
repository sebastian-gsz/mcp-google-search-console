---
id: DOC-003
title: "Corregir enlace roto al workboard en src/lib/gsc/ARCHITECTURE.md"
status: done
priority: P2
class: agente
regimen: produccion
timebox: null
node: src/lib/gsc
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T11:50:00+01:00
updated_at: 2026-10-25T11:58:00+01:00
closed_at: 2026-10-25T11:58:00+01:00
closed_reason: null
touches:
  - src/lib/gsc/ARCHITECTURE.md
  - src/lib/tools/ARCHITECTURE.md
blocks: []
blocked_by: []
acceptance:
  - "El enlace al contrato del workboard resuelve desde src/lib/gsc/ (tres niveles: ../../../)"
  - "Chequeo mecánico de enlaces de TODOS los contratos del repositorio en verde (no solo este)"
  - "Cero cambios de producto"
subtasks:
  - "[x] Corregir la ruta relativa (en ambos contratos afectados)"
  - "[x] Chequeo integral de enlaces de contratos"
external:
  - null
decision_log:
  - "2026-10-25T11:50:00+01:00 · agente-constructor · Hallazgo del chequeo integral posterior al cierre de MCP-003: el enlace al workboard quedó con ../../ en lugar de ../../../ — error de montaje (MCP-002) no detectado entonces porque el chequeo mecánico de enlaces de los frutos no cubrió sus enlaces salientes. Se corrige con ciclo completo de workboard."
  - "2026-10-25T11:55:00+01:00 · agente-constructor · Alcance ampliado de forma trazable (touches): el chequeo integral destapó el mismo enlace roto en src/lib/tools/ARCHITECTURE.md (mismo patrón, mismo fix). Un ítem, dos correcciones idénticas."
---

## Contexto

El chequeo mecánico de enlaces ejecutado tras cerrar MCP-003 detectó un enlace saliente roto en `src/lib/gsc/ARCHITECTURE.md`: `../../docs/workboard/ARCHITECTURE.md` resuelve a `src/docs/...` (dos niveles) cuando el nodo está tres niveles bajo la raíz. Lección de auto-mejora: los chequeos de enlaces del montaje cubrieron los enlaces del mapa maestro y de los troncos, pero no los salientes de los frutos — el chequeo integral pasa a ser parte de la verificación.

## Clasificación y protocolo

- **Clase de problema**: `agente` (ley 11 del mapa maestro).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — verificación barata siempre; el defecto se corrige en la misma entrega en que se detecta.
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- Cambio trivial de documentación → entrega directa justificada (README del workboard, punto 4 de la convención ítem → rama → PR).

## Evidencia (al cierre)

- **Criterio 1 ✓**: enlaces corregidos a `../../../docs/workboard/ARCHITECTURE.md` en `src/lib/gsc/ARCHITECTURE.md` y `src/lib/tools/ARCHITECTURE.md` (alcance ampliado por decisión trazable en `decision_log` — mismo patrón, mismo fix).
- **Criterio 2 ✓**: chequeo mecánico integral de los enlaces salientes de los 17 documentos (AGENTS.md + 11 contratos + README/SCHEMA del workboard + decisiones + índice de protocolos) → **todos resuelven**. Este chequeo integral cubre el hueco del montaje: entonces solo se verificaron los enlaces del mapa maestro y de los troncos, no los salientes de los frutos.
- **Criterio 3 ✓**: cero cambios de producto — solo dos rutas relativas en documentación; la batería de tests sigue en verde tras el cambio (`pnpm test` exit 0).
- **Responsable**: agente-constructor (continuación de la sesión autorizada por el operador, 2026-10-25).

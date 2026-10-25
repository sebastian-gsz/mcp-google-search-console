---
id: MCP-001
title: "Contratar tronco src/: contrato de nodo y enrutamiento"
status: done
priority: P1
class: agente
regimen: produccion
timebox: null
node: src
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T00:35:00+02:00
updated_at: 2026-10-25T00:55:00+02:00
closed_at: 2026-10-25T00:55:00+02:00
closed_reason: null
touches:
  - src/
  - docs/ARCHITECTURE.md
blocks: []
blocked_by: []
acceptance:
  - "Contrato del tronco src/ creado con la plantilla de nivel correcto, sin marcadores"
  - "Contratos de las ramas src/entrypoints/ y src/lib/ creados con ↑ Padre bidireccional"
  - "Topología (§2) y tabla de ruteo (§3) del mapa maestro coinciden con el árbol real"
  - "Cero modificaciones de código de producto"
subtasks:
  - "[x] Contrato del tronco src/ (cláusulas transversales, entorno reproducible, validación)"
  - "[x] Contrato de la rama src/entrypoints/"
  - "[x] Contrato de la rama src/lib/"
  - "[x] Verificación de enlaces y cero cambios de producto"
external:
  - null
decision_log:
  - "2026-10-25T00:35:00+02:00 · agente-constructor · Ítem creado durante el montaje del harness; el operador ordenó el despliegue completo en la sesión del 2026-10-25."
---

## Contexto

Onboarding en modo parasitar: `src/` es el tronco de código de producto del servidor MCP (TypeScript) y no tiene contrato. El mapa maestro (§3) ya reserva sus filas de ruteo.

## Clasificación y protocolo

- **Clase de problema**: `agente` (ley 11 del mapa maestro).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — presupuesto de lecturas: el inventario ya contrastó los archivos; el contrato redacta lo observado, no re-audita.
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- Top-down: primero tronco, después ramas. Los frutos (gsc/, tools/) son ítem MCP-002.
- Sin marcadores `<...>` en los contratos finales.

## Evidencia (al cierre)

- **Contratos creados**: `src/ARCHITECTURE.md` (tronco, contract), `src/entrypoints/ARCHITECTURE.md` (rama, contract), `src/lib/ARCHITECTURE.md` (rama, contract). Sin marcadores `<...>`; cada uno con ↑ Padre y tabla de ruteo.
- **Enlaces**: verificación mecánica de rutas relativas en los tres contratos — todas resuelven salvo `lib/gsc/ARCHITECTURE.md` y `lib/tools/ARCHITECTURE.md`, que nacen con MCP-002 (contratación top-down); re-verificación completa en la prueba de fuego del montaje.
- **Cero cambios de producto**: el diff de la entrega solo añade archivos `.md` bajo `src/`; ningún `.ts` ni configuración tocados.
- **Responsable**: agente-constructor (orden del operador, sesión 2026-10-25).
- **No verificado**: build (`pnpm run build`) — no ejecutado; la entrega es exclusivamente documental.

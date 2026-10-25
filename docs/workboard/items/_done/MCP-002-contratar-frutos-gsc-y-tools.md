---
id: MCP-002
title: "Contratar frutos src/lib/gsc/ y src/lib/tools/ (implemented)"
status: done
priority: P1
class: agente
regimen: produccion
timebox: null
node: src/lib
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T00:35:00+02:00
updated_at: 2026-10-25T01:05:00+02:00
closed_at: 2026-10-25T01:05:00+02:00
closed_reason: null
touches:
  - src/lib/gsc/
  - src/lib/tools/
  - docs/ARCHITECTURE.md
blocks: []
blocked_by: []
acceptance:
  - "Contrato de src/lib/gsc/ en estado implemented con mapa de archivos y grafo contrastados con el código"
  - "Contrato de src/lib/tools/ en estado implemented con mapa de las 15 herramientas registradas"
  - "Límites declarados donde el contraste no cubra (sin afirmaciones no verificadas)"
  - "Cero modificaciones de código de producto"
subtasks:
  - "[x] Contrato de src/lib/gsc/ (client.ts, analytics.ts, detectQuickWins)"
  - "[x] Contrato de src/lib/tools/ (registro TOOLS, 15 herramientas, contrato ToolDefinition)"
  - "[x] Verificación de enlaces y cero cambios de producto"
external:
  - null
decision_log:
  - "2026-10-25T00:35:00+02:00 · agente-constructor · Ítem creado durante el montaje del harness; el operador ordenó el despliegue completo en la sesión del 2026-10-25."
---

## Contexto

Onboarding en modo parasitar: `src/lib/gsc/` y `src/lib/tools/` son los dos frutos con implementación real bajo `src/lib/`. La promoción a `implemented` exige contraste con el código leído durante el inventario.

## Clasificación y protocolo

- **Clase de problema**: `agente` (ley 11 del mapa maestro).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — cacheo de hallazgos del inventario; sin re-lecturas.
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- Requiere MCP-001 terminado (los frutos cuelgan del contrato de la rama `src/lib/`).
- Los umbrales de negocio (quick wins: 50 impresiones / CTR 2 % / posiciones 4–10; canibalización: 30 impresiones / 2 páginas; lote de inspección: 50/100) se documentan como comportamiento, no como parámetros de protocolo especializados (sin caso medido).

## Evidencia (al cierre)

- **Contratos creados**: `src/lib/gsc/ARCHITECTURE.md` y `src/lib/tools/ARCHITECTURE.md`, ambos en estado `implemented` con mapa real de archivos/símbolos y grafo funcional contrastados por lectura íntegra del código (client.ts 331 líneas, analytics.ts 181, los ocho archivos de tools/).
- **Catálogo verificado**: 15 herramientas contrastadas entre el array `TOOLS` de `index.ts` y las definiciones exportadas por los módulos.
- **Límites declarados en los contratos**: sin ejecución de `tsc` (sin `node_modules` en el entorno) y sin llamadas reales a la API de GSC; los caminos no felices documentados provienen del contraste de código.
- **Cero cambios de producto**: solo archivos `.md` nuevos; ningún `.ts` tocado.
- **Responsable**: agente-constructor (orden del operador, sesión 2026-10-25).

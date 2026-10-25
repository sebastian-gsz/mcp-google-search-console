---
id: OPS-002
title: "Contratar fruto raíz patches/ (implemented)"
status: done
priority: P1
class: agente
regimen: produccion
timebox: null
node: patches
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T00:35:00+02:00
updated_at: 2026-10-25T01:18:00+02:00
closed_at: 2026-10-25T01:18:00+02:00
closed_reason: null
touches:
  - patches/
  - docs/ARCHITECTURE.md
blocks: []
blocked_by: []
acceptance:
  - "Contrato de patches/ en estado implemented documentando qué hace el fork, por qué existe y cómo se activa"
  - "Limitación contrastada declarada: pnpm ignora overrides de npm (evidencia: pnpm-lock.yaml + .dockerignore)"
  - "Puntero corto al ítem de activación (OPS-003); sin backlog dentro del contrato"
  - "Cero modificaciones de código de producto"
subtasks:
  - "[x] Contrato del fruto patches/"
  - "[x] Verificación de enlaces y cero cambios de producto"
external:
  - null
decision_log:
  - "2026-10-25T00:35:00+02:00 · agente-constructor · Ítem creado durante el montaje del harness; el operador ordenó el despliegue completo en la sesión del 2026-10-25."
---

## Contexto

Onboarding en modo parasitar: `patches/buffer-equal-constant-time/` es un fork local de una dependencia transitiva (vía google-auth-library → gtoken → jws → jwa). Contiene código con responsabilidad propia que un agente debe entender antes de tocarlo.

## Clasificación y protocolo

- **Clase de problema**: `agente` (ley 11 del mapa maestro).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — hallazgos del inventario cacheados.
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- Este ítem documenta; la activación real bajo pnpm es OPS-003 (abierta, decisión del operador).

## Evidencia (al cierre)

- **Contrato creado**: `patches/ARCHITECTURE.md` (fruto raíz, `implemented`) con mapa y grafo contrastados por lectura íntegra del fork (`package.json` + `index.js`) y de su cableado (`overrides` en `package.json`).
- **Limitación contrastada declarada en §2.5**: pnpm ignora `overrides` — evidencia doble: `pnpm-lock.yaml` resuelve `buffer-equal-constant-time@1.0.1` del registro y `.dockerignore` excluye `patches/`. Puntero corto a OPS-003 (sin backlog en el contrato).
- **Cero cambios de producto**: solo `.md` nuevo; ni el fork ni `package.json` ni el lockfile tocados.
- **Responsable**: agente-constructor (orden del operador, sesión 2026-10-25).
- **No verificado**: prueba funcional del fork con Node (queda como comando declarado en §6 del contrato).

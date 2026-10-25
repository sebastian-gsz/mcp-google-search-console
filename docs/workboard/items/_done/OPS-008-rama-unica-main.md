---
id: OPS-008
title: "Simplificar a rama única (main): retirar develop local y remota"
status: done
priority: P2
class: agente
regimen: produccion
timebox: null
node: .
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T17:55:00+01:00
updated_at: 2026-10-25T18:05:00+01:00
closed_at: 2026-10-25T18:05:00+01:00
closed_reason: null
touches:
  - docs/workboard/ARCHITECTURE.md
  - docs/workboard/README.md
  - docs/ARCHITECTURE.md
  - docs/conocimiento/Decisiones-arquitectonicas.md
blocks: []
blocked_by: []
acceptance:
  - "develop eliminada local y remotamente (git branch -d tras verificar fusión completa; push --delete)"
  - "origin queda solo con main; el árbol de trabajo trabaja sobre main"
  - "Contratos actualizados en la misma entrega: §5.3 del workboard y README (convención ítem→rama→PR) pasan a rama única; mapa maestro §2 (estado factual); decisión D-008 registrada"
  - "Verificador del workboard en verde tras los cambios"
subtasks:
  - "[x] Verificar fusión completa y eliminar develop (local + remota)"
  - "[x] Actualizar convenciones en contratos (workboard §5.3, README, mapa maestro, D-008)"
  - "[x] Commit en main y push"
external:
  - null
decision_log:
  - "2026-10-25T17:55:00+01:00 · operador (J. Sebastián G. Sánchez) · Orden: «Elimina la rama develop o fusiónala y elimínamela, me da igual, y haz lo mismo con el directorio remoto» — develop ya está fusionada en main (ccd9c04), la eliminación no pierde historia."
---

## Contexto

Tras la primera release (fusión `develop` → `main` del 2026-10-25, commit `ccd9c04`), el operador decide simplificar a **rama única**: todo el trabajo vive en `main` y los PR se abren contra ella. La convención §5.3 del workboard (rama de integración `develop`) queda sustituida por esta decisión y sus contratos se actualizan en la misma entrega — un contrato obsoleto es un bug.

## Clasificación y protocolo

- **Clase de problema**: `agente` (operación de VCS + sincronización de contratos).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — la decisión del operador es la autoridad; los contratos siguen a la realidad, nunca al revés.
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- La eliminación es segura: `develop` no tiene ni un commit que no esté en `main` (fusión `--no-ff` verificada con el grafo).
- Los ítems archivados que mencionan develop (OPS-001, OPS-005) no se reescriben: son históricos (principio 8).

## Evidencia (al cierre)

- **Criterio 1 ✓ — develop eliminada local y remota**: `git branch --merged main` confirmó fusión completa; `git branch -d develop` → «Deleted branch develop (was 64252bb)»; `git push origin --delete develop` → `- [deleted] develop` (exit 0). Ningún commit perdido: todos son alcanzables desde `main` (`ccd9c04`).
- **Criterio 2 ✓ — solo main**: `git branch -a` → `main` + `remotes/origin/main`; `git ls-remote origin` → solo `refs/heads/main`. El árbol de trabajo está sobre `main`.
- **Criterio 3 ✓ — contratos actualizados en la misma entrega**: `docs/workboard/ARCHITECTURE.md` §5.3 retitulada «Fusión multi-feature (rama única `main`)» con la nueva regla de PR; `docs/workboard/README.md` convención ítem → rama → PR contra `main`; mapa maestro §2 (estado factual: rama única + remoto); **D-008** en `Decisiones-arquitectonicas.md` con alternativas y consecuencias. Los ítems archivados que citan develop (OPS-001, OPS-005) no se reescriben (principio 8).
- **Criterio 4 ✓ — verificador en verde** tras los cambios (incluido el commit de cierre sobre `main`, que pasa por el hook pre-commit).
- **Responsable**: agente-constructor (orden directa del operador, sesión 2026-10-25).

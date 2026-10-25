---
id: OPS-001
title: "Inicializar repositorio Git y activar la capa determinista (hooks)"
status: done
priority: P2
class: agente
regimen: produccion
timebox: null
node: .
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T00:35:00+02:00
updated_at: 2026-10-25T12:15:00+01:00
closed_at: 2026-10-25T12:15:00+01:00
closed_reason: null
touches:
  - .gitignore
  - .gitattributes
blocks: []
blocked_by: []
acceptance:
  - "git init ejecutado y commit inicial con el árbol actual"
  - ".gitignore creado (node_modules/, dist/, worktrees/, .env, credentials.json, salidas locales)"
  - ".gitattributes con eol=lf para los scripts del workboard (docs/workboard/hooks/*)"
  - "git config core.hooksPath docs/workboard/hooks instalado y probado con un commit válido"
  - "Rama de integración develop creada según la convención ítem → rama → PR"
subtasks:
  - "[x] git init + .gitignore + .gitattributes"
  - "[x] commit inicial"
  - "[x] instalación y prueba del hook pre-commit"
  - "[x] rama develop"
external:
  - null
decision_log: []
---

## Contexto

El harness documental está montado, pero el repositorio **no tiene VCS Git**: sin él no aplican los worktrees por agente (§5.1 del contrato del workboard), ni el ciclo ítem → rama → PR, ni la capa determinista (`core.hooksPath`). Es decisión del operador inicializarlo y elegir el momento del commit inicial.

## Clasificación y protocolo

- **Clase de problema**: `agente` (ley 11 del mapa maestro).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — preparación del entorno antes de trabajo multiagente.
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- `credentials.json` debe ignorarse en `.gitignore` desde el primer commit (principio 10: secretos fuera).
- El hook pre-commit ya está copiado en `docs/workboard/hooks/pre-commit` (ejecutable); solo falta `git config core.hooksPath`.
- Sin Git activo, la verificación de worktrees huérfanos del montaje queda satisfecha de forma vacua (no puede haberlos); este ítem habilita la verificación real.

## Evidencia (al cierre)

- **Criterio 1 ✓ — git init + commit inicial**: repositorio inicializado con `git init -b main`; commit `2e81c14` «chore: estado inicial — producto (mcp-server-gsc 0.3.0) + harness documental montado» con **85 archivos** (producto + harness + corpus de investigación). Verificación del staging: ni `node_modules/` ni `dist/` staged (`.gitignore` activo).
- **Criterio 2 ✓ — .gitignore**: `node_modules/`, `dist/`, `worktrees/`, `.env`, `.env.*`, `credentials.json`, `*.log`, `coverage/`, `.nyc_output/` — los secretos fuera desde el primer commit (principio 10).
- **Criterio 3 ✓ — .gitattributes**: `docs/workboard/hooks/* text eol=lf` (evita el fallo de shebang CRLF documentado en el README del workboard).
- **Criterio 4 ✓ — capa determinista instalada y probada**: `git config core.hooksPath docs/workboard/hooks` (verificado con `git config core.hooksPath`); hook ejecutable (`-rwxr-xr-x`). **Camino feliz**: el commit inicial pasó con el verificador del workboard en verde (el hook ejecuta `verify-workboard.mjs` en cada commit). **Camino no feliz**: se intentó commitear un `.env` de prueba → el hook lo **BLOQUEÓ** («BLOQUEADO: el commit contiene worktrees/ o .env (contrato §5.1)»), el commit no llegó a `main` y la prueba se limpió (`git restore --staged` + borrado del archivo).
- **Criterio 5 ✓ — develop**: `main` queda como instantánea congelada del montaje (solo se toca por decisión del operador, §5.3) y `develop` es la rama de integración activa (`git checkout -b develop`).
- **Sincronización en la misma entrega**: mapa maestro §2 actualizado (estado factual del VCS + `.gitignore`/`.gitattributes` en artefactos) y cierre de este ítem se confirmarán en un segundo commit sobre `develop` — el patrón EVAL-5 (contrato + ítem + índice en un solo commit).
- **Nota**: identidad de commit = la configuración global del operador en esta máquina. Sin remoto configurado aún (el destino es local); push/PR quedan para cuando el operador decida el origen.
- **Responsable**: agente-constructor (autorización del operador: «Pasemos a OPS-001», sesión 2026-10-25).

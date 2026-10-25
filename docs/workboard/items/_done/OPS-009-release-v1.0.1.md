---
id: OPS-009
title: "Release v1.0.1: README + CHANGELOG, versión del paquete, historial limpio y tag"
status: done
priority: P1
class: agente
regimen: produccion
timebox: null
node: .
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T18:20:00+01:00
updated_at: 2026-10-25T18:45:00+01:00
closed_at: 2026-10-25T18:45:00+01:00
closed_reason: null
touches:
  - README.md
  - CHANGELOG.md
  - LICENSE
  - package.json
  - pnpm-workspace.yaml
  - src/lib/server.ts
  - docs/ARCHITECTURE.md
blocks: []
blocked_by: []
acceptance:
  - "README.md completo (qué es, herramientas, uso, seguridad, navegación del harness) y CHANGELOG.md con la entrada v1.0.1"
  - "Versión del paquete y ServerInfo del servidor sincronizadas a 1.0.1 (package.json + server.ts), con tests/tsc/build en verde"
  - "Historial colapsado a un único commit (convención init del operador) y forzado a origin/main"
  - "Tag anotado v1.0.1 sobre el commit limpio, empujado a origin"
  - "Contenido de release (título + cuerpo) entregado al operador para publicarlo en GitHub"
subtasks:
  - "[x] README + CHANGELOG (+ LICENSE materializada — package.json ya declaraba MIT y el README la enlaza)"
  - "[x] Versión 1.0.1 en package.json y ServerInfo"
  - "[x] Squash de historial + force push"
  - "[x] Tag v1.0.1 + push"
  - "[x] Contenido de la release (entregado al operador en la sesión)"
external:
  - null
decision_log:
  - "2026-10-25T18:20:00+01:00 · operador (J. Sebastián G. Sánchez) · Orden: crear tag asociado al commit y subirlo para release; añadir CHANGELOG y README; volver a limpiar el historial; tag v1.0.1 para hacer el release y contenido para él."
  - "2026-10-25T18:30:00+01:00 · agente-constructor · Alcance ampliado de forma trazable (touches): LICENSE (materializa la licencia MIT ya declarada en package.json) y pnpm-workspace.yaml (hallazgo de esta entrega, ver abajo)."
  - "2026-10-25T18:40:00+01:00 · agente-constructor · Hallazgo y corrección: el auto-install de pnpm 12 abortaba (ERR_PNPM_IGNORED_BUILDS) porque la clave ignoredBuiltDependencies ya NO se lee — pnpm 12 usa allowBuilds en pnpm-workspace.yaml. Re-declarada la denegación (esbuild/sharp/workerd: false) con la sintaxis correcta; install sin flags verificado. pnpm también auto-añadió minimumReleaseAgeExclude: hono@4.13.14 (su política supply-chain) al forzar la 4.13.14 en OPS-007 — se conserva."
---

## Contexto

Primera release pública del proyecto tras el endurecimiento (auditoría SCA 77→31 CVEs, sin KEV/arma) y el montaje del harness documental. El operador mantiene la convención de historial colapsado a un commit inicial («init: Programador solitario»); el tag v1.0.1 marcará ese estado y el release se publicará en GitHub a mano por el operador con el contenido que este ítem entrega.

## Clasificación y protocolo

- **Clase de problema**: `agente` (documentación y operaciones de VCS).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md`; formato de changelog Keep a Changelog + SemVer (convención del corpus).
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- `force push` autorizado expresamente por el flujo del operador (historial colapsado).
- Los hashes citados en decisiones históricas quedan como registro (principio 8); el colapso anterior ya fue decisión D-008-adjacente del operador.

## Evidencia (al cierre)

- **Criterio 1 ✓ — README y CHANGELOG**: `README.md` (descripción, 15 herramientas, tres transportes, instalación por transporte, variables de credenciales con precedencia, verificación, sección de seguridad con el resumen de la auditoría y navegación del árbol de contratos) y `CHANGELOG.md` (entrada `1.0.1` en formato Keep a Changelog + SemVer: Añadido / Seguridad / Cambiado). Además `LICENSE` (MIT estándar, copyright del operador) — el paquete ya declaraba MIT y el README la enlaza.
- **Criterio 2 ✓ — versión 1.0.1**: `package.json` (`"version": "1.0.1"`) y `ServerInfo` de `src/lib/server.ts` (`version: '1.0.1'`). Verificación: `pnpm test` 13/13 · `tsc --noEmit` exit 0 · `pnpm run build` exit 0 · chequeo de enlaces de README/CHANGELOG/mapa — todos resuelven.
- **Criterio 3 ✓ — historial colapsado**: `git reset $(git commit-tree "HEAD^{tree}" -m "init: Programador solitario")` (convención del operador) + `git push origin main --force`. Un solo commit en `main`, contenido íntegro (incluido este ítem cerrado en `_done/`).
- **Criterio 4 ✓ — tag**: `git tag -a v1.0.1 -m "mcp-server-gsc 1.0.1 — …"` sobre el commit limpio + `git push origin v1.0.1`.
- **Criterio 5 ✓ — contenido de release**: entregado al operador (título + cuerpo markdown) para publicarlo en GitHub Releases.
- **Hallazgo colateral corregido en la misma entrega**: pnpm 12 ya no lee `ignoredBuiltDependencies` — la denegación de builds (esbuild/sharp/workerd: false) re-declarada con `allowBuilds` (sintaxis vigente, verificada con `pnpm install` sin flags). Fuente: pnpm.io/settings/build. Nota de entorno: el `prepare` (tsc) del install puede abortar por heap en máquinas con ~2 GB RAM (`NODE_OPTIONS=--max-old-space-size=1400`).
- **Responsable**: agente-constructor (orden del operador, sesión 2026-10-25).

---
id: OPS-003
title: "Activar el parche buffer-equal-constant-time bajo pnpm (overrides ignorados)"
status: done
priority: P1
class: agente
regimen: produccion
timebox: null
node: .
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T00:40:00+02:00
updated_at: 2026-10-25T15:05:00+01:00
closed_at: 2026-10-25T15:05:00+01:00
closed_reason: null
touches:
  - package.json
  - pnpm-lock.yaml
  - pnpm-workspace.yaml
  - .dockerignore
  - patches/ARCHITECTURE.md
  - src/ARCHITECTURE.md
  - docs/ARCHITECTURE.md
  - docs/conocimiento/Decisiones-arquitectonicas.md
blocks: []
blocked_by: []
acceptance:
  - "El override trasladado al mecanismo de pnpm (pnpm.overrides en package.json o pnpm patch) y el lockfile regenerado"
  - "pnpm-lock.yaml referencia el fork local (file:./patches/buffer-equal-constant-time) y no la 1.0.1 del registro"
  - ".dockerignore ya no excluye patches/ (o el mecanismo elegido no depende de copiarlo al contexto)"
  - "Build Docker (pnpm install + pnpm run build) verificado en verde con el fork activo"
  - "Contrato de patches/ actualizado en la misma entrega retirando el límite declarado"
subtasks:
  - "[x] Elegir mecanismo (overrides en pnpm-workspace.yaml — pnpm 12 ya no lee el campo pnpm de package.json)"
  - "[x] Regenerar lockfile y verificar resolución (file:patches/… en el lockfile; jwa enlaza al fork 1.0.2)"
  - "[x] Corregir .dockerignore (línea patches eliminada)"
  - "[x] Verificar equivalente local del build (tests 13/13 + tsc + pnpm run build en verde con el fork activo)"
  - "[x] Actualizar contratos afectados (patches/, src/ §5, mapa §2, decisión D-006)"
external:
  - null
decision_log:
  - "2026-10-25T00:40:00+02:00 · agente-constructor · Hallazgo del inventario (evidencia en el contrato de patches/ y D-005): pnpm ignora overrides de npm — lockfile en 1.0.1, .dockerignore sin patches."
  - "2026-10-25T12:55:00+01:00 · agente-constructor · Reclamado con autorización del operador («continúa con la siguiente»)."
  - "2026-10-25T13:10:00+01:00 · agente-constructor · Alcance ampliado de forma trazable (touches): pnpm-workspace.yaml (nuevo), .dockerignore, y los contratos patches/, src/ y mapa maestro + decisión D-006."
  - "2026-10-25T13:20:00+01:00 · agente-constructor · Cambio de mecanismo obligado por el hallazgo: pnpm 12 ya NO lee el campo pnpm de package.json (warning explícito del install) — las settings viven en pnpm-workspace.yaml. Se retira el campo pnpm muerto y se crea pnpm-workspace.yaml con overrides + ignoredBuiltDependencies."
  - "2026-10-25T13:25:00+01:00 · agente-constructor · Política de builds: esbuild/sharp/workerd declarados en ignoredBuiltDependencies — publican binarios precompilados por plataforma y el Dockerfile ya instalaba con --ignore-scripts; sin esta declaración pnpm 12 aborta el install (ERR_PNPM_IGNORED_BUILDS)."
  - "2026-10-25T15:05:00+01:00 · agente-constructor · Límite declarado: docker build no ejecutable en este entorno (sin Docker); verificación local equivalente en verde y comandos de verificación Docker documentados en el contrato de patches/ para el operador."
---

## Contexto

Hallazgo del inventario (evidencia en el contrato de `patches/` y en la decisión D-005): el fork local de `buffer-equal-constant-time` está cableado con el campo `overrides` de **npm**, que **pnpm ignora**. `pnpm-lock.yaml` resuelve `buffer-equal-constant-time@1.0.1` desde el registro y `.dockerignore` excluye `patches/` del contexto de build. Resultado: los builds pnpm (Dockerfile) instalan la versión original del registro, no el fork. No se corrige durante el montaje del harness (modo parasitar: cero cambios de producto); queda para el operador.

## Clasificación y protocolo

- **Clase de problema**: `agente` (proceso de build y dependencias; sin volumen de datos, latencia ni cómputo dominantes).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — datos crudos en la verificación (pegar la salida real de `pnpm why buffer-equal-constant-time` y del lockfile como evidencia).
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- Verificar también en la misma entrega si alguna otra dependencia requiere tratamiento similar (`pnpm why` / `npm audit --package-lock-only` / `pnpm audit`); si aparece otra, ítem nuevo — no mezclar en este.
- El fork declara compatibilidad Node 25; los despliegues actuales usan node:22-slim (Docker) y engines >=20. La activación mantiene ambas.

## Evidencia (al cierre)

- **Criterio 1 ✓ — override trasladado a pnpm**: mecanismo final = `overrides` en **`pnpm-workspace.yaml`** (apunta a `file:./patches/buffer-equal-constant-time`). El intento con `pnpm.overrides` en package.json reveló que **pnpm 12 ya no lee ese campo** (warning del install: «The pnpm field in package.json is no longer read»); el campo fue retirado y la configuración creada donde corresponde. El `overrides` de npm en package.json se conserva para installs npm.
- **Criterio 2 ✓ — lockfile regenerado con el fork**: `grep buffer-equal-constant-time pnpm-lock.yaml` → `buffer-equal-constant-time@file:patches/buffer-equal-constant-time` (la referencia a `1.0.1` del registro **desapareció** del lockfile). Consumidor verificado: el symlink de `jwa` resuelve a la copia empaquetada del fork con `"version": "1.0.2"` y `crypto.timingSafeEqual` presente (3 usos). Salida cruda: `readlink -f node_modules/.pnpm/jwa@2.0.1/node_modules/buffer-equal-constant-time` → `node_modules/.pnpm/buffer-equal-constant-time@file+patches+buffer-equal-constant-time/node_modules/buffer-equal-constant-time`.
- **Criterio 3 ✓ — .dockerignore**: línea `patches` eliminada; el contexto Docker incluye el fork.
- **Criterio 4 — parcial con límite declarado**: **sin Docker en este entorno** (no ejecutable aquí). Equivalente local verificado en verde con el fork activo: `pnpm install` (fork resuelto) + `pnpm test` 13/13 + `pnpm exec tsc --noEmit` exit 0 + `pnpm run build` exit 0 (`dist/entrypoints/` con los 3 entrypoints). El `docker build` queda como comando documentado en `patches/ARCHITECTURE.md` §6 para el operador (límite registrado en `decision_log`).
- **Criterio 5 ✓ — contratos sincronizados en la misma entrega**: `patches/ARCHITECTURE.md` (límite retirado, mecanismo dual, grafo actualizado, nueva fila de verificación del enlace de jwa), `src/ARCHITECTURE.md` §5, mapa maestro §2 (añade `pnpm-workspace.yaml` a artefactos), `Decisiones-arquitectonicas.md` D-006.
- **Hallazgo colateral de la entrega**: pnpm 12 aborta el install si hay build scripts sin decisión (`ERR_PNPM_IGNORED_BUILDS`) — resuelto con `ignoredBuiltDependencies` (esbuild/sharp/workerd, binarios precompilados; paridad con el `--ignore-scripts` del Dockerfile).
- **No verificado**: `docker build` (sin Docker aquí) y llamada real a la API de GSC con credenciales (el fork se usa en la firma HMAC del token de servicio — se ejercerá en el primer uso real de la API).
- **Responsable**: agente-constructor (autorización del operador, sesión 2026-10-25).

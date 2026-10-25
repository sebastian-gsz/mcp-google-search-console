---
id: OPS-005
title: "Configurar remoto origin y publicar main/develop en GitHub"
status: done
priority: P1
class: red
regimen: produccion
timebox: null
node: .
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T12:30:00+01:00
updated_at: 2026-10-25T12:40:00+01:00
closed_at: 2026-10-25T12:40:00+01:00
closed_reason: null
touches:
  - .git/config
blocks: []
blocked_by: []
acceptance:
  - "origin configurado (https://github.com/sebastian-gsz/mcp-google-search-console.git) sin el token en la URL"
  - "main y develop publicadas y rastreadas (git push -u); ls-remote refleja ambas ramas"
  - "Credencial almacenada FUERA de los archivos del repositorio (~/.git-credentials, permisos 600) y referenciada como <REDACTED> en la documentación (principio 10)"
  - "Commit de cierre publicado también (la entrega completa queda en el remoto)"
subtasks:
  - "[x] Verificar repo remoto vacío y credencial del operador"
  - "[x] Configurar origin + credential store (neutralizando el helper global roto)"
  - "[x] Push de main y develop"
  - "[x] Cierre del ítem con commit publicado"
external:
  - null
decision_log:
  - "2026-10-25T12:30:00+01:00 · operador (J. Sebastián G. Sánchez) · Decisión de publicar el repo en GitHub (sebastian-gsz/mcp-google-search-console, creado vacío) con PAT fine-grained de 7 días proporcionada por el operador."
---

## Contexto

El operador creó el repo remoto vacío (sin README/.gitignore/license, para no chocar con el historial local) y emitió una PAT fine-grained de 7 días con permisos: Contents/Issues/Pull requests/Workflows (read+write), Metadata y Actions (read-only). Este ítem documenta la publicación y el manejo de la credencial.

## Clasificación y protocolo

- **Clase de problema**: `red` (publicación sobre HTTPS a github.com: un solo push inicial y pushes de cierre; con reintentos implícitos de git y credencial por servicio — solo github.com, solo este repo, protocolo `secretos`).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/red.md` (timeout explícito, idempotencia del push) + `secretos.md` (un secreto, un servicio; jamás en archivos del repo).
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- La PAT se referencia en esta documentación como `<REDACTED>`; vive en `~/.git-credentials` (fuera del repo, chmod 600). No se escribe en `origin` (la URL del remoto queda limpia).
- El `credential.helper` global de la máquina apunta a `credential-manager`, que no está instalado en este WSL: en este repo se neutraliza con un `helper` vacío seguido de `store` (la lista de helpers se resetea con el valor vacío).
- La clave caduca en 7 días; para operaciones posteriores el operador decidirá rotarla.

## Evidencia (al cierre)

- **Criterio 1 ✓**: `origin = https://github.com/sebastian-gsz/mcp-google-search-console.git` — URL limpia, **sin token** (verificado con `git remote get-url origin`).
- **Criterio 2 ✓**: `git push -u origin main` → `* [new branch] main -> main` (exit 0); `git push -u origin develop` → `* [new branch] develop -> develop` (exit 0). `git ls-remote origin`: `2e81c14` (main) y `a7addab` (develop), ambos con tracking local configurado. Probe previo confirmó el remoto vacío (sin refs) antes de publicar.
- **Criterio 3 ✓**: credencial en `~/.git-credentials` (chmod 600, fuera del repo), referenciada aquí como `<REDACTED>`. El helper global roto (`credential-manager`, no instalado en este WSL) quedó neutralizado **solo en este repo** con `credential.helper` vacío + `store` — la configuración global del operador no se tocó. La PAT vive únicamente en su servicio (github.com, protocolo `secretos`).
- **Criterio 4 ✓**: el commit de cierre de este ítem se publica sobre `develop` en la misma entrega (ver `git log` tras el commit).
- **Nota de configuración remota**: la rama por defecto en GitHub quedó `main` (primera en pushearse). Según la convención §5.3 los PR apuntan a `develop`; si el operador quiere `develop` como rama por defecto en la UI, es un ajuste de Settings (requiere permiso Administration que la PAT deliberadamente no tiene).
- **Responsable**: agente-constructor (orden del operador: «vamos a subirlo ahora mismo», sesión 2026-10-25).

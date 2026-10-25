---
id: DOC-001
title: "Verificación de montaje del harness"
status: done
priority: P1
class: agente
regimen: produccion
timebox: null
node: docs
parent: null
claimed_by: null
claimed_at: null
created_at: 2026-10-25T01:25:00+02:00
updated_at: 2026-10-25T01:35:00+02:00
closed_at: 2026-10-25T01:35:00+02:00
closed_reason: null
touches:
  - docs/
blocks: []
blocked_by: []
acceptance:
  - "Criterio 1: AGENTS.md es un stub ≤ 45 líneas, solo con esenciales, enlaza al mapa maestro"
  - "Criterio 2: mapa maestro con §1–§5 completos; regla de oro presente; 12 leyes + leyes de stack"
  - "Criterio 3: el árbol de §2 refleja los directorios reales; sin nodos hipotéticos; sin artefactos de herramienta"
  - "Criterio 4: tabla de ruteo §3 lista todo tronco raíz, rama raíz y fruto, con enlaces que resuelven"
  - "Criterio 5: cada ARCHITECTURE.md de nodo tiene ↑ Padre correcto y el padre lo lista (bidireccional)"
  - "Criterio 6: ningún contrato contiene backlog, tareas, claims ni pendientes (revisión de términos)"
  - "Criterio 7: plantillas sin usar conservan sus marcadores; contratos reales no conservan ninguno"
  - "Criterio 8: workboard completo (ARCHITECTURE/README/SCHEMA/INDEX/_template-item/verificador + items/ + items/_done/)"
  - "Criterio 9: INDEX.md refleja exactamente los ítems activos, verificado mecánicamente (verificador → código 0)"
  - "Criterio 10: convención de IDs, estados y clases documentada en el README del workboard"
  - "Criterio 11: cero secretos en toda la documentación (grep de patrones conocidos)"
  - "Criterio 12: todas las fechas ISO-8601 con offset; ninguna inventada"
  - "Criterio 13: exclusiones respetadas — ningún directorio de herramienta/dependencias contratado como nodo"
  - "Criterio 14: protocolos presentes en docs/conocimiento/protocolos/ (5 + README), indexados y sin defaults modificados"
  - "Criterio 15: cero referencias al material de montaje en el destino"
  - "Criterio 16: cero worktrees huérfanos (vacuo sin Git — puntero a OPS-001)"
subtasks:
  - "[x] Ejecutar los 16 criterios con evidencia por criterio"
  - "[x] Corregir en la misma entrega cualquier defecto detectado"
external:
  - null
decision_log:
  - "2026-10-25T01:25:00+02:00 · agente-constructor · Ítem de prueba de fuego creado al finalizar el onboarding; el operador ordenó el despliegue completo en la sesión del 2026-10-25."
---

## Contexto

Prueba de fuego del montaje en modo parasitar: un ciclo completo de trabajo (crear → reclamar → ejecutar → cerrar con evidencia) cuya aceptación es la checklist estructural del harness. Si los 16 criterios pasan y el verificador sale en verde, el harness queda operativo.

## Clasificación y protocolo

- **Clase de problema**: `agente` (ley 11 del mapa maestro).
- **Protocolo aplicado**: `docs/conocimiento/protocolos/agente.md` — verificación barata siempre; datos crudos en la evidencia (salidas de los greps y del verificador).
- **Umbrales especializados**: ninguno — defaults canónicos.

## Notas

- Los comandos de verificación se ejecutan desde la raíz del repositorio; la salida cruda se cita en la evidencia.
- Defecto ya corregido durante el montaje (trazabilidad): duplicado `closed_at: null` residual en 4 ítems archivados, detectado por el verificador y eliminado en la misma entrega.

## Evidencia (al cierre)

- **C1 ✓**: `AGENTS.md` = 35 líneas (≤ 45); solo esenciales; enlaza `docs/ARCHITECTURE.md`.
- **C2 ✓**: mapa maestro con 5 secciones (`grep -c '^## [0-9]\.'` → 5), regla de oro presente (1), leyes 1–16 (12 universales + 13–16 de stack).
- **C3 ✓**: primer nivel real (`docs/ patches/ src/ tools/`) = árbol de §2; sin nodos hipotéticos; artefactos raíz (package.json, Dockerfile, wrangler.toml, smithery.yaml, tsconfig, devenv, lockfile, .dockerignore) declarados como no-nodos.
- **C4 ✓**: 14 enlaces del mapa maestro resuelven (re-chequeo mecánico integral; los de los frutos fallaban antes de MCP-002 y quedaron resueltos al cerrarlo).
- **C5 ✓**: los 10 contratos de nodo tienen ↑ Padre (1 cada uno); cada padre lista a sus hijos en su tabla (mapa maestro §3: 10 filas de nodos + raíz).
- **C6 ✓**: sin backlog en contratos. Revisión del grep (`pendiente|todo|backlog`): todos los hits son la palabra española «todo» o las reglas citadas de la ley 9; único puntero a ítem: `patches/ARCHITECTURE.md` §2.5 → OPS-003 (puntero corto permitido).
- **C7 ✓**: las 4 plantillas de `docs/templates/architecture/` conservan sus marcadores; los contratos reales no contienen marcadores sin sustituir — los `<...>` restantes son literales de formato en código (`<tipo>/<ID>-<slug>`, `<nombre>.txt`, `service.<operación>`) y el ejemplo normativo de procedencia (`<fecha ISO>`, `<sembrar|parasitar>`) en conocimiento §4.
- **C8 ✓**: workboard completo — 12 archivos (ARCHITECTURE, README, SCHEMA, INDEX, _template-item, verify-workboard.mjs, hooks/pre-commit + ítems) con `items/` e `items/_done/` existentes.
- **C9 ✓**: `node verify-workboard.mjs` → «OK — sin violaciones», exit 0 (4 activos, 5 archivados, INDEX coherente).
- **C10 ✓**: README del workboard documenta IDs por dominio, estados, prioridades y clases de problema (4/4 secciones).
- **C11 ✓**: grep de patrones de secretos sobre toda la documentación → cero hits.
- **C12 ✓**: 55 marcas temporales ISO-8601 con offset +02:00, 0 sin offset (muestreo completo de la documentación del harness; el verificador valida los campos de ítems).
- **C13 ✓**: ningún directorio de herramienta/dependencias contratado; `patches/` está contratado como fruto **porque contiene código propio auditado** (fork con manifiesto e implementación), no por ser dependencia — justificación en su contrato y en D-005.
- **C14 ✓**: `docs/conocimiento/protocolos/` con los 5 protocolos + README, indexados; defaults intactos. Declaración de transparencia: en `agente.md` regla 7 se sustituyó una referencia de numeración externa («batería (F7 §7.3)») por su equivalente interno («batería de verificación del harness») — cambio editorial, sin tocar ningún default.
- **C15 ✓**: `grep -rniE 'orquestador-seed|SEED\.md|BLUEPRINT'` sobre docs/, AGENTS.md, src/, tools/, patches/ → cero referencias.
- **C16 ✓ (vacuo)**: no existe `worktrees/` ni VCS Git en el repositorio — no puede haber worktrees huérfanos; la verificación real se habilita con OPS-001.
- **Defectos corregidos en la misma entrega**: (1) duplicado `closed_at: null`/`closed_reason: null` residual en 4 ítems archivados (verificador exit 1 → corregido → exit 0); (2) el mismo defecto se repitió en el cierre de este ítem — segunda ocurrencia en la sesión, por lo que se aplicó la auto-mejora del harness: refuerzo preventivo añadido como regla en `docs/workboard/SCHEMA.md` en la misma entrega.
- **Verificador final**: exit 0. Harness operativo.
- **Responsable**: agente-constructor (orden del operador, sesión 2026-10-25).

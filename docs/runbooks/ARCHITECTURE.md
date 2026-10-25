---
title: ARCHITECTURE.md — Dominio Runbooks
Rol: Guardián de procedimientos operativos reutilizables y de bitácoras de ejecuciones reales
Objetivo: Definir la autoridad y el formato de los runbooks del proyecto y de sus bitácoras de ejecución.
Nivel: Rama raíz documental
Estado: contract
Padre: ../ARCHITECTURE.md
Lectura obligatoria: SÍ — antes de crear, ejecutar o modificar cualquier runbook de este dominio.
---

<br>**↑ Padre**: [docs/ARCHITECTURE.md](../ARCHITECTURE.md) — mapa maestro y leyes universales.<br/>

## 1. Alcance y autoridad

`docs/runbooks/` contiene el conocimiento operativo de ejecución:

- **Runbooks** (`_template-runbook.md`) — procedimientos reutilizables, revisados y vigentes, para operaciones que se repiten (despliegue, recuperación, mantenimiento).
- **Bitácoras** (`_template-bitacora.md`) — registros históricos de ejecuciones reales: qué se hizo, con qué evidencia, qué problemas aparecieron y cómo se resolvieron.

Reglas transversales:

1. Un runbook describe **cómo** se ejecuta una operación; no aloja compromisos de trabajo futuro (eso es del workboard) ni decisiones de arquitectura (eso es de los contratos).
2. Lo que un agente redacta es **borrador** (`document_status: draft`) hasta que el operador lo aprueba (`reviewed`).
3. Las bitácoras son históricas: una corrección añade un registro nuevo con trazabilidad; nunca reescribe el pasado.
4. Sin secretos: referencias por nombre de variable o `<REDACTED>`.

## 2. Mapa del nodo

| Ruta | Responsabilidad |
|---|---|
| `_template-runbook.md` | Plantilla canónica de runbook (front-matter, pasos, verificación, rollback, trazabilidad). |
| `_template-bitacora.md` | Plantilla canónica de bitácora de ejecución (fuente y límites de evidencia, pasos, estado al cierre). |
| `2026-10-25-auditoria-sca-mcp-cves.md` | Bitácora **aprobada** (`reviewed`): auditoría SCA del árbol de dependencias con el escáner mcp-cves (77 CVEs → 31 tras la remediación de OPS-007; 0 KEV/arma). |

Hay una bitácora registrada (en estado `draft` hasta su aprobación por el operador); no hay runbooks vigentes todavía. El mapa se actualiza en la misma entrega con cada alta.

## 3. Criterios de colocación

- **Aquí**: procedimiento reutilizable de una operación sobre este proyecto o sus entornos (build, despliegue, credenciales, cuotas de API).
- **En el contrato del nodo**: reglas de comportamiento del código; un runbook enlaza al contrato, no lo duplica.
- **En el workboard**: la autorización de cada ejecución concreta y su evidencia de cierre.
- **En conocimiento**: decisiones con razonamiento y SOP editoriales del operador.

## 4. Términos y condiciones

1. **Autoridad**: este contrato está subordinado a `docs/ARCHITECTURE.md`.
2. **Vigencia**: solo los runbooks con `document_status: reviewed` son procedimientos vigentes; un borrador no autoriza ejecución alguna.
3. **Trazabilidad**: todo runbook enlaza sus contratos relacionados y toda bitácora referencia el ítem del workboard que autorizó la ejecución.
4. **Conflicto**: si un runbook contradice un contrato, prevalece el contrato; el runbook se corrige con trazabilidad.

---
*Fin del contrato del dominio runbooks. Para reglas universales vuelve a [docs/ARCHITECTURE.md](../ARCHITECTURE.md).*

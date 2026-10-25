---
title: ARCHITECTURE.md — Dominio Conocimiento y Decisiones
Rol: Guardián del conocimiento del proyecto y de los protocolos de optimización
Objetivo: Definir la autoridad y el formato del conocimiento documental: decisiones arquitectónicas, SOP del operador y protocolos canónicos.
Nivel: Rama raíz documental
Estado: contract
Padre: ../ARCHITECTURE.md
Lectura obligatoria: SÍ — antes de crear o modificar cualquier documento de este dominio.
---

<br>**↑ Padre**: [docs/ARCHITECTURE.md](../ARCHITECTURE.md) — mapa maestro y leyes universales.<br/>

## 1. Alcance y autoridad

`docs/conocimiento/` contiene el conocimiento que **no es contrato** y **no es estado de trabajo**:

- **Decisiones arquitectónicas** — contexto, alternativas y razonamiento de las decisiones del proyecto.
- **SOP del operador** — procesos operativos cuya autoridad editorial conserva el operador. Si el directorio `sop/` no existe todavía, este contrato los cubre directamente; nace como nodo cuando acumule contenido real.
- **Protocolos de optimización** (`protocolos/`) — patrones canónicos de decisión en tiempo de ejecución, agnósticos al lenguaje, referenciados por la ley 11 del mapa maestro («clasifica antes de implementar»).

Tres reglas transversales:

1. Las decisiones documentan contexto, alternativas y razonamiento; **no sustituyen la arquitectura vigente**. Si una decisión difiere de un contrato, prevalece el contrato hasta que se modifique por el proceso correspondiente.
2. Distinguir en cada documento: **hechos / decisiones / recomendaciones / hipótesis**. No presentar una recomendación como hecho ni una hipótesis como verificación.
3. Proteger secretos y datos personales; no duplicar contratos, estados del workboard ni bitácoras — enlazar.

## 2. Mapa del nodo

| Ruta | Responsabilidad |
|---|---|
| `protocolos/` | Protocolos canónicos por clase de problema (datos, red, cómputo, agente) con sus defaults y reglas de especialización. |
| `Decisiones-arquitectonicas.md` | Registro razonado de decisiones del proyecto. |

## 3. SOP del operador

1. El operador conserva la autoridad editorial (aprobación, vigencia, retirada) aunque la redacción sea de un agente. Contribuciones de agente = borrador o diff, nunca vigentes.
2. Una sola copia canónica por SOP; otros documentos enlazan, no duplican.
3. Pasos destructivos o con privilegios elevados requieren advertencias explícitas y revisión humana.
4. Índice de SOP sincronizado en la misma entrega con cada alta, renombre o retirada (mientras no exista `sop/`, este contrato hace de índice).

## 4. Procedencia del harness

Este dominio es el **único lugar del destino donde la procedencia del harness deja constancia**: al aprobarse la verificación de montaje se registra aquí una entrada — «harness documental montado el `<fecha ISO>` en modo `<sembrar|parasitar>`» — como historia, sin ninguna dependencia funcional hacia el material de montaje (principio 15). El registro de decisiones [Decisiones-arquitectonicas.md](Decisiones-arquitectonicas.md) recoge además las decisiones tomadas durante el montaje.

## 5. Términos y condiciones

1. **Autoridad**: este contrato está subordinado a `docs/ARCHITECTURE.md`.
2. **Fronteras**: un runbook reutilizable vive en `docs/runbooks/`; una decisión sobre arquitectura vigente se plasma cambiando el contrato, no aquí; el estado del trabajo vive en el workboard.
3. **Conflicto**: si un documento de este dominio contradice un contrato, prevalece el contrato; el documento se corrige o cancela con trazabilidad.

---
*Fin del contrato del dominio conocimiento. Para reglas universales vuelve a [docs/ARCHITECTURE.md](../ARCHITECTURE.md).*

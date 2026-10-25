---
title: ARCHITECTURE.md — Fruto «<nombre-del-sistema>»
Rol: <responsable técnico o funcional del sistema>
Objetivo: Regular y documentar <comportamiento específico del fruto>.
Nivel: Fruto
Estado: implemented
Padre: <ruta-relativa-al-ARCHITECTURE.md-padre>
Lectura obligatoria: SÍ — antes de inspeccionar o modificar archivos de este fruto.
---

<br>**↑ Padre**: [<contrato de rama>](<enlace-relativo-al-padre>) — <reglas y enrutamiento heredados>.<br/>

<!-- Si este nodo tiene hijos con ARCHITECTURE.md, añade aquí una tabla ↓ Hijos con enlaces. -->

## 1. Alcance y autoridad

Este contrato se aplica exclusivamente a `<ruta-del-fruto>/`. Documenta <comportamiento específico aprobado>.

- **Entrada**: <datos, configuración y actores>.
- **Proceso**: <flujo específico del sistema>.
- **Salida**: <resultado, destino y efectos>.

Quedan fuera <responsabilidades de padre, hermanos u otros dominios>.

## 2. Cláusulas de comportamiento e implementación

1. Lee este contrato, el contrato del padre y la cadena superior antes de modificar el fruto.
2. Antes de trabajo operativo, consulta [docs/workboard](<enlace-relativo-a-workboard>) y cumple claim, autorización, bloqueos y criterios.
3. **Clasifica antes de implementar**: declara en el ítem la clase de problema dominante (`datos | red | cómputo | agente`) y aplica el protocolo canónico correspondiente de `docs/conocimiento/protocolos/`; registra la elección y los umbrales en el `decision_log`.
4. <Reglas específicas de entrada, validación y errores>.
5. <Separación local de responsabilidades y dependencias>.
6. <Reglas de configuración, datos sensibles y persistencia>.
7. Los cambios de comportamiento, archivos, símbolos públicos o dependencias requieren actualizar este contrato en la misma entrega.
8. No alteres ni relajes contratos superiores. Si el cambio requiere hacerlo, detén la ejecución y solicita resolución.

## 3. Mapa real de archivos y símbolos

<!-- Mantener solo si Estado: implemented. Contrastar cada archivo/símbolo con la implementación. -->

| Archivo | Responsabilidad comprobada | Símbolos / contenido |
|---|---|---|
| `<ruta/al/archivo>` | <responsabilidad actual> | `<función/clase/import>` |

## 4. Grafo funcional aprobado

<!-- Mantener solo si Estado: implemented. Mostrar flujo real; no incluir trabajo futuro. -->

```text
<punto de entrada>
    ↓
<módulo / función real>
    ↓
<dependencia / módulo real>
    ↓
<salida comprobada>
```

Dependencias aprobadas:

- <Límite de dependencias/imports comprobado>.
- <Errores y efectos externos comprobados>.

## 5. Configuración, datos y resultados

| Parámetro / dato | Fuente | Efecto |
|---|---|---|
| `<nombre>` | <CLI / entorno / archivo / default> | <comportamiento efectivo> |

## 6. Verificación reproducible

### 6.1 Verificación por archivo (ley 10 del mapa maestro)

Comandos para verificar un solo archivo: rápidos, baratos, ejecutables tras cada cambio. El build completo solo a petición explícita.

| Verificación | Comando | Cobertura |
|---|---|---|
| Tipado estático | `<tsc/mypy/...> --noEmit <archivo>` | <qué verifica> |
| Formato | `<formatter> --check <archivo>` | <qué verifica> |
| Lint | `<linter> --fix <archivo>` | <qué verifica> |
| Test unitario | `<test runner> run <archivo.test>` | <qué verifica> |
| Build completo | `<comando>` | Solo a petición explícita |

### 6.2 Prueba o validación funcional

- **Realismo**: la validación incluye al menos un camino no feliz (entrada inválida, fuente caída, resultado vacío) — un flujo solo probado en su camino feliz no está validado.
- **Prueba o comando**: `<comando real aplicable>`
- **Superficie cubierta**: <qué verifica>.
- **Límites**: <qué no se ha ejecutado/verificado>.

No presentes pruebas no ejecutadas como aprobadas; conserva la evidencia de cada tarea en el workboard.

### 6.3 Checklist de PR (convención ítem → rama → PR del workboard)

- Rama `<tipo>/<ID>-<slug>` creada al reclamar; un PR por ítem.
- Título `(<ID>) <título del ítem>`.
- Criterios de aceptación verificados y evidencia pegada en el cuerpo del PR y del ítem.
- Diff pequeño y enfocado; resumen de qué cambió y por qué.
- Validaciones de §6.1 y `node verify-workboard.mjs` en verde.
- Sin logs de depuración ni comentarios sobrantes.

### 6.4 Test first mode (cláusula opcional del nodo)

- En features no triviales: escribe o actualiza los tests **primero**, luego código hasta verde.
- En regresiones: un test que **reproduce el bug antes del fix** — y queda como regresión para siempre.
- El contrato del nodo (o el ítem) declara cuándo aplica; el default es: tareas de lógica no trivial. Los tests convierten el bucle del agente en un bucle de verificación — es la diferencia entre adivinar y medir.

## 7. Parámetros de protocolo especializados

<!-- Solo si el nodo fijó umbrales propios con caso real medido (ley 11 y ley 12 del mapa maestro).
     Sin evidencia, el nodo usa los defaults canónicos de docs/conocimiento/protocolos/ y esta tabla
     se elimina. -->

| Parámetro | Valor | Protocolo de origen | Evidencia (ítem) |
|---|---|---|---|
| `<p. ej. tamaño de chunk>` | `<valor>` | `<datos.md>` | `<ID-00X>` |

## 8. Convenciones y antipatrones locales

- <Reglas propias del sistema>.
- <Acciones prohibidas o errores que deben aflorar explícitamente>.
- <Reglas locales de privacidad, seguridad o integridad>.
- <!-- Auto-mejora: la segunda vez que un agente repite un error en este fruto, añade aquí el
      antipatrón correspondiente en la misma entrega de la corrección. -->

## 9. Términos y condiciones

1. **Autoridad**: este contrato está subordinado a `<contrato padre>` y a la cadena superior.
2. **Estado `implemented`**: mapa y grafo describen comportamiento existente, aprobado y contrastado, no trabajo futuro.
3. **Propiedad**: el conocimiento específico de este sistema permanece en este fruto; las reglas compartidas pertenecen al nivel compartido autorizado.
4. **Workboard**: es la fuente exclusiva para ciclo de trabajo, claims, autorizaciones y evidencia.
5. **Finalización y fallo**: comunica límites, errores y validaciones fallidas; no declares éxito completo si queda una condición de aceptación sin verificar.

---
*Fin del contrato de `<ruta-del-fruto>/`. Sube a [<contrato padre>](<enlace-relativo>) para las reglas de la rama.*

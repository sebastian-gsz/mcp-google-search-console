# Protocolo `agente` — reglas de pensamiento y consumo

Clase: **`agente`**. Aplica cuando el recurso a optimizar es el propio proceso del agente: lecturas, contexto, iteraciones, créditos y coordinación. Este protocolo es el que reduce el consumo estructuralmente: el contrato sustituye lecturas de código y la clasificación evita re-descubrir el problema en cada sesión.

## Reglas de pensamiento (en orden de aplicación)

1. **Contrato antes que código — presupuesto de lecturas**: una tarea típica no abre más de **3 archivos de código** (default especializable por nodo). El contrato del nodo ya describe mapa, símbolos y flujo. Si necesitas más, **el contrato está obsoleto**: es un bug documental — detente, registra el hallazgo en el ítem y abre ítem de actualización contractual; no sigas leyendo a ciegas.
2. **Descenso en anchura por contratos**: del mapa maestro al nodo, una sola vez por tarea. Nunca re-subas conocimiento local; nunca re-leas el mapa maestro a mitad de la tarea — conserva en las notas del ítem lo que necesitas (nodo, reglas aplicables, comandos).
3. **Cacheo de hallazgos**: todo hallazgo de auditoría (rutas, símbolos, decisiones parciales) se anota en las **Notas del ítem** en el momento. El ítem es la memoria de la tarea: la próxima iteración lee el ítem, no el repo de nuevo.
4. **Clasificación explícita**: declara la clase del problema y su protocolo antes de diseñar (ley 11). Reclasificar a mitad de tarea es una decisión de `decision_log`, no un cambio silencioso.
5. **Verificación barata siempre**: tras cada cambio, ejecuta los comandos por archivo del contrato del nodo (ley 10). Verificar cuesta segundos; no verificar cuesta una iteración completa.
6. **Stop condition dura**: tras **2 iteraciones fallidas** sobre lo mismo, escalar — pregunta al owner o marca `blocked` con la referencia del contrato conflictivo. Iterar en bucle sobre un fallo no entendido es el mayor consumidor de créditos.
7. **Auto-mejora del harness**: la **segunda vez** que un agente repite el mismo error, añade la regla o antipatrón al contrato del nodo en la misma entrega de la corrección (§5 del mapa maestro), aplicando la **cuádruple de refuerzo**: regla, check del verificador, hook determinista (pre-commit) o eval de la batería de verificación del harness. El harness que no aprende obliga a pagar el mismo error en cada sesión.
8. **Aislamiento físico en paralelo**: agente paralelo ⇒ worktree propio con la convención del contrato del workboard (§5.1): `worktrees/<ID>-<slug>/`, creado al reclamar con su rama y eliminado con `remove`/`prune` al cerrar — jamás rutas o nombres improvisados. Un claim activo por agente; `touches` no solapados. La coordinación vive en el workboard, nunca en conversaciones paralelas.
9. **Datos crudos, no interpretaciones**: en depuración, el ciclo es — el agente instrumenta (logs en los puntos clave) → se ejecuta → **la salida cruda vuelve al agente íntegra** (log, salida de CI, error de test). Nunca resumas ni interpretes el fallo por tu cuenta: la interpretación añade abstracción que pierce el detalle que delata la causa raíz, y cada ciclo verbal de adivinanza cuesta contexto, re-lecturas y ediciones — **un pegado crudo reemplaza N iteraciones por una**. En sentido inverso: si te falta información, pide la salida cruda; no la inventes.

## Defaults canónicos

| Parámetro | Default | Cuándo especializar |
|---|---|---|
| Lecturas de código por tarea típica | ≤ 3 archivos | Nodos con mapas de fruto aún incompletos (parasitaje reciente) |
| Iteraciones antes de escalar | 2 | — |
| Relectura del mapa maestro | 1 por tarea (al inicio) | — |
| Agents paralelos sobre un ítem | 1 coordinador + ≤ 3 colaboradores | El operador autoriza más (contrato §5) |
| Lecturas en exploración (`EXP-`) | sin presupuesto fijo — el límite es el timebox (§4.6) | — |
| Datos crudos en depuración | salida íntegra al agente — se recorta ruido, nunca las líneas del error | — |

## Antipatrones

- Leer código «para entender» sin contrato: cada lectura a ciegas es el contexto que el contrato ya contenía, pagado otra vez.
- Re-auditar en la misma sesión lo que ya está en las notas del ítem.
- Iterar sobre un fallo sin cambiar de hipótesis (loop de créditos).
- Corregir el mismo error dos veces sin dejar la regla que lo previene.
- Coordinar agentes por conversación: sin ítem, claim y evidencia, el trabajo no existe (principio 7).
- Declarar «done» sin ejecutar el verificador del workboard y las validaciones del nodo.
- Describir un fallo con palabras y dejar que el agente adivine: cada ciclo verbal de adivinanza cuesta más que pegar el log crudo una vez.

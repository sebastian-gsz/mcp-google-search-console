# Protocolos de optimización — patrones canónicos de decisión

Índice por clase de problema, referenciado por la **ley 11 del mapa maestro** («clasifica antes de implementar»). Estos protocolos son conocimiento general, no diseño del proyecto: definen **qué patrón aplicar y con qué default**, no la implementación concreta. Son agnósticos al lenguaje y a la infraestructura.

## Clasifica antes de implementar

Toda tarea operativa (ítem del workboard con clase declarada) aplica este orden:

1. **Identifica el cuello de botella dominante**: ¿volumen de datos, latencia/red, CPU/memoria/GPU, o el propio proceso del agente?
2. Si hay empate, domina la clase del **recurso más escaso o más caro** (lo que falla primero o cuesta más).
3. Declara la clase en el ítem (`class:`), aplica el protocolo correspondiente y **registra en `decision_log`**: patrón elegido, defaults usados y justificación.
4. Si ninguna clase encaja, la tarea es de proceso puro: declara `agente` y avanza; si el problema es recurrente y no cubierto, crea un protocolo nuevo (regla de anti-especulación, abajo).
5. **Doble consulta por secretos**: si la tarea crea, transporta o consume un secreto (clave de API, token, firma, cookie), consulta además [secretos.md](secretos.md) — el **aislamiento de credenciales por servicio** aplica siempre, sea cual sea la clase dominante.

## Formato canónico de protocolo

Cada archivo de protocolo contiene, para su clase:

- **Árbol de decisión** — condiciones observables → patrón a aplicar.
- **Defaults canónicos** — tabla `parámetro | default | cuándo especializar`.
- **Antipatrones** — errores típicos que el patrón evita.

## Especialización por nodo

Un nodo especializa un umbral **solo con caso real medido** (ley 12 del mapa maestro): se declara en su contrato (§Parámetros de protocolo especializados) con valor, protocolo de origen e ítem que aporta la evidencia. Sin evidencia, el nodo usa los defaults canónicos y no declara parámetros. Los defaults de estos archivos **no se modifican** para adaptarse a un caso: se especializan en el nodo.

## Índice

| Archivo | Clase | Patrones canónicos |
|---|---|---|
| [datos.md](datos.md) | `datos` | streaming vs batch, chunking, windowing, deduplicación, ledger reanudable |
| [red.md](red.md) | `red` | timeout explícito, reintentos backoff+jitter, rate limit como presupuesto, idempotencia, caché, sesión con guard |
| [computo.md](computo.md) | `cómputo` | medir antes de optimizar, concurrencia vs paralelismo, batching, memoria, GPU y precisión |
| [agente.md](agente.md) | `agente` | presupuesto de lecturas, descenso por contratos, cacheo de hallazgos, stop conditions, auto-mejora, worktrees |
| [secretos.md](secretos.md) | transversal — presencia de secreto | aislamiento de credenciales por servicio, un portador por servicio, test de los dos greps |

## Anti-especulación

- Un archivo de protocolo **nuevo** solo se crea cuando aparece una clase de problema real no cubierta (p. ej. hardware específico). Se propone como ítem del workboard; lo aprueba el operador.
- No se añaden patrones por anticipado «por si acaso»: el índice crece con los problemas reales del proyecto.
- Los protocolos no autorizan cambios de contrato: son material de decisión; la autoridad sigue en la cascada de contratos.

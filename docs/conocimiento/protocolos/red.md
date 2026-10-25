# Protocolo `red` — latencia, reintentos y límites de fuente

Clase: **`red`**. Aplica cuando el cuello de botella dominante es la comunicación con servicios remotos: latencia, fallos transitorios, límites de tasa o autenticación.

## Árbol de decisión

```text
Toda operación remota lleva, en este orden obligatorio:
1. Timeout explícito por operación (nunca esperar indefinido).
2. ¿El fallo es transitorio (timeout, 5xx, conexión)?
   ├── SÍ → reintentos con backoff exponencial + jitter, SOLO si la operación es idempotente
   │        o se envuelve en una clave de idempotencia estable.
   └── NO (4xx permanente) → no reintentar: registrar, reportar y parar la unidad afectada.
3. ¿La fuente impone rate limit conocido?
   ├── SÍ → tratarlo como PRESUPUESTO por diseño (pausas/ventanas planificadas), no como error a manejar.
   └── NO/desconocido → sondar con conservadurismo y ajustar en el ledger; jamás saturar la fuente.
4. ¿La sesión requiere autenticación?
   └── Sesión reutilizable por ejecución + guard de re-login ante expiración; reintentar la
       operación una vez tras re-autenticar, nunca en bucle.
```

Reglas transversales de la clase:

- **Idempotencia primero**: antes de añadir reintentos, haz la operación idempotente (clave de operación estable, upsert, marcadores). Reintentar una operación no idempotente multiplica el daño.
- **Jitter, no cadencia fija**: entre clientes o agentes paralelos, el backoff puro sincroniza las tormentas de reintentos; el jitter las rompe.
- **Caché con invalidación explícita**: TTL corto por default y invalidación por evento (webhook, versión) antes que por heurística; nunca cachear respuestas de autenticación.
- **Aislamiento de credenciales**: la sesión o clave de un servicio jamás acompaña llamadas a otro destino — aplica `secretos.md` (aislamiento de credenciales por servicio), también en redirecciones y webhooks.
- **Amabilidad con la fuente**: no paralelizar peticiones contra una misma fuente sin que el contrato del nodo lo autorice explícitamente; la velocidad del proveedor es un límite del dominio.

## Defaults canónicos

| Parámetro | Default | Cuándo especializar |
|---|---|---|
| Timeout por operación | 30 s | El endpoint medido exige otro valor (ítem con medición) |
| Reintentos (máximo) | 5 | El SLA o el coste de la operación lo justifica |
| Base del backoff | 500 ms | — |
| Factor del backoff | 2 (exponencial) | — |
| Jitter | ±20% del delay calculado | — |
| TTL de caché | 300 s | El evento de invalidación disponible permite TTL mayor |

## Antipatrones

- Reintentar en bucle sin tope ni backoff (martillo).
- Reintentar operaciones no idempotentes (doble compra, doble carga).
- Tratar el 4xx como transitorio y martillar una validación que siempre fallará.
- Rate limit manejado como excepción en vez de presupuesto planificado.
- Timeout indefinido «porque normalmente es rápido».
- Credenciales o cookies en logs, fixtures o ítems (principio 10).

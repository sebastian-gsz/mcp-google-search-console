# Protocolo `secretos` — aislamiento de credenciales por servicio

Clase: **transversal** — se activa por la *presencia de un secreto*, no por el cuello de botella. Se consulta **siempre además de la clase dominante** cuando la tarea crea, transporta o consume una credencial (clave de API, token, firma, cookie de sesión, credencial de servicio).

## La regla en una frase

> **Un secreto pertenece a exactamente un servicio: viaja únicamente en las peticiones dirigidas a ese servicio, y en ninguna más.**

Es el principio de mínimo privilegio aplicado a los secretos que salen de tu máquina. Piensa en cada clave como la llave de una casa concreta: el anti-patrón es llevar el llavero completo a todas partes; lo correcto es coger solo la llave de la casa que vas a visitar y dejar el resto en casa.

## Árbol de decisión

```text
¿La tarea maneja un secreto?
├── NO → no aplica; continúa con el protocolo de la clase dominante.
└── SÍ → ¿el código habla con más de un destino (dominio/servicio)?
    ├── NO → pasa la credencial solo en las llamadas a ese destino;
    │        nunca la registres «por si acaso» como default global del cliente.
    └── SÍ → un portador de cabeceras (o sesión) POR SERVICIO, construido
             en el módulo de ese servicio. El portador del secreto de A
             jamás acompaña una llamada hacia B.
```

Ejemplo canónico (agnóstico al lenguaje):

```text
ANTI-PATRÓN — el llavero completo a todas partes
    portador = crear_cliente()
    portador.cabecera_por_defecto["apiKey"] = SECRETO_A
    portador.get(SERVICIO_A)            # ✔ correcto
    portador.get("https://servicio-b.example")   # ✘ el secreto de A acaba en B

CORRECTO — un portador por servicio
    portador_a = crear_cliente(cabeceras={"apiKey": SECRETO_A})   # solo A
    portador_b = crear_cliente()                                  # sin secretos
```

## Los tres vectores de fuga que elimina

1. **Terceros comprometidos o curiosos**: cualquier destino que reciba el portador ve la clave en sus logs de acceso. No hace falta malicia — basta un operador del otro lado o un log que se filtre.
2. **Redirecciones**: los clientes HTTP suelen eliminar la cabecera estándar `Authorization` al seguir una redirección entre dominios, pero **NO las cabeceras personalizadas** (`apiKey`, `X-API-Key`, firmas…) — se reenvían al destino. Una redirección cruzada y la clave viaja adonde tú no decides.
3. **Intermediarios**: defaults globales de bibliotecas, proxies corporativos que registran cabeceras, middleware del framework.

## Tabla de decisión por situación

| Situación | Qué hacer |
|---|---|
| Varias APIs, cada una con su clave | Un portador de cabeceras **por servicio**, construido en el módulo de ese servicio |
| Una sola API con clave | Cabecera solo en esas llamadas; nada global «por si acaso» |
| Cliente/sesión compartida por comodidad | Una sesión por servicio; nunca inyectar secretos en las cabeceras por defecto |
| Tokens internos entre servicios | El token del servicio A solo va al servicio A |
| Webhooks salientes | Firmar con el secreto **de ese destinatario**, nunca con el secreto maestro |

## Compañeros inseparables

- **Fuera del código**: `.env` / variables de entorno, jamás hardcodeada (ley 5 del mapa maestro).
- **Jamás en logs**: un secreto que pasa por `print`/logger acaba en un log que se copia, se archiva y se filtra (principio 10).
- **Siempre HTTPS al transportarla**: por muy bien aislada que esté, en claro viaja por la red.

## Auditoría — el test de los dos greps

Reproducible en el cierre de cualquier ítem que toque secretos; la evidencia del ítem incluye su resultado:

1. Localiza todas las **construcciones** del portador del secreto (dónde se declara/inicializa el objeto, sesión o conjunto de cabeceras).
2. Localiza todos los **usos** del portador (dónde se pasa a una llamada).
3. **Cada uso debe apuntar al dominio de su servicio.** Un uso cuyo destino no es «el suyo» = fuga.

```bash
grep -rn <nombre-del-portador> <fuente>/     # dónde se construye y se pasa
grep -rn <llamadas-salientes> <fuente>/      # a qué URL va cada llamada
```

Diez segundos que responden la pregunta correcta antes de añadir un servicio nuevo: *«¿esta clave nueva viaja solo con las llamadas a su dominio?»*

## Defaults canónicos

| Parámetro | Default | Cuándo especializar |
|---|---|---|
| Almacén del secreto | Variables de entorno (`.env` fuera de git) | El operador aprueba un gestor de secretos dedicado |
| Transporte | HTTPS siempre | Nunca — sin excepción documental |
| Alcance del portador | Un portador por servicio | Un único destino con clave → portador local a esas llamadas |
| Registro en logs | Prohibido siempre | Nunca |

## Antipatrones

- Cliente/sesión compartida con la clave pegada como cabecera por defecto (el llavero completo).
- Cabeceras personalizadas con secretos + seguimiento automático de redirecciones sin revisión de dominios.
- Secreto en logs, fixtures, mensajes de error o evidencia del workboard (principio 10).
- Hardcodear la clave «temporalmente».
- Firmar webhooks a terceros con el secreto maestro en lugar del secreto por destinatario.

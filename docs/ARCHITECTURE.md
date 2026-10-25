---
title: ARCHITECTURE.md — Raíz del proyecto (Mapa central)
Rol: Coordinador de contexto / Software Architect Senior
Objetivo: Ser el PUNTO DE ENTRADA único e ineludible para cualquier agente (LLM o programático). Define las reglas de comportamiento globales, el mapa de navegación del repositorio y el protocolo de lectura.
Lectura obligatoria: SÍ — es el primer archivo que debe leerse antes de tocar cualquier código.
---

# 🗺️ Mapa central de arquitectura — mcp-server-gsc

> **Regla de oro para agentes**: NO leas scripts "a ciegas". Este repositorio se navega como un árbol:
> cada directorio relevante tiene su propio `ARCHITECTURE.md` que actúa de **contrato local** (reglas de
> comportamiento + estado actual + mapa de archivos). Lee desde la raíz hacia abajo, detente en el nodo
> que cubre tu tarea y **solo entonces** abre código. Si la información del nodo no es suficiente, realiza
> una auditoría propia (listar directorio, abrir los archivos mínimos), pero siempre partiendo del
> contrato, nunca de cero.

## 1. Protocolo de lectura

1. **Empieza aquí.** Identifica el nodo que cubre tu tarea en la tabla de ruteo de nodos (§3).
   **Desciende por hipervínculos** hasta su `ARCHITECTURE.md`.
2. **Respeta los contratos de los nodos**: normas, estructura, estado actual y antipatrones locales.
3. **Audita solo lo necesario**: si el contrato del nodo no basta, lista el directorio y abre los archivos
   mínimos; documenta las carencias, propone la solución y pide permiso al owner antes de escribir en
   cualquier `ARCHITECTURE.md` (ver §5, mantenimiento).
4. **Nunca subas conocimiento local al tronco**: las particularidades de una rama viven en su nodo; las
   normas universales, arriba. Cascada estricta.

## 2. Topología general del repositorio

```text
gsc-server/
├── AGENTS.md                 # Stub de convención: redirige a este mapa central (no duplica contenido).
├── docs/                     # ⬅ Tronco raíz documental → [docs/ARCHITECTURE.md] (este contrato)
│   ├── workboard/            #     Rama raíz: gestión de trabajo y ciclo de tareas → [workboard/ARCHITECTURE.md]
│   ├── runbooks/             #     Rama raíz: procedimientos y bitácoras → [runbooks/ARCHITECTURE.md]
│   ├── conocimiento/         #     Rama raíz: decisiones, SOP y protocolos → [conocimiento/ARCHITECTURE.md]
│   ├── templates/architecture/ # Plantillas reutilizables; artefactos, no nodo contractual.
│   ├── research/             #     Semilla pasiva: corpus de investigación (raw/ + ideas.md), sin contrato propio.
│   └── gsc-notebook.md       #     Documento técnico: cobertura de la API, cuotas e ideas de herramientas.
├── src/                      # ⬅ Tronco raíz: código de producto (servidor MCP) → [src/ARCHITECTURE.md]
│   ├── entrypoints/          #     Rama: adaptadores finos de transporte → [src/entrypoints/ARCHITECTURE.md]
│   └── lib/                  #     Rama: núcleo neutral del servidor → [src/lib/ARCHITECTURE.md]
│       ├── gsc/              #         Fruto: capa de acceso a la API de Google Search Console → [src/lib/gsc/ARCHITECTURE.md]
│       └── tools/            #         Fruto: registro y definiciones de las herramientas MCP → [src/lib/tools/ARCHITECTURE.md]
├── tools/                    # ⬅ Tronco raíz: utilidades de investigación (fetch-research.mjs) → [tools/ARCHITECTURE.md]
└── patches/                  #     Fruto raíz: fork local de dependencia (buffer-equal-constant-time) → [patches/ARCHITECTURE.md]
```

Artefactos de primer nivel **sin lógica propia contractual** (no son nodos): `package.json`,
`pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `tsconfig.test.json`, `Dockerfile`,
`wrangler.toml`, `smithery.yaml`, `devenv.*`, `.dockerignore`, `.gitignore`, `.gitattributes`. Sus
reglas de build y despliegue viven en el contrato del tronco `src/` (§5, entorno reproducible).
Estado factual: el repositorio tiene **VCS Git inicializado** (2026-10-25), publicado en
`github.com/sebastian-gsz/mcp-google-search-console`, con **rama única `main`** (decisión D-008:
`develop` se retiró tras la primera release, fusionada al 100 %) con convención ítem → rama → PR
contra `main` (§5.3 del workboard) y **capa determinista activa** (`core.hooksPath =
docs/workboard/hooks`, probada con commit válido y con bloqueo de `.env`).

## 3. Tabla de ruteo de nodos (¿A dónde voy?)

Estados de nodo:

- **contract**: contrato vigente del nodo. Define reglas, compromisos, términos y condiciones,
  estructura, límites y responsabilidades; no documenta un estado operativo detallado.
- **implemented**: contrato vigente más documentación del estado operativo aprobado y funcional.
  Incluye el mapa de archivos y el grafo de dependencias entre archivos, imports, clases,
  funciones y flujos.

| Nodo | Nivel | Estado | Descripción | Enlace |
|---|---|---|---|---|
| Raíz (este archivo) | Tronco maestro | — | Mapa central y leyes universales, protocolo de lectura, topología y mantenimiento. | — |
| `docs/` | Tronco raíz documental | contract | Contrato de documentación y navegación de los dominios documentales (este archivo). | [↘](ARCHITECTURE.md) |
| `docs/workboard/` | Rama raíz | contract | Dominio exclusivo para gestionar tareas, claims, bloqueos, trazabilidad y cierres. | [↘](workboard/ARCHITECTURE.md) |
| `docs/runbooks/` | Rama raíz | contract | Contrato de runbooks reutilizables y bitácoras de ejecuciones reales. | [↘](runbooks/ARCHITECTURE.md) |
| `docs/conocimiento/` | Rama raíz | contract | Decisiones arquitectónicas, SOP del operador y protocolos de optimización. | [↘](conocimiento/ARCHITECTURE.md) |
| `src/` | Tronco raíz | contract | Código de producto: servidor MCP de Google Search Console (TypeScript). Reglas transversales, entorno y despliegue. | [↘](../src/ARCHITECTURE.md) |
| `src/entrypoints/` | Rama | contract | Adaptadores finos de transporte: stdio, HTTP/Node y Cloudflare Worker. | [↘](../src/entrypoints/ARCHITECTURE.md) |
| `src/lib/` | Rama | contract | Núcleo neutral: app HTTP, servidor MCP, configuración y esquemas Zod. | [↘](../src/lib/ARCHITECTURE.md) |
| `src/lib/gsc/` | Fruto | implemented | Capa de acceso a la API de Google Search Console y analítica pura sobre filas. | [↘](../src/lib/gsc/ARCHITECTURE.md) |
| `src/lib/tools/` | Fruto | implemented | Registro y definiciones de las 15 herramientas MCP expuestas por el servidor. | [↘](../src/lib/tools/ARCHITECTURE.md) |
| `tools/` | Tronco raíz | implemented | Pipeline de investigación: descarga de fuentes SEO/oficiales a `docs/research/raw/`. | [↘](../tools/ARCHITECTURE.md) |
| `patches/` | Fruto | implemented | Fork local de la dependencia `buffer-equal-constant-time` (compatibilidad Node moderno). | [↘](../patches/ARCHITECTURE.md) |

**Enlaces de contexto general**:

- [README.md](../README.md): descripción del producto, características, instalación, uso y seguridad.
- [CHANGELOG.md](../CHANGELOG.md): historial de versiones (Keep a Changelog + SemVer).
- [package.json](../package.json): metadatos del paquete, scripts, dependencias y mecanismo de
  parcheo de dependencias (`overrides`).
- [AGENTS.md](../AGENTS.md) → Stub de convención que **redirige** a este mapa central (no duplica
  contenido). Las reglas viven SOLO en los archivos `ARCHITECTURE.md`.

## 4. Leyes universales del proyecto (aplican a TODOS los nodos)

1. **Cascada de contexto**: un `ARCHITECTURE.md` padre dicta normas globales; los hijos solo añaden
   particularidades, nunca las contradicen.
2. **DRY demostrable**: lógica repetida se extrae al nivel compartido inmediatamente superior, solo
   con dos o más usos reales; nada de capas compartidas por anticipación.
3. **Modularidad estricta**: 1 archivo = 1 responsabilidad; ideal 20–80 líneas; más de 500 líneas
   obliga a refactor. El tamaño es señal de diseño, no sustituto de la separación conceptual.
4. **Testeabilidad**: parsers y validaciones sin red ni disco; tests unitarios con mocks; nada depende
   de producción.
5. **Configuración centralizada**: rutas/URLs/límites vía entorno + helpers del nodo; prohibido
   hardcodear fuera de los módulos de constantes.
6. **Enrutamiento obligatorio y notificación ascendente minimal**: todo nodo nuevo debe aparecer en la
   topología (§2) y en la tabla de ruteo (§3) de su tronco maestro, con enlaces bidireccionales
   padre↔hijo. La actualización ascendente se limita a la fila de ruteo: nombre, descripción de una
   línea y enlace. El detalle jamás asciende y jamás se propaga a nodos hermanos; quien necesite más,
   desciende por los hipervínculos. Una semilla solo se añade a esta tabla si pasa a ser nodo de
   primer nivel del proyecto.
7. **Precedencia y conflicto**: un descendiente puede especializar las reglas de sus padres, pero no
   contradecirlas ni relajarlas. Ante contradicción prevalece el contrato superior; el agente detiene
   la acción, documenta el conflicto y solicita resolución antes de modificar código o arquitectura.
8. **Límite de la especialización**: especializar = concretar una regla general para el dominio local,
   añadir una restricción necesaria o definir una responsabilidad propia. No permite cambiar el
   significado de `contract` o `implemented`, alterar la fuente de verdad del workboard ni sustituir
   una obligación superior.
9. **Estado de trabajo aparte**: los contratos nunca alojan backlog, tareas, claims ni pendientes;
   eso vive exclusivamente en `docs/workboard/`.
10. **Verificación por archivo**: todo nodo declara los comandos para verificar un solo archivo —
    tipo estático, formato, lint y test unitario por ruta (ver plantilla de fruto, §6). El build
    completo se ejecuta solo a petición explícita. Verificación barata = siempre se verifica: tras
    cada cambio se ejecutan los comandos de los archivos tocados.
11. **Clasifica antes de implementar**: todo ítem de trabajo declara su clase de problema dominante
    (`datos | red | cómputo | agente`) y consulta el protocolo canónico correspondiente en
    `docs/conocimiento/protocolos/` antes de diseñar. La elección del patrón y los umbrales
    aplicados se registran en el `decision_log` del ítem con su justificación.
12. **Anti-abstracción especulativa**: no se crean capas compartidas, protocolos especializados ni
    parámetros de nodo sin responsabilidad o caso real demostrable.
13. **Entradas finas, núcleo neutral** *(stack)*: los entrypoints (`src/entrypoints/`) solo resuelven
    credenciales/configuración y conectan el transporte; toda la lógica vive en `src/lib/`, que no lee
    `process.env` ni bindings de plataforma. Un canal nuevo = un entrypoint nuevo, cero cambios en `lib/`.
14. **Una herramienta MCP = un módulo + esquema + registro** *(stack)*: cada herramienta vive en
    `src/lib/tools/<nombre>.ts` implementando `ToolDefinition`, declara su esquema Zod de entrada en
    `src/lib/schemas.ts` y se da de alta en el array `TOOLS` de `src/lib/tools/index.ts`. Sin alta en
    el registro, la herramienta no existe para el servidor.
15. **Encapsulación de la API de Google** *(stack)*: solo `src/lib/gsc/client.ts` importa
    `googleapis`/`google-auth-library`; la analítica (`src/lib/gsc/analytics.ts` y funciones puras) no
    toca red ni disco y trabaja sobre filas `{ keys, clicks, impressions, ctr, position }`.
16. **Escrituras destructivas bajo control explícito** *(stack)*: el servidor usa el scope completo
    `webmasters` (lectura + escritura). `delete_site`, `add_site`, `submit_sitemap`, `delete_sitemap`
    operan sobre la propiedad real de Search Console: sus esquemas exigen `siteUrl`/`feedpath`
    explícitos y sus descripciones declaran el efecto; prohibido añadir valores por defecto que
    amplíen el alcance de una escritura.

## 5. Mantenimiento de la red (obligatorio al trabajar)

- **Si creas un directorio con lógica propia**, crea su `ARCHITECTURE.md` usando la guía y plantillas
  de [templates/architecture](templates/architecture/README.md): front-matter
  (`title/Rol/Objetivo/Nivel/Estado/Padre`), enlaces *↑ Padre* y *↓ Hijos* cuando correspondan,
  alcance, contrato local y mapa. Un nodo `implemented` añade únicamente el estado operativo aprobado
  y su grafo de dependencias; los estados de tareas pertenecen exclusivamente al workboard.
- **Si modificas comportamiento** descrito en un nodo (nuevo script, nueva variable de entorno, cambio
  de flujo), **actualiza únicamente el `ARCHITECTURE.md` de ese nodo en la misma entrega**. Si el
  cambio altera la topología, actualiza además el `ARCHITECTURE.md` del padre —limitado a su fila de
  ruteo— y, cuando proceda, este mapa maestro.
- **Auto-mejora del harness**: la segunda vez que un agente repite el mismo error, añade la regla o
  antipatrón correspondiente al contrato del nodo (o a la tabla de anti-patrones local) **en la misma
  entrega** de la corrección. El harness aprende de sus propios fallos o deja de funcionar.
  **Cuádruple de refuerzo**: al corregir manualmente cualquier violación del harness, decide en la
  misma entrega qué refuerzo preventivo deja — una *regla* (contrato/antipatrón), un *check*
  (verificador del workboard), un *hook* (determinista, en el pre-commit: lo que debe pasar siempre se
  mecaniza, no solo se recomienda) o una *eval* (escenario de la batería de verificación). Si el fallo
  puede repetirse, no se corrige solo una vez.

---
*Fin del mapa central. Descarga el nodo que corresponda a tu tarea antes de escribir una sola línea de código.*

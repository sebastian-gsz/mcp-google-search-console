# Protocolo `datos` — volumen, lotes y persistencia

Clase: **`datos`**. Aplica cuando el cuello de botella dominante es el volumen de datos a procesar, transformar o persistir.

## Árbol de decisión

```text
¿El conjunto completo cabe en memoria con holgura (< MEM_SEGURA)?
├── SÍ → batch en memoria: procesa y escribe en una sola pasada.
└── NO → ¿el origen permite lectura incremental (cursor, paginación, stream)?
    ├── SÍ → streaming por lotes: lee → procesa → escribe → libera; nunca acumules el conjunto completo.
    └── NO → extracción por ventanas/páginas explícitas; si el origen no las ofrece,
             es un problema de `red` (paginar contra la fuente) antes que de `datos`.
```

Reglas transversales de la clase:

- **Validación en la frontera**: valida el esquema de entrada **antes** de transformar; los registros inválidos van a un informe de errores explícito, nunca se descartan en silencio (integridad de datos, contrato ETL de referencia).
- **Deduplicación por clave canónica**: normaliza la clave (mayúsculas, espacios, formatos), deduplica por hash de esa clave; conserva una representación por clave y registra los duplicados en el informe.
- **Escritura idempotente**: preferir upsert por clave canónica; repetir una ejecución no debe duplicar resultados.
- **Ledger reanudable** (operaciones largas o costosas): persistir el progreso por unidad de trabajo (estado, checksum, marca temporal) para reanudar sin rehacer lo completado. Un ledger es estado del proceso, no conocimiento: vive en la ruta de salida definida por el contrato del nodo.

## Defaults canónicos

| Parámetro | Default | Cuándo especializar |
|---|---|---|
| `MEM_SEGURA` (límite para batch en memoria) | 100 MB de datos en procesamiento | El nodo mide su entorno real (ítem con medición) |
| Tamaño de chunk (streaming) | 1.000 registros o 10 MB por lote | I/O-bound → lotes menores para progreso observable; CPU-bound → mayores para amortizar (medido) |
| Ventana de series | 2 períodos completos contiguos | El dominio define la granularidad natural |
| Conservación de historias de salida | 3 más recientes | Ciclo de vida y espacio definidos por el contrato del nodo |

## Antipatrones

- Cargar el conjunto completo «para simplificar» y depender de que el volumen no crezca.
- Descartar o «reparar» registros inválidos sin informe explícito.
- Deduplicar por representación superficial ( espacios, mayúsculas) en vez de por clave canónica.
- Proceso no reanudable que ante un fallo del 90% reinicia desde 0.
- Hardcodear umbrales de volumen en la lógica: los umbrales viven en configuración centralizada (ley 5) o en los parámetros especializados del contrato.

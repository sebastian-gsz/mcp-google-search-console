# Protocolo `cómputo` — CPU, memoria y GPU

Clase: **`cómputo`**. Aplica cuando el cuello de botella dominante es el procesamiento local: tiempo de CPU, uso de memoria o aceleradores.

## Árbol de decisión

```text
0. ¿Hay medición que demuestre el cuello de botella?
   └── NO → medir primero (prueba reproducible en el ítem); optimizar sin medición es especulación.
1. ¿El coste crece con el tamaño de entrada peor que O(n)?
   ├── SÍ → atacar el algoritmo (estructura de datos, índice, hash) antes que el hardware.
   └── NO → seguir.
2. ¿El tiempo se gasta en ESPERA (I/O, red, disco)?
   ├── SÍ → problema de `red` o `datos`; usar concurrencia (async/hilos), no paralelismo pesado.
   └── NO (cómputo puro) → paralelismo por procesos/núcleos con partición por datos.
3. ¿El consumo de memoria es el límite?
   └── Streaming por bloques (protocolo `datos`) antes que más RAM.
4. ¿Hay GPU disponible y el contrato del nodo la autoriza?
   ├── SÍ → batching grande para amortizar transferencias; minimizar idas y vueltas host↔device.
   └── NO → resolver en CPU; proponer la autorización como ítem si el perfilado lo justifica.
```

Reglas transversales de la clase:

- **Medir antes de optimizar**: toda optimización aporta al `decision_log` la medición antes/después y el comando reproducible que la produce. Una optimización sin medición es especulación (ley 12).
- **Complejidad objetivo**: O(n) sobre el tamaño de entrada en memoria como objetivo por defecto; desviarse exige justificación en el contrato del nodo.
- **Concurrencia para espera, paralelismo para cómputo**: no paralelices con procesos lo que es espera de I/O; no resuelvas con hilos lo que es CPU-bound (salvo runtime que lo abstraiga correctamente).
- **Determinismo**: el cómputo paralelo debe producir el mismo resultado que el secuencial salvo dependencias externas declaradas (reproducibilidad, contrato ETL de referencia).
- **Precisión**: no reducir precisión (fp16, muestreo, aproximaciones) sin evidencia de que el resultado sigue siendo válido para el dominio; la decisión queda en `decision_log`.

## Defaults canónicos

| Parámetro | Default | Cuándo especializar |
|---|---|---|
| Umbral de optimización | Solo con perfilado que demuestre ≥ 20% del tiempo en un punto | Dominios con SLA de latencia |
| Paralelismo | Un worker por núcleo físico | El nodo mide contención de memoria o I/O |
| Tamaño de batch (GPU/transferencias) | El mayor que quepa en la memoria del dispositivo con margen 20% | Medición real del dispositivo |
| Precisión | La nativa del dominio (no reducir) | Evidencia de validez del resultado |

## Antipatrones

- Optimizar por intuición sin perfilado.
- Paralelizar I/O-bound con procesos pesados (overhead > ganancia).
- Cargar en memoria lo que puede transmitirse por bloques.
- Usar GPU porque «está ahí», sin autorización del contrato ni perfilado.
- Resultados no deterministas sin declaración explícita del nodo.

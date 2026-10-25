---
title: AGENTS.md — Punto de entrada para agentes
Rol: Enlace de convención → Mapa central de arquitectura
Lectura obligatoria: SÍ
---

Este repositorio se navega como un **árbol de contratos**: cada directorio con responsabilidad propia
tiene su `ARCHITECTURE.md`. Una sola fuente de verdad de contexto por dominio.

👉 Empieza siempre en **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — mapa central, protocolo de lectura,
tabla de ruteo de nodos y leyes universales. 👈

## Esenciales (rigen siempre, en todo el repo)

- **Contratos antes que código**: no abras scripts sin haber leído la cadena de contratos hasta tu nodo.
- **El trabajo vive solo en el workboard** (`docs/workboard/`): claim atómico, `touches` delimitados,
  evidencia en el cierre. Ninguna conversación autoriza trabajo.
- **Misma entrega**: código + contrato del nodo + ítem + índice, siempre sincronizados.
  Un nodo obsoleto es un bug.
- **Notificación ascendente minimal**: tu cambio notifica su existencia al padre inmediato
  (una fila de ruteo); el detalle nunca sube ni se propaga a nodos hermanos.

## Permisos

- Permitido sin preguntar: leer, listar, verificar archivos con los comandos del contrato del nodo.
- Pregunta primero: instalar dependencias, borrar archivos, `git push`, build completo, crear o
  modificar contratos y nodos.

## Instrucción mínima para cualquier agente

1. Abre **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** y sigue su §1 *Protocolo de lectura* hasta el nodo
   que cubre tu tarea.
2. No leas scripts "a ciegas": audita código solo si el contrato del nodo no basta.
3. Antes de trabajar operativo, cumple el protocolo de claim del workboard.
4. Si modificas comportamiento, aplica el §5 del mapa maestro en la misma entrega.

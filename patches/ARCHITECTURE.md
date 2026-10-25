---
title: ARCHITECTURE.md — Fruto «patches»
Rol: Fork local de una dependencia transitiva (compatibilidad con Node moderno)
Objetivo: Regular y documentar el parche local de buffer-equal-constant-time, su razón de ser y su mecanismo de activación.
Nivel: Fruto
Estado: implemented
Padre: ../docs/ARCHITECTURE.md
Lectura obligatoria: SÍ — antes de inspeccionar, modificar o sustituir este parche.
---

<br>**↑ Padre**: [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — mapa maestro, leyes universales y protocolo de lectura.<br/>

## 1. Alcance y autoridad

Este contrato se aplica exclusivamente a `patches/`. Documenta el fork local de la dependencia transitiva `buffer-equal-constant-time` (cadena: `google-auth-library` → `gtoken` → `jws` → `jwa`), su contenido y el mecanismo por el que el gestor de paquetes debe sustituir la versión del registro por este fork.

- **Entrada**: la resolución de dependencias del gestor de paquetes (`package.json` + lockfile).
- **Proceso**: sustitución del paquete original por el fork local durante la instalación.
- **Salida**: el módulo `buffer-equal-constant-time` resuelto al fork en el árbol instalado.

Quedan fuera las dependencias de producto en sí (`package.json`/`pnpm-lock.yaml` regulan la lista; su comportamiento transversal vive en `src/ARCHITECTURE.md` §5) y el código de producto.

## 2. Cláusulas de comportamiento e implementación

1. Lee este contrato y todos sus contratos superiores antes de actuar.
2. Antes de trabajo operativo, consulta [docs/workboard](../docs/workboard/ARCHITECTURE.md) y cumple su claim, autorización, bloqueo y cierre.
3. **Qué hace el fork**: misma API que el original (1.0.x) pero la comparación en tiempo constante usa `crypto.timingSafeEqual` con fallback XOR, y `install()`/`restore()` son no-ops — el original manipulaba `Buffer.prototype`, patrón deprecado/roto en Node moderno (el fork se declara «Node.js 25 compatible»).
4. **Mecanismos declarados (duales)**: `overrides` de **npm** en `package.json` y `overrides` de **pnpm** en `pnpm-workspace.yaml` (desde pnpm 10/12 ese archivo es el hogar de las settings; el campo `pnpm` de package.json ya no se lee). Ambos apuntan a `file:./patches/buffer-equal-constant-time`.
5. **Activación contrastada (OPS-003, 2026-10-25)**: `pnpm-lock.yaml` resuelve `buffer-equal-constant-time@file:patches/buffer-equal-constant-time` — la 1.0.1 del registro ya no aparece — y `jwa` enlaza al fork (versión 1.0.2, `crypto.timingSafeEqual`). `.dockerignore` ya no excluye `patches/`. Los build scripts de `esbuild`/`sharp`/`workerd` están declarados en `ignoredBuiltDependencies` (publican binarios precompilados por plataforma; el Dockerfile ya instalaba con `--ignore-scripts`).
6. Cualquier nuevo parche de dependencia entra aquí como subdirectorio con la misma estructura (`package.json` del fork + implementación) y actualiza este contrato en la misma entrega.
7. No modificar el fork sin actualizar su versión declarada y este contrato; no «actualizar» el fork copiando código no auditado.
8. No alteres ni relajes contratos superiores. Si el cambio requiere hacerlo, detén la ejecución y solicita resolución.

## 3. Mapa real de archivos y símbolos

Contrastado contra la implementación el 2026-10-25 (lectura íntegra de ambos archivos).

| Archivo | Responsabilidad comprobada | Símbolos / contenido |
|---|---|---|
| `patches/buffer-equal-constant-time/package.json` | Manifiesto del fork (1.0.2, CommonJS, BSD-3-Clause). | `name`, `version: 1.0.2`, `main: index.js` |
| `patches/buffer-equal-constant-time/index.js` | Comparación en tiempo constante: `crypto.timingSafeEqual` con fallback XOR; `install()`/`restore()` no-ops. | `module.exports = bufferEq`, `bufferEq.install`, `bufferEq.restore` |

## 4. Grafo funcional aprobado

```text
pnpm install / npm install
    ├── (npm) overrides (package.json) → file:./patches/buffer-equal-constant-time  ← fork activo
    └── (pnpm) overrides (pnpm-workspace.yaml) → file:./patches/buffer-equal-constant-time ← fork activo (OPS-003)
    ↓
jwa → bufferEq(a, b)  (verificación HMAC en la firma de tokens de servicio)
    ↓
google-auth-library / gtoken — autenticación de las llamadas a la API de GSC
```

Dependencias aprobadas:

- El fork no depende de nada fuera de los módulos nativos `buffer` y `crypto`.
- Efecto comprobado por lectura y por resolución: sin manipulación de `Buffer.prototype` (el original 1.0.x parcheaba el prototipo global vía `install()`; el fork lo deja en no-op).

## 5. Configuración, datos y resultados

| Parámetro / dato | Fuente | Efecto |
|---|---|---|
| `overrides` en `package.json` | Configuración npm | Activa el fork en installs con npm |
| `overrides` en `pnpm-workspace.yaml` | Configuración pnpm | Activa el fork en installs con pnpm (PNPM 12 ignora el campo de npm) |
| `.dockerignore` | Configuración de build | Ya no excluye `patches/`: el contexto Docker contiene el fork |
| `ignoredBuiltDependencies` en `pnpm-workspace.yaml` | Política de builds | esbuild/sharp/workerd no ejecutan scripts de build (binarios precompilados) |
| Lockfile (`pnpm-lock.yaml`) | Resolución pnpm | Prueba factual: resuelve `file:patches/buffer-equal-constant-time` |

## 6. Verificación reproducible

| Verificación | Comando | Cobertura |
|---|---|---|
| Resolución efectiva | `grep -n "buffer-equal-constant-time" pnpm-lock.yaml` | Qué versión instalará pnpm (`file:patches/…` = fork activo desde OPS-003) |
| Enlace real del consumidor | `readlink -f node_modules/.pnpm/jwa@*/node_modules/buffer-equal-constant-time` | El require de `jwa` apunta al fork (versión 1.0.2) |
| Sintaxis del fork | `node --check patches/buffer-equal-constant-time/index.js` | Parseo del módulo |
| Prueba funcional del fork | `node -e "const eq=require('./patches/buffer-equal-constant-time'); console.log(eq(Buffer.from('a'),Buffer.from('a'), true))"` (y un caso desigual) | Camino feliz + camino no feliz de la comparación |

Límites: la prueba funcional del fork y el `docker build` no se ejecutaron en esta entrega (sin Docker en el entorno); la resolución del fork está contrastada en lockfile, enlace de `jwa` y contenido instalado (versión 1.0.2 + `timingSafeEqual`).

## 7. Términos y condiciones

1. **Autoridad**: este contrato está subordinado a `docs/ARCHITECTURE.md`.
2. **Unidad de cambio**: alta, sustitución o retirada de parches de dependencias.
3. **Límite**: este contrato no autoriza añadir parches sin caso real (ley 12 del mapa maestro: anti-abstracción especulativa — un parche se justifica por un fallo concreto del original).
4. **Integridad del mapa**: cualquier nuevo subdirectorio de parche se refleja aquí y en la topología del mapa maestro.
5. **Workboard**: es la fuente exclusiva de estado, coordinación y trazabilidad del trabajo.
6. **Conflicto o fallo**: si el gestor de paquetes resuelve una versión distinta a la esperada, es una violación de este contrato: detén, documenta y escala.

---
*Fin del contrato de `patches/`. Sube a [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) para las normas superiores.*

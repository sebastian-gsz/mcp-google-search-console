#!/usr/bin/env node
// verify-workboard.mjs — verificación mecánica del workboard (contrato §3.3 y §7.6)
// Uso: node verify-workboard.mjs [ruta-al-workboard]     (por defecto: el directorio de este script)
// Valida: items/ ↔ INDEX.md ↔ items/_done/ y los campos del SCHEMA.md.
// Sin dependencias. Código de salida: 0 sin violaciones, 1 con violaciones.

import fs from 'node:fs';
import path from 'node:path';

const wbDir = path.resolve(process.argv[2] ?? import.meta.dirname);
const itemsDir = path.join(wbDir, 'items');
const doneDir = path.join(itemsDir, '_done');
const indexFile = path.join(wbDir, 'INDEX.md');

const STATUSES = ['open', 'in_progress', 'blocked', 'done', 'cancelled'];
const ACTIVE_STATUSES = ['open', 'in_progress', 'blocked'];
const PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
const CLASSES = ['datos', 'red', 'cómputo', 'agente'];
const REQUIRED = ['id', 'title', 'status', 'priority', 'class', 'node', 'created_at', 'updated_at'];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;

const violations = [];
const fail = (file, msg) => violations.push(`${path.relative(wbDir, file) || file}: ${msg}`);

// --- Parser de front-matter (subconjunto YAML del SCHEMA) -------------------
function parseFrontMatter(text, file) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!m) {
    fail(file, 'sin front-matter YAML');
    return null;
  }
  const fm = {};
  let currentKey = null;
  for (const raw of m[1].split(/\r?\n/)) {
    if (raw.trim() === '' || /^\s*#/.test(raw)) continue;
    const listItem = /^\s+-\s?(.*)$/.exec(raw);
    if (listItem && currentKey) {
      if (!Array.isArray(fm[currentKey])) fm[currentKey] = [];
      fm[currentKey].push(listItem[1].trim().replace(/^["']|["']$/g, ''));
      continue;
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(raw);
    if (!kv) {
      fail(file, `línea de front-matter no interpretable: «${raw.trim()}»`);
      continue;
    }
    const key = kv[1];
    let value = kv[2].trim();
    currentKey = key;
    if (value === '[]') { fm[key] = []; continue; }
    if (value === 'null' || value === '') { fm[key] = null; continue; }
    const inlineList = /^\[(.*)\]$/.exec(value);
    if (inlineList) {
      fm[key] = inlineList[1]
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
      continue;
    }
    fm[key] = value.replace(/^["']|["']$/g, '');
  }
  return fm;
}

// --- Recolección y validación por ítem --------------------------------------
if (!fs.existsSync(itemsDir)) fail(wbDir, 'falta el directorio items/');
if (!fs.existsSync(doneDir)) fail(wbDir, 'falta el directorio items/_done/');

const collect = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f)) : [];

const all = new Map(); // id -> { fm, file, isActive }

for (const file of [...collect(itemsDir), ...collect(doneDir)]) {
  const isActive = !file.includes(`${path.sep}_done`);
  const fm = parseFrontMatter(fs.readFileSync(file, 'utf8'), file);
  if (!fm) continue;

  const id = String(fm.id ?? '');
  if (id && all.has(id)) fail(file, `ID duplicado: ${id} (también en ${path.relative(wbDir, all.get(id).file)})`);
  else if (id) all.set(id, { fm, file, isActive });

  const base = path.basename(file, '.md');
  if (id && !base.startsWith(id)) fail(file, `el nombre «${base}.md» no empieza por el ID «${id}»`);

  for (const k of REQUIRED) {
    if (fm[k] == null || fm[k] === '') fail(file, `campo obligatorio ausente: ${k}`);
  }
  if (fm.status != null && !STATUSES.includes(fm.status)) fail(file, `status inválido: ${fm.status}`);
  if (fm.priority != null && !PRIORITIES.includes(fm.priority)) fail(file, `prioridad inválida: ${fm.priority}`);
  if (fm.class != null && !CLASSES.includes(fm.class)) fail(file, `clase inválida: ${fm.class} (usa: ${CLASSES.join(', ')})`);
  for (const k of ['id', 'title', 'node']) {
    const v = fm[k];
    if (typeof v === 'string' && /[<>]/.test(v)) fail(file, `marcador sin sustituir en ${k}: «${v}»`);
  }
  for (const k of ['created_at', 'updated_at', 'closed_at', 'claimed_at']) {
    if (fm[k] != null && !ISO.test(String(fm[k]))) fail(file, `${k} sin formato ISO-8601 con offset: «${fm[k]}»`);
  }

  const closed = fm.status === 'done' || fm.status === 'cancelled';
  if (closed) {
    if (isActive) fail(file, `estado ${fm.status} pero el archivo sigue fuera de items/_done/`);
    if (fm.closed_at == null) fail(file, 'cerrado sin closed_at');
    if (fm.status === 'cancelled' && !fm.closed_reason) fail(file, 'cancelado sin closed_reason');
    if (fm.claimed_by != null) fail(file, 'cerrado sin limpiar el claim (claimed_by debe ser null)');
  } else if (fm.status != null) {
    if (fm.claimed_by != null && fm.claimed_at == null) fail(file, 'claimed_by sin claimed_at');
    if (fm.claimed_by == null && fm.claimed_at != null) fail(file, 'claimed_at sin claimed_by');
  }

  const isExp = /^EXP-/.test(id);
  const regimen = fm.regimen;
  if (regimen != null && regimen !== 'produccion' && regimen !== 'exploracion') {
    fail(file, `regimen inválido: ${regimen} (usa produccion | exploracion)`);
  }
  if (isExp && regimen !== 'exploracion') fail(file, 'ID EXP-* requiere regimen: exploracion (§4.6)');
  if (!isExp && regimen === 'exploracion') fail(file, 'regimen: exploracion exige ID EXP-### (§4.6)');
  if (regimen === 'exploracion') {
    if (fm.timebox == null || !ISO.test(String(fm.timebox))) {
      fail(file, 'exploración sin timebox ISO-8601 (§4.6)');
    } else if (!closed && new Date(String(fm.timebox)) < new Date()) {
      fail(file, 'exploración con timebox vencido — cerrar o promover (§4.6)');
    }
  }
}

// --- Dependencias reales -----------------------------------------------------
for (const { fm, file } of all.values()) {
  for (const k of ['blocks', 'blocked_by']) {
    for (const dep of Array.isArray(fm[k]) ? fm[k] : []) {
      if (!all.has(dep)) fail(file, `${k} apunta a un ID inexistente: ${dep}`);
    }
  }
  if (fm.parent != null && !all.has(fm.parent)) fail(file, `parent apunta a un ID inexistente: ${fm.parent}`);
}

// --- INDEX.md: proyección exacta de los ítems activos ------------------------
const rows = [];
if (!fs.existsSync(indexFile)) {
  fail(wbDir, 'falta INDEX.md');
} else {
  let header = null;
  for (const line of fs.readFileSync(indexFile, 'utf8').split(/\r?\n/)) {
    if (!/^\s*\|/.test(line)) { header = null; continue; }
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length > 1 && cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
    if (!header) {
      const lower = cells.map((c) => c.toLowerCase());
      if (lower.includes('id') && lower.includes('status')) header = lower;
      continue;
    }
    const get = (name) => cells[header.indexOf(name)] ?? '';
    rows.push({ id: get('id'), status: get('status') });
  }
}

const active = new Map(
  [...all.values()].filter((it) => it.isActive && ACTIVE_STATUSES.includes(it.fm.status)).map((it) => [String(it.fm.id), it]),
);
const seen = new Set();
for (const r of rows) {
  if (!r.id) { violations.push('INDEX.md: fila sin ID'); continue; }
  if (seen.has(r.id)) violations.push(`INDEX.md: ID duplicado ${r.id}`);
  seen.add(r.id);
  const item = active.get(r.id);
  if (!item) {
    const anywhere = all.get(r.id);
    violations.push(
      `INDEX.md: ${r.id} listado pero ${anywhere ? (anywhere.isActive ? `su estado es ${anywhere.fm.status} (no activo)` : 'está archivado en _done/') : 'no existe en items/'}`,
    );
  } else if (r.status && r.status !== item.fm.status) {
    violations.push(`INDEX.md: ${r.id} con status «${r.status}» pero el ítem dice «${item.fm.status}»`);
  }
}
for (const [id] of active) {
  if (!seen.has(id)) violations.push(`INDEX.md: ítem activo ${id} no listado`);
}

// --- Informe -----------------------------------------------------------------
const activeCount = [...all.values()].filter((it) => it.isActive).length;
const doneCount = [...all.values()].filter((it) => !it.isActive).length;
console.log(`workboard: ${wbDir}`);
console.log(`ítems en items/: ${activeCount} · archivados en _done/: ${doneCount} · filas en INDEX.md: ${rows.length}`);
if (violations.length === 0) {
  console.log('OK — sin violaciones del contrato del workboard.');
  process.exit(0);
}
console.log(`VIOLACIONES (${violations.length}):`);
for (const v of violations) console.log(`  - ${v}`);
process.exit(1);

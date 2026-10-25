#!/usr/bin/env node
/**
 * Pipeline de investigación ligera para el servidor MCP de GSC.
 *
 * Descarga feeds RSS/Atom y páginas semilla sobre Google Search Console,
 * convierte a texto plano y guarda el resultado en docs/research/raw/.
 *
 * Principios:
 * - Sin dependencias: fetch nativo de Node 20+.
 * - Respeta robots.txt (comprobación simple de "Disallow: /" para el host).
 * - User-Agent identificable y retardo entre peticiones.
 * - Idempotente: re-ejecutar refresca el contenido.
 *
 * Uso: node tools/research/fetch-research.mjs [--max N]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RAW_DIR = path.join(ROOT, 'docs', 'research', 'raw');

const USER_AGENT =
  'mcp-server-gsc-research/0.3 (SEO tooling research; contact: repo owner)';

/** Fuentes RSS/Atom: { name, url, max: entradas a descargar del feed } */
const FEEDS = [
  { name: 'google-search-central', url: 'https://developers.google.com/search/blog/feed.xml', max: 15 },
  { name: 'search-engine-land', url: 'https://searchengineland.com/feed', max: 15 },
  { name: 'search-engine-journal', url: 'https://www.searchenginejournal.com/feed/', max: 15 },
  { name: 'moz-blog', url: 'https://moz.com/blog/feed', max: 10 },
  { name: 'ahrefs-blog', url: 'https://ahrefs.com/blog/feed/', max: 10 },
  { name: 'semrush-blog', url: 'https://www.semrush.com/blog/feed/', max: 10 },
];

/** Páginas sueltas de referencia directa */
const SEED_PAGES = [
  { name: 'gsc-api-searchanalytics', url: 'https://developers.google.com/webmaster-tools/v1/searchanalytics/query' },
  { name: 'gsc-api-urlinspection', url: 'https://developers.google.com/webmaster-tools/v1/urlInspection/index/inspect' },
  { name: 'gsc-api-limits', url: 'https://developers.google.com/webmaster-tools/v1/limits' },
];

const MAX_ARTICLES_PER_HOST_TOTAL = parseInt(
  (process.argv.find((a) => a === '--max') ? process.argv[process.argv.indexOf('--max') + 1] : '50'),
  10,
);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Comprobación simple de robots.txt: bloquea si "Disallow: /" global para *. */
async function robotsAllows(url) {
  try {
    const u = new URL(url);
    const res = await fetch(`${u.protocol}//${u.host}/robots.txt`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return true; // sin robots.txt accesible: se permite
    const txt = await res.text();
    const uaBlocks = txt
      .split(/user-agent:\s*(.+)$/im)
      .reduce((acc) => acc, false); // análisis mínimo; solo regla global
    void uaBlocks;
    // Regla pragmática: si existe "User-agent: *" seguido de "Disallow: /" → bloqueado.
    const star = txt.toLowerCase().split('user-agent: *');
    if (star.length > 1) {
      const section = star[1].split('user-agent:')[0];
      if (/^\s*disallow:\s*\/?\s*$/m.test(section)) return false;
    }
    return true;
  } catch {
    return true;
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCdataOrText(block) {
  const cdata = block.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return cdata ? cdata[1] : block;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xml,application/rss+xml,text/xml,*/*' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function save(name, content) {
  fs.writeFileSync(path.join(RAW_DIR, `${name}.txt`), content, 'utf8');
}

async function fetchFeed(feed) {
  const xml = await fetchText(feed.url);
  const items = xml.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/g) ?? [];
  let saved = 0;
  const lines = [`FUENTE: ${feed.name}`, `FEED: ${feed.url}`, ''];

  for (const item of items.slice(0, feed.max)) {
    const title = extractCdataOrText(item.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1] ?? '');
    const link =
      item.match(/<link[^>]*href="([^"]+)"/)?.[1] ??
      extractCdataOrText(item.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1] ?? '');
    const date = item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>|<updated[^>]*>([\s\S]*?)<\/updated>/)?.[0] ?? '';
    const description = stripHtml(
      extractCdataOrText(
        item.match(/<description[^>]*>([\s\S]*?)<\/description>|<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? '',
      ),
    ).slice(0, 2000);

    lines.push(`## ${stripHtml(title)}`);
    lines.push(`URL: ${link}`);
    lines.push(`FECHA: ${stripHtml(date)}`);
    lines.push(`RESUMEN: ${description}`);
    lines.push('');

    // Artículo completo solo de feeds clave (Google y SEL) para no abusar.
    if (link && (feed.name === 'google-search-central' || feed.name === 'search-engine-land') && saved < 5) {
      if (await robotsAllows(link)) {
        try {
          await delay(1500);
          const html = await fetchText(link);
          const main =
            html.match(/<article[\s\S]*?<\/article>/i)?.[0] ??
            html.match(/<main[\s\S]*?<\/main>/i)?.[0] ??
            html;
          lines.push(`### TEXTO COMPLETO: ${stripHtml(title)}`);
          lines.push(stripHtml(main).slice(0, 30_000));
          lines.push('');
          saved++;
        } catch (e) {
          lines.push(`(artículo completo no disponible: ${e.message})`, '');
        }
      }
    }
  }
  save(feed.name, lines.join('\n'));
  return `${feed.name}: ${items.length} entradas, ${saved} artículos completos`;
}

async function fetchSeed(page) {
  if (!(await robotsAllows(page.url))) return `${page.name}: BLOQUEADO por robots.txt (omitido)`;
  const html = await fetchText(page.url);
  const title = stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? page.name);
  save(
    page.name,
    [`FUENTE: ${page.name}`, `URL: ${page.url}`, `TITULO: ${title}`, '', stripHtml(html).slice(0, 60_000)].join('\n'),
  );
  return `${page.name}: OK (${title})`;
}

async function redditJson(subreddit) {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=search+console+api&restrict_sr=1&sort=top&t=year&limit=25`;
  if (!(await robotsAllows(url))) return `reddit-${subreddit}: BLOQUEADO por robots.txt (omitido)`;
  const data = JSON.parse(await fetchText(url));
  const lines = [`FUENTE: reddit r/${subreddit} (búsqueda: search console api)`, `URL: ${url}`, ''];
  for (const child of data?.data?.children ?? []) {
    const p = child.data;
    lines.push(`## ${p.title}`);
    lines.push(`URL: https://www.reddit.com${p.permalink}`);
    lines.push(`PUNTOS: ${p.score} COMENTARIOS: ${p.num_comments}`);
    lines.push(`TEXTO: ${stripHtml(p.selftext ?? '').slice(0, 1500)}`);
    lines.push('');
  }
  save(`reddit-${subreddit}`, lines.join('\n'));
  return `reddit-${subreddit}: ${(data?.data?.children ?? []).length} hilos`;
}

async function main() {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  const results = [];

  for (const feed of FEEDS) {
    try {
      results.push(await fetchFeed(feed));
    } catch (e) {
      results.push(`${feed.name}: FALLO (${e.message})`);
    }
    await delay(1500);
  }

  for (const page of SEED_PAGES) {
    try {
      results.push(await fetchSeed(page));
    } catch (e) {
      results.push(`${page.name}: FALLO (${e.message})`);
    }
    await delay(1500);
  }

  for (const sub of ['SEO', 'bigseo']) {
    try {
      results.push(await redditJson(sub));
    } catch (e) {
      results.push(`reddit-${sub}: FALLO (${e.message})`);
    }
    await delay(2000);
  }

  console.log(results.join('\n'));
  const files = fs.readdirSync(RAW_DIR);
  console.log(`\nTotal archivos en raw/: ${files.length}`);
}

main().catch((e) => {
  console.error('Error fatal:', e);
  process.exit(1);
});

// Build sonrası çalışır: tüm dokümanları tek düz metin dosyasına toplar (AI yardımcısı için).
// Çıktı: build/llms-full.txt (TR) ve build/en/llms-full.txt (EN).
// installer.landing ve installer.app'teki "AI'ya sor" bu dosyayı okur.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://wiki.frostnav.com';
// Sidebar sırası (sidebars.js): intro, desteklenen-araclar, kurulum/*, kullanim/*, sss, bilinen-sorunlar.
const GROUPS = [['intro.mdx', 'desteklenen-araclar.mdx'], ['kurulum/'], ['kullanim/'], ['sss.mdx', 'bilinen-sorunlar.mdx']];

const LOCALES = {
  tr: {dir: path.join(ROOT, 'docs'), base: SITE, out: path.join(ROOT, 'build', 'llms-full.txt'),
    head: 'FrostNav wiki, tam metin. Her bölümün başında sayfanın adresi yazar.'},
  en: {dir: path.join(ROOT, 'i18n/en/docusaurus-plugin-content-docs/current'), base: `${SITE}/en`,
    out: path.join(ROOT, 'build', 'en', 'llms-full.txt'),
    head: 'FrostNav wiki, full text. Each section starts with the page address.'},
};

function frontMatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  const meta = {};
  if (!m) return {meta, body: src};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return {meta, body: src.slice(m[0].length)};
}

function urlOf(rel, meta, base) {
  if (meta.slug) return `${base}${meta.slug === '/' ? '/' : `${meta.slug}/`}`;
  const noExt = rel.replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '$1');
  return `${base}/${noExt}${noExt && !noExt.endsWith('/') ? '/' : ''}`;
}

function clean(body, pageUrl, rel, urls) {
  return body
    .replace(/^import .*$/gm, '')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*\/>/g, '[Image: $1]')
    .replace(/<\/?(details|summary)>/g, '')
    .replace(/<[A-Z]\w*[^>]*\/>/g, '')
    .replace(/^:::(\w+)\s*$/gm, (_, k) => `[${k.toUpperCase()}]`)
    .replace(/^:::\s*$/gm, '')
    .replace(/ \{#[\w-]+\}/g, '')
    // Göreli doküman linkleri → tam adres.
    .replace(/\]\((\.{1,2}\/[^)#\s]*?)(?:\.mdx?)?(#[^)\s]*)?\)/g, (all, p, hash = '') => {
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), p));
      const u = urls[target] || urls[`${target}/index`];
      return u ? `](${u}${hash})` : all;
    })
    .replace(/\]\((#[^)\s]*)\)/g, `](${pageUrl}$1)`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function listDocs(dir) {
  const files = [];
  for (const group of GROUPS) {
    const part = [];
    for (const item of group) {
      if (!item.endsWith('/')) { if (fs.existsSync(path.join(dir, item))) part.push(item); continue; }
      for (const f of fs.readdirSync(path.join(dir, item))) if (/\.mdx?$/.test(f)) part.push(item + f);
    }
    const pos = (rel) => Number(frontMatter(fs.readFileSync(path.join(dir, rel), 'utf8')).meta.sidebar_position ?? 999);
    files.push(...(group.length === 1 ? part.sort((a, b) => pos(a) - pos(b)) : part));
  }
  return files;
}

for (const [, loc] of Object.entries(LOCALES)) {
  if (!fs.existsSync(path.dirname(loc.out))) continue; // ilgili dil build edilmemiş
  const parts = [loc.head];
  const docs = listDocs(loc.dir).map((rel) => {
    const {meta, body} = frontMatter(fs.readFileSync(path.join(loc.dir, rel), 'utf8'));
    return {rel, meta, body, url: urlOf(rel, meta, loc.base)};
  });
  // Uzantısız dosya yolu → sayfa adresi (göreli linkleri çözmek için).
  const urls = Object.fromEntries(docs.map((d) => [d.rel.replace(/\.mdx?$/, ''), d.url]));
  for (const {rel, meta, body, url} of docs) {
    parts.push(`\n\n================================================================\n# ${meta.title || rel}\n${url}\n\n${clean(body, url, rel, urls)}`);
  }
  fs.writeFileSync(loc.out, `${parts.join('')}\n`);
  console.log(`llms-full: ${path.relative(ROOT, loc.out)}`);
}

/**
 * Token testi — iki kontrol:
 *
 * 1. Sabit değer (teslimi engeller): token'a bağlanması gereken özelliklerde var() yerine sabit değer.
 *    Kapsam ads-design-builder.md → "Token Bağlama — Hardcode Yasağı" tablosu:
 *      renk          color, background-color, border-*-color, outline-color, fill, stroke, text-decoration-color
 *      font-size     px / rem / em / pt değerleri
 *      font-family   adı verilmiş font (yalnızca genel aileler — serif, system-ui… — serbest)
 *      border-radius uzunluk değerleri
 *      boşluk        margin-*, padding-*, gap / row-gap / column-gap
 *    İstisnalar özellik bağlamında: 0, auto, normal, yüzdeler, transparent, currentColor, none,
 *    inherit / initial / unset / revert. user_explicit token'ın değeri de sabit yazılırsa hatadır:
 *    kaynak etiketi yalnızca estetik filtreden (AI tells) muaf tutar, token bağlamadan değil.
 *    Uygulama ekranlarında (<body data-platform="ios|android">) cihaz çerçevesinin dışındaki sunum sahnesi
 *    açıkça işaretlenir: <body class="ads-stage"> ve yalnızca seçicisi tam olarak .ads-stage / body.ads-stage
 *    olan kural muaftır. body, html, .device, .screen gibi diğer kurallar (uygulamanın gerçek arka planı)
 *    denetlenir. Web ekranlarında .ads-stage istisnası yoktur.
 *    Stil kaynakları: <style> blokları, bağlı yerel .css dosyaları (bir kez raporlanır), style="" öznitelikleri.
 *
 * 2. Değişken ↔ token: CSS'te tanımlanan --değişkenlerin değerleri token setiyle karşılaştırılır.
 *    Alias'lar ({Primitives.Color.Neutral.0}) çözülür. Açık tema (:root) açık değerlerle, koyu tema
 *    ([data-theme="dark"], @media (prefers-color-scheme: dark)) $extensions.mode.dark / "Dark" grubu
 *    değerleriyle karşılaştırılır.
 *      tokens/value-mismatch       değişken adı bir token'a eşleniyor ama değeri farklı      High
 *      tokens/value-not-in-set     değer token setinde hiç yok (serbest değer)                Medium
 *      tokens/dark-theme-missing   token setinde koyu tema var, sayfada koyu tema tanımı yok  High
 *    Değişken adı token yolunun tamamından (--color-bg-default) ya da sonundan (--accent-500 ↔
 *    Primitives.Color.Accent.500) eşlenir; birden çok farklı değere eşleniyorsa yalnızca değer kontrolü yapılır.
 *
 * Kullanım:
 *   node tokens.mjs                          → token JSON: project-state.md → token_dosyasi, yoksa *-tokens.json
 *   node tokens.mjs --tokens myproject.json  → dosya belirt
 *   Ortak seçenekler (--root, --format, --json): lib/common.mjs
 *
 * Token dosyası yoksa: project-state.md → token_dosyasi: yok (token'sız sunum modu) ise uygulanamaz,
 * aksi halde çalıştırılamadı.
 */

import { chromium } from 'playwright';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, relative, join, dirname, basename } from 'path';
import { projectRoot, projectHtmlFiles, htmlPrecheck, readProjectState, bodyPlatform, finish, crash } from './lib/common.mjs';

const TEST = 'tokens';
const PROJECT_ROOT = projectRoot();

// ── Token dosyası ─────────────────────────────────────────────────────────────

function findTokenFile() {
  const arg = process.argv.indexOf('--tokens');
  if (arg !== -1) return resolve(process.argv[arg + 1]);
  const declared = readProjectState(PROJECT_ROOT)?.token_dosyasi;
  if (declared && declared.toLowerCase() !== 'yok' && existsSync(join(PROJECT_ROOT, declared))) {
    return join(PROJECT_ROOT, declared);
  }
  const found = readdirSync(PROJECT_ROOT).find(e => e.endsWith('-tokens.json'));
  return found ? join(PROJECT_ROOT, found) : null;
}

// DTCG ağacını düzleştirir: [{ path: ['Color','bg-default'], value, dark }]
function collectTokens(obj, path = [], out = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_') || k.startsWith('$') || typeof v !== 'object' || v === null || Array.isArray(v)) continue;
    if ('$value' in v) out.push({ path: [...path, k], value: v.$value, dark: v.$extensions?.mode?.dark });
    else collectTokens(v, [...path, k], out);
  }
  return out;
}

function stringifyValue(value) {
  if (Array.isArray(value)) return value.map(stringifyValue).join(', ');
  if (value && typeof value === 'object') {
    if ('value' in value && 'unit' in value) return `${value.value}${value.unit}`;
    if ('offsetX' in value || 'blur' in value) {   // DTCG shadow
      const part = k => (value[k] === undefined ? '0px' : stringifyValue(value[k]));
      return `${value.inset ? 'inset ' : ''}${part('offsetX')} ${part('offsetY')} ${part('blur')} ${part('spread')} ${stringifyValue(value.color)}`;
    }
    return null;   // karşılaştırılamayan bileşik değer
  }
  return String(value);
}

// {Primitives.Color.Neutral.0} → değer (zincirleme alias'lar dahil)
function makeResolver(tokens) {
  const byPath = new Map(tokens.map(t => [t.path.join('.'), t]));
  const resolveRef = (raw, mode, depth = 0) => {
    const str = stringifyValue(raw);
    if (str === null) return null;
    const m = str.match(/^\{([^}]+)\}$/);
    if (!m || depth > 10) return str;
    const target = byPath.get(m[1]);
    if (!target) return str;
    const next = mode === 'dark' && target.dark !== undefined ? target.dark : target.value;
    return resolveRef(next, mode, depth + 1);
  };
  return resolveRef;
}

const slug = parts => parts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

// Eski biçim: Color.Light.* / Color.Dark.* grupları
function themeOfPath(path) {
  if (path.some(p => /^dark$/i.test(p))) return 'dark';
  if (path.some(p => /^light$/i.test(p))) return 'light';
  return 'both';
}

// Ad → { light:Set, dark:Set } ve değer kümeleri
function buildTokenIndex(tokens) {
  const resolveRef = makeResolver(tokens);
  const names = new Map();
  const values = { light: new Set(), dark: new Set() };
  let hasDark = false;

  const add = (name, theme, value) => {
    if (!names.has(name)) names.set(name, { light: new Set(), dark: new Set() });
    names.get(name)[theme].add(value);
  };

  for (const t of tokens) {
    const pathTheme = themeOfPath(t.path);
    const lightRaw = resolveRef(t.value, 'light');
    if (lightRaw === null) {
      // Bileşik token (tipografi vb.): adla eşlenmez, ama alt değerleri (fontSize, lineHeight…) geçerli değerlerdir
      if (t.value && typeof t.value === 'object') {
        for (const sub of Object.values(t.value)) {
          const v = resolveRef(sub, 'light');
          if (v !== null) { values.light.add(normalize(v)); values.dark.add(normalize(v)); }
        }
      }
      continue;
    }
    const light = normalize(lightRaw);
    const dark = t.dark !== undefined && resolveRef(t.dark, 'dark') !== null ? normalize(resolveRef(t.dark, 'dark')) : null;
    if (dark !== null || pathTheme === 'dark') hasDark = true;

    const cleanPath = t.path.filter(p => !/^(light|dark)$/i.test(p));
    const candidates = new Set([slug(t.path), slug(cleanPath)]);
    for (let i = 1; i < cleanPath.length; i++) candidates.add(slug(cleanPath.slice(i)));

    // Koyu değeri olmayan ortak token her iki temada geçerli bir değerdir, ama koyu temadaki bir
    // değişkenin "beklenen" değeri sayılmaz (token setinde o değişkenin koyu karşılığı tanımlı değil).
    const entries = pathTheme === 'light' ? [['light', light]]
      : pathTheme === 'dark' ? [['dark', light]]
      : dark !== null ? [['light', light], ['dark', dark]]
      : [['light', light]];
    for (const [theme, v] of entries) {
      for (const c of candidates) add(c, theme, v);
    }
    values.light.add(pathTheme === 'dark' ? null : light);
    values.dark.add(pathTheme === 'light' ? null : (dark ?? light));
  }
  return { names, values, hasDark };
}

// ── Değer normalizasyonu ──────────────────────────────────────────────────────

const toHex = (r, g, b, a) => {
  const to2 = n => Math.round(Number(n)).toString(16).padStart(2, '0');
  let out = `#${to2(r)}${to2(g)}${to2(b)}`;
  if (a !== undefined) {
    const alpha = String(a).endsWith('%') ? parseFloat(a) / 100 : parseFloat(a);
    if (alpha < 1) out += to2(alpha * 255);
  }
  return out;
};

// Karşılaştırma için tek biçim: küçük harf, renkler #rrggbb(aa), .5 → 0.5, rem → px (16 taban), 0px → 0.
// Gölge gibi bileşik değerlerin içindeki renk ve sayılar da aynı biçime getirilir.
function normalize(raw) {
  return String(raw).trim().toLowerCase().replace(/\s+/g, ' ')
    .replace(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/g, (_, r, g, b, a) => toHex(r, g, b, a))
    .replace(/#([0-9a-f]{3,8})\b/g, (_, h) => {
      if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
      if (h.length === 8 && h.endsWith('ff')) h = h.slice(0, 6);
      return `#${h}`;
    })
    .replace(/(^|[^\d.])\.(\d)/g, '$10.$2')
    .replace(/(-?\d*\.?\d+)rem\b/g, (_, n) => `${parseFloat((parseFloat(n) * 16).toFixed(3))}px`)
    .replace(/(^|[\s(,])-?0(\.0+)?(px|em)?(?=$|[\s),])/g, '$10')
    .replace(/\s*,\s*/g, ', ');
}

// ── Stil kaynakları ───────────────────────────────────────────────────────────

function collectSources(htmlFiles) {
  const sources = [];
  const seenCss = new Set();
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const label = relative(PROJECT_ROOT, file);
    const app = ['ios', 'android'].includes(bodyPlatform(html));

    const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n');
    if (inline.trim()) sources.push({ file: label, kind: 'style', css: inline, app });

    for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
      if (!/rel=["']?stylesheet/i.test(tag)) continue;
      const href = (tag.match(/href=["']([^"']+)["']/i) || [])[1];
      if (!href || /^(https?:)?\/\//i.test(href)) continue;
      const cssPath = resolve(dirname(file), href.split(/[?#]/)[0]);
      if (seenCss.has(cssPath) || !existsSync(cssPath)) continue;
      seenCss.add(cssPath);
      sources.push({ file: relative(PROJECT_ROOT, cssPath), kind: 'css', css: readFileSync(cssPath, 'utf8'), app });
    }

    const attrs = [...html.matchAll(/<([a-z][a-z0-9-]*)\b[^>]*\sstyle="([^"]*)"/gi)].map(m => ({ tag: m[1].toLowerCase(), style: m[2] }));
    if (attrs.length) sources.push({ file: label, kind: 'attr', attrs, app });
  }
  return sources;
}

// ── Tarayıcıda CSSOM ile ayrıştırma ───────────────────────────────────────────

// Tarayıcıda çalışır: her kaynak için { selector, theme, props: [[ad, değer]] } kuralları döndürür
function parseInBrowser(sources) {
  const isDark = (selector, media) =>
    /data-theme=["']?dark/.test(selector) || /\.dark\b/.test(selector) || /prefers-color-scheme:\s*dark/.test(media);

  const fromStyle = style => {
    const props = [];
    for (let i = 0; i < style.length; i++) {
      const name = style[i];
      props.push([name, style.getPropertyValue(name).trim()]);
    }
    return props;
  };

  const walk = (rules, media, out) => {
    for (const rule of rules) {
      if (rule.cssRules && !rule.selectorText) {
        walk(rule.cssRules, `${media} ${rule.conditionText || rule.media?.mediaText || ''}`, out);
      } else if (rule.selectorText && rule.style) {
        out.push({ selector: rule.selectorText, theme: isDark(rule.selectorText, media) ? 'dark' : 'light', props: fromStyle(rule.style) });
      }
    }
  };

  return sources.map(src => {
    const rules = [];
    if (src.kind === 'attr') {
      for (const { tag, style } of src.attrs) {
        const el = document.createElement(tag);
        el.setAttribute('style', style);
        rules.push({ selector: `${tag}[style]`, theme: 'light', props: fromStyle(el.style) });
      }
    } else {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(src.css.replace(/@import[^;]+;/g, ''));
      walk(sheet.cssRules, '', rules);
    }
    return { file: src.file, app: src.app, rules };
  });
}

// ── Sabit değer kuralları ─────────────────────────────────────────────────────

// value-not-in-set bu adlardaki sayısal değişkenlere bakar; --n, --i, --doc-device-h gibi yardımcı değişkenler atlanır
const TOKEN_LIKE_NAME = /^--(space|spacing|gap|radius|rounded|text|font-size|fs|size|stroke|border-width)(-|$)/;
// Ekran okuyucu yardımcı sınıfları bilinen bir kalıptır (margin: -1px, clip…), token kuralına tabi değildir
const UTILITY_SELECTOR = /\.(sr-only|visually-hidden|screen-reader-text)\b/;
const KEYWORDS = /^(inherit|initial|unset|revert|revert-layer)$/;
const COLOR_PROPS = /^(color|background-color|border-(top|right|bottom|left|block-start|block-end|inline-start|inline-end)-color|outline-color|fill|stroke|text-decoration-color|column-rule-color|caret-color)$/;
const SPACE_PROPS = /^(margin|padding)-(top|right|bottom|left|block-start|block-end|inline-start|inline-end)$|^(row-gap|column-gap)$/;
const RADIUS_PROPS = /^border-(top-left|top-right|bottom-right|bottom-left|start-start|start-end|end-start|end-end)-radius$/;
const GENERIC_FONTS = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|math|emoji|fangsong)$/;
const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(|^(?!transparent$|currentcolor$|none$)[a-z]+$/i;
const LENGTH = /(?:^|[\s(,])-?((?:\d*\.)?\d+)(px|rem|em|pt|vw|vh|svh|dvh|ch|ex)\b/g;
// Sıfır dışında birimli bir uzunluk var mı (0px, 0rem serbest)
const hasLength = value => [...value.matchAll(LENGTH)].some(m => parseFloat(m[1]) !== 0);

// Bir özellik-değer çifti token kuralına göre sabit mi? Sabitse kategori adını döndürür.
function hardcodeCategory(prop, value) {
  if (!value || prop.startsWith('--') || value.includes('var(') || KEYWORDS.test(value)) return null;
  if (COLOR_PROPS.test(prop)) {
    return /^(transparent|currentcolor|none|auto)$/i.test(value) ? null : (COLOR_LITERAL.test(value) ? 'renk' : null);
  }
  if (prop === 'font-size') return hasLength(value) ? 'font-size' : null;
  if (prop === 'font-family') {
    const families = value.split(',').map(f => f.trim().replace(/^["']|["']$/g, '').toLowerCase());
    return families.every(f => GENERIC_FONTS.test(f)) ? null : 'font-family';
  }
  if (RADIUS_PROPS.test(prop)) return hasLength(value) ? 'border-radius' : null;
  if (SPACE_PROPS.test(prop)) return hasLength(value) ? 'boşluk' : null;
  return null;
}

// ── Çalıştırma ────────────────────────────────────────────────────────────────

async function run() {
  const skip = htmlPrecheck(TEST, PROJECT_ROOT);
  if (skip) return finish(skip);

  const tokenFile = findTokenFile();
  if (!tokenFile || !existsSync(tokenFile)) {
    const declared = (readProjectState(PROJECT_ROOT)?.token_dosyasi || '').toLowerCase();
    if (declared === 'yok') {
      return finish({ test: TEST, status: 'not_applicable', reason: "project-state.md → token_dosyasi: yok (token'sız sunum modu)", findings: [] });
    }
    return finish({ test: TEST, status: 'not_run', reason: 'Token JSON bulunamadı — /ads-token-generator çalıştırın veya --tokens ile belirtin', findings: [] });
  }

  const tokens = collectTokens(JSON.parse(readFileSync(tokenFile, 'utf8')));
  const index = buildTokenIndex(tokens);
  console.log(`Token dosyası: ${basename(tokenFile)} — ${tokens.length} token${index.hasDark ? ' (koyu tema var)' : ''}`);

  const htmlFiles = projectHtmlFiles(PROJECT_ROOT);
  const sources = collectSources(htmlFiles);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const parsed = await page.evaluate(parseInBrowser, sources);
  await browser.close();

  const findings = [];
  const base = { viewport: null };
  const darkDefinedIn = new Set();

  for (const src of parsed) {
    for (const rule of src.rules) {
      // 1. Sabit değer
      const isStage = src.app && /^(body)?\.ads-stage$/.test(rule.selector.trim());
      if (!isStage && !UTILITY_SELECTOR.test(rule.selector)) {
        const hits = new Map();
        for (const [prop, value] of rule.props) {
          const cat = hardcodeCategory(prop, value);
          if (cat) hits.set(`${prop}: ${value}`, cat);
        }
        if (hits.size) {
          const cats = [...new Set(hits.values())].join(', ');
          findings.push({
            ...base, rule: 'tokens/hardcoded-value', file: src.file, selector: rule.selector, theme: null,
            impact: 'High', blocks: true,
            msg: `Token yerine sabit değer (${cats}): ${[...hits.keys()].slice(0, 6).join('; ')}${hits.size > 6 ? ` …+${hits.size - 6}` : ''}`,
          });
        }
      }

      // 2. Değişken ↔ token
      for (const [prop, rawValue] of rule.props) {
        if (!prop.startsWith('--') || !rawValue || rawValue.includes('var(')) continue;
        const theme = rule.theme;
        if (theme === 'dark') darkDefinedIn.add(src.file);
        const value = normalize(rawValue);
        const named = index.names.get(prop.slice(2));
        const expected = named ? named[theme] : null;
        const where = { ...base, file: src.file, selector: rule.selector, theme };

        if (expected && expected.size === 1) {
          const [want] = expected;
          if (want !== value) {
            findings.push({ ...where, rule: 'tokens/value-mismatch', impact: 'High', blocks: true, msg: `${prop}: ${rawValue} — token değeri (${theme}): ${want}` });
          }
        } else if (!index.values[theme].has(value) && (/^#[0-9a-f]{6,8}$/.test(value) || (TOKEN_LIKE_NAME.test(prop) && /^-?\d/.test(value)))) {
          findings.push({ ...where, rule: 'tokens/value-not-in-set', impact: 'Medium', blocks: false, msg: `${prop}: ${rawValue} — bu değer token setinde (${theme}) yok` });
        }
      }
    }
  }

  // Koyu tema: token setinde varsa her HTML sayfasının (kendisi ya da bağlı CSS'i) koyu tanım içermesi gerekir
  if (index.hasDark) {
    for (const file of htmlFiles) {
      const label = relative(PROJECT_ROOT, file);
      const html = readFileSync(file, 'utf8');
      const linked = [...html.matchAll(/<link\b[^>]*href=["']([^"']+\.css)["']/gi)]
        .map(m => relative(PROJECT_ROOT, resolve(dirname(file), m[1])));
      if (!darkDefinedIn.has(label) && !linked.some(l => darkDefinedIn.has(l))) {
        findings.push({ ...base, rule: 'tokens/dark-theme-missing', file: label, selector: null, theme: 'dark', impact: 'High', blocks: true, msg: 'Token setinde koyu tema değerleri var ama sayfada koyu tema tanımı yok ([data-theme="dark"] / prefers-color-scheme: dark)' });
      }
    }
  }

  for (const f of findings) console.log(`  [${f.impact}] ${f.file} ${f.selector || ''}${f.theme ? ` (${f.theme})` : ''} — ${f.msg}`);
  if (!findings.length) console.log(`  [GEÇTİ] ${sources.length} stil kaynağı`);
  finish({ test: TEST, status: findings.some(f => f.blocks) ? 'failed' : 'passed', checked: sources.length, findings });
}

run().catch(err => crash(TEST, err));

/**
 * Yapı testi — ekranlar flows.md ve templates.md ile tutarlı mı (model çağrısı yok, tarayıcı yok).
 * Sözleşme: .claude/references/structure-standards.md
 *
 * Uygulanabilirlik:
 *   - çıktı türü bilinmiyor → çalıştırılamadı; figma → uygulanamaz (Figma'da yapı review'da denetlenir)
 *   - project-state.md → yapi alanı yoksa → uygulanamaz (flow / template katmanını kullanmayan eski proje)
 *   - yapi var ama flows.md / templates.md ya da screens/ HTML'i yoksa → çalıştırılamadı
 *
 * Kontroller (etki · teslimi engeller):
 *   structure/state-missing        template'in zorunlu durumu ekranda data-state olarak yok        High · evet
 *   structure/screen-no-template   ekranın <body>'sinde data-template yok                          High · evet
 *   structure/unknown-template     ekranda / akış adımında templates.md'de olmayan template         High · evet
 *   structure/unknown-flow         data-flow / data-flow-start / Önkoşul / Sonra'da olmayan akış   High · evet
 *   structure/flow-screen-missing  akış adımındaki veya Sonra'daki ekran dosyası yok                High · evet
 *   structure/prereq-cycle         önkoşullarda döngü                                                High · evet
 *   structure/flow-no-entry        akışın Giriş'i yok — akışa ulaşılamaz                             High · evet
 *   structure/empty-dead-end       boş durum bloğunda eylem (a / button) yok — çıkmaz sokak          High · evet
 *   structure/region-missing       template bölgesi ekranda data-region olarak yok                   Medium
 *   structure/screen-no-flow       ekranın <body>'sinde data-flow yok                                Medium
 *   structure/flow-mark-mismatch   ekran akış adımında geçiyor ama data-flow'unda o akış yok        Medium
 *   structure/flow-no-branches     akışta Dallar maddesi yok                                         Medium
 *   structure/no-common-behavior   flows.md'de "## Ortak Davranış" yok                               Medium
 *
 * Ortak ekranlar (birden çok akışta geçen) elle yazılmaz; bu test data-flow işaretlerinden çıkarıp yazdırır.
 *
 * Kullanım:
 *   node structure.mjs        Ortak seçenekler (--root, --format, --json): lib/common.mjs
 */

import { existsSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { projectRoot, outputFormat, readProjectState, findHtmlFiles, finish, crash } from './lib/common.mjs';

const TEST = 'structure';
const ROOT = projectRoot();

const finding = (rule, file, selector, impact, msg) =>
  ({ rule: `structure/${rule}`, file, selector, viewport: null, theme: null, impact, blocks: impact === 'High' || impact === 'Blocker', msg });

// "## " başlıklarına böler: [{ title, body }]
function sections(text) {
  return text.split(/^## /m).slice(1).map(s => {
    const nl = s.indexOf('\n');
    return { title: (nl === -1 ? s : s.slice(0, nl)).trim(), body: nl === -1 ? '' : s.slice(nl + 1) };
  });
}

// Bölüm içindeki üst düzey "- Madde: değer" satırları; değer alt satırlara (girintili) devam edebilir
function items(body) {
  const out = {};
  let key = null;
  for (const line of body.split('\n')) {
    const m = line.match(/^- ([^:]+):\s*(.*)$/);
    if (m) { key = m[1].trim(); out[key] = m[2]; continue; }
    if (key && /^\s+\S/.test(line)) out[key] += '\n' + line;
    else if (line.trim() && !/^\s/.test(line)) key = null;
  }
  return out;
}

const list = v => (v || '').split(',').map(x => x.trim().toLowerCase()).filter(x => x && x !== 'yok');
const flowIds = v => [...(v || '').matchAll(/\bF-\d+\b/g)].map(m => m[0]);
const templateIds = v => [...(v || '').matchAll(/\bT-[A-Z0-9]+(?:-[A-Z0-9]+)*\b/g)].map(m => m[0]);
const screenPaths = v => [...(v || '').matchAll(/screens\/[\w./-]+\.html/g)].map(m => m[0]);

function parseTemplates(text) {
  const map = new Map();
  for (const { title, body } of sections(text)) {
    const id = (title.match(/^(T-[A-Z0-9]+(?:-[A-Z0-9]+)*)/) || [])[1];
    if (!id) continue;
    const it = items(body);
    map.set(id, { regions: list(it['Bölgeler']), states: list(it['Zorunlu durumlar']) });
  }
  return map;
}

function parseFlows(text) {
  const map = new Map();
  let common = false;
  for (const { title, body } of sections(text)) {
    if (/^Ortak Davranış/i.test(title)) { common = true; continue; }
    const id = (title.match(/^(F-\d+)/) || [])[1];
    if (!id) continue;
    const it = items(body);
    map.set(id, {
      prereq: flowIds(it['Önkoşul']),
      entry: (it['Giriş'] || '').trim(),
      steps: it['Adımlar'] || '',
      branches: 'Dallar' in it,
      next: it['Sonra'] || '',
    });
  }
  return { flows: map, common };
}

// data-state="empty" gibi bir öğenin iç HTML'i (aynı etiket adına göre derinlik sayarak)
function elementInner(html, attrIndex) {
  const open = html.lastIndexOf('<', attrIndex);
  const tag = (html.slice(open).match(/^<([a-zA-Z][\w-]*)/) || [])[1];
  if (!tag) return '';
  const start = html.indexOf('>', attrIndex) + 1;
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = start;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index);
  }
  return html.slice(start);
}

function findCycles(flows) {
  const cycles = [];
  const state = new Map();   // 1 ziyarette, 2 bitti
  const stack = [];
  const visit = id => {
    state.set(id, 1); stack.push(id);
    for (const p of flows.get(id)?.prereq || []) {
      if (!flows.has(p)) continue;
      if (state.get(p) === 1) cycles.push([...stack.slice(stack.indexOf(p)), p].join(' → '));
      else if (!state.has(p)) visit(p);
    }
    stack.pop(); state.set(id, 2);
  };
  for (const id of flows.keys()) if (!state.has(id)) visit(id);
  return cycles;
}

function run() {
  const fmt = outputFormat(ROOT);
  if (!fmt.format) return finish({ test: TEST, status: 'not_run', reason: fmt.reason });
  if (fmt.format === 'figma') {
    return finish({ test: TEST, status: 'not_applicable', reason: `çıktı türü figma (${fmt.source}) — yapı review'da denetlenir` });
  }
  const yapi = readProjectState(ROOT)?.yapi;
  if (!yapi) {
    return finish({ test: TEST, status: 'not_applicable', reason: 'project-state.md → yapi yok — flow / template katmanı kullanılmıyor' });
  }
  const missing = ['flows.md', 'templates.md'].filter(f => !existsSync(join(ROOT, f)));
  if (missing.length) {
    return finish({ test: TEST, status: 'not_run', reason: `project-state.md → yapi var ama ${missing.join(', ')} yok` });
  }
  const screens = findHtmlFiles(join(ROOT, 'screens'));
  if (!screens.length) return finish({ test: TEST, status: 'not_run', reason: 'screens/ altında HTML yok — üretim eksik olabilir' });

  const templates = parseTemplates(readFileSync(join(ROOT, 'templates.md'), 'utf8'));
  const { flows, common } = parseFlows(readFileSync(join(ROOT, 'flows.md'), 'utf8'));
  const findings = [];

  // ── flows.md ──
  if (!common) findings.push(finding('no-common-behavior', 'flows.md', null, 'Medium', '"## Ortak Davranış" bölümü yok'));
  const stepScreens = new Map();   // ekran → bu ekranı adımlarında geçiren akışlar
  for (const [id, f] of flows) {
    if (!f.entry) findings.push(finding('flow-no-entry', 'flows.md', id, 'High', `${id} için Giriş yok — akışa ulaşılamaz`));
    if (!f.branches) findings.push(finding('flow-no-branches', 'flows.md', id, 'Medium', `${id} için Dallar yok (en az hata ve iptal)`));
    for (const p of f.prereq) {
      if (!flows.has(p)) findings.push(finding('unknown-flow', 'flows.md', id, 'High', `${id} Önkoşul: ${p} tanımlı değil`));
    }
    for (const t of templateIds(f.steps)) {
      if (!templates.has(t)) findings.push(finding('unknown-template', 'flows.md', id, 'High', `${id} adımında ${t} templates.md'de yok`));
    }
    for (const s of screenPaths(f.steps)) {
      if (!existsSync(join(ROOT, s))) findings.push(finding('flow-screen-missing', 'flows.md', id, 'High', `${id} adımındaki ${s} yok`));
      if (!stepScreens.has(s)) stepScreens.set(s, new Set());
      stepScreens.get(s).add(id);
    }
    for (const n of flowIds(f.next)) {
      if (!flows.has(n)) findings.push(finding('unknown-flow', 'flows.md', id, 'High', `${id} Sonra: ${n} tanımlı değil`));
    }
    for (const s of screenPaths(f.next)) {
      if (!existsSync(join(ROOT, s))) findings.push(finding('flow-screen-missing', 'flows.md', id, 'High', `${id} Sonra: ${s} yok`));
    }
  }
  for (const c of findCycles(flows)) {
    findings.push(finding('prereq-cycle', 'flows.md', c.split(' → ')[0], 'High', `önkoşul döngüsü: ${c}`));
  }

  // ── ekranlar ──
  const sharedScreens = [];
  for (const path of screens) {
    const file = relative(ROOT, path);
    const html = readFileSync(path, 'utf8');
    const body = (html.match(/<body\b[^>]*>/i) || [''])[0];
    const tpl = (body.match(/data-template="([^"]*)"/) || [])[1];
    const flowAttr = (body.match(/data-flow="([^"]*)"/) || [])[1];
    const marked = flowIds(flowAttr);

    if (!flowAttr) findings.push(finding('screen-no-flow', file, 'body', 'Medium', '<body> data-flow taşımıyor'));
    for (const f of marked) {
      if (!flows.has(f)) findings.push(finding('unknown-flow', file, 'body', 'High', `data-flow: ${f} flows.md'de yok`));
    }
    if (marked.length > 1) sharedScreens.push(`${file} ← ${marked.join(', ')}`);
    for (const f of stepScreens.get(file) || []) {
      if (!marked.includes(f)) findings.push(finding('flow-mark-mismatch', file, 'body', 'Medium', `${f} adımında geçiyor ama data-flow'da yok`));
    }
    for (const [, f] of html.matchAll(/data-flow-start="([^"]*)"/g)) {
      if (!flows.has(f)) findings.push(finding('unknown-flow', file, `[data-flow-start="${f}"]`, 'High', `data-flow-start: ${f} flows.md'de yok`));
    }

    if (!tpl) {
      findings.push(finding('screen-no-template', file, 'body', 'High', '<body> data-template taşımıyor'));
    } else if (!templates.has(tpl)) {
      findings.push(finding('unknown-template', file, 'body', 'High', `data-template: ${tpl} templates.md'de yok`));
    } else {
      const t = templates.get(tpl);
      for (const s of t.states) {
        if (!html.includes(`data-state="${s}"`)) {
          findings.push(finding('state-missing', file, `[data-state="${s}"]`, 'High', `${tpl} zorunlu durumu "${s}" ekranda yok`));
        }
      }
      for (const r of t.regions) {
        if (!html.includes(`data-region="${r}"`)) {
          findings.push(finding('region-missing', file, `[data-region="${r}"]`, 'Medium', `${tpl} bölgesi "${r}" ekranda yok`));
        }
      }
    }

    for (const m of html.matchAll(/data-state="empty"/g)) {
      if (!/<(a|button)\b/i.test(elementInner(html, m.index))) {
        findings.push(finding('empty-dead-end', file, '[data-state="empty"]', 'High', 'boş durumda eylem yok — kullanıcıyı sıradaki adıma götüren bağlantı / buton gerekli'));
      }
    }
  }

  for (const f of findings) console.log(`  ${f.blocks ? '✗' : '!'} [${f.impact}] ${f.file}${f.selector ? ` ${f.selector}` : ''} — ${f.msg}`);
  if (sharedScreens.length) console.log(`  Ortak ekranlar:\n${sharedScreens.map(s => `    ${s}`).join('\n')}`);
  console.log(`  ${flows.size} akış, ${templates.size} template, ${screens.length} ekran`);
  finish({ test: TEST, status: findings.some(f => f.blocks) ? 'failed' : 'passed', checked: screens.length, findings });
}

try { run(); } catch (err) { crash(TEST, err); }

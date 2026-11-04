/**
 * Bağlam paketi (model çağrısı yok) — bir çalışmanın agent'larına gereken bilgiyi büyük proje dosyalarından seçip
 * tek, küçük bir dosyaya yazar. Agent'lar büyük dosyaları baştan okumak yerine önce bu paketi okur; pakette olmayan
 * bir bilgi gerekirse büyük dosyada yalnızca o bölümü arar (grep -n + aralık okuma).
 *
 * Kullanım:
 *   node context-pack.mjs --run <çalışma kimliği> --keys "T-CHART,org-chart,F-02" [--request-file <dosya>]
 *                         [--out <dosya>] [--budget <KB>] [--root <proje kökü>]
 *
 *   --keys  virgüllü anahtarlar (ekran dosya adı, template kimliği, akış kimliği, component adı). Bu anahtarlardan
 *           birini başlığında ya da içinde taşıyan akış / template / önceki UX spec bölümleri pakete girer.
 *   --request-file  kullanıcının isteği ve onaylı kararlar (orkestratör yazar); pakete aynen girer.
 *   --budget  paket boyut sınırı (KB, varsayılan 80). Zorunlu bölümler her zaman girer; isteğe bağlı bölümler
 *             (akışlar, template'ler, önceki UX spec'leri, ortak kararlar, açık maddeler) öncelik sırasıyla, sınıra
 *             kadar içerikle girer; sığmayanlar yalnızca "dosya:başlangıç-bitiş satırı + başlık" olarak listelenir.
 *   Varsayılan çıktı: <proje>/.ads/context-<run>.md
 *
 * Pakete girenler (Z: zorunlu, İ: isteğe bağlı — sınıra göre içerik ya da satır adresi):
 *   Z  istek dosyası, project-state.md başlık alanları
 *   Z  spec.md        Bağlayıcı Kararlar + Erişilebilirlik Gereksinimleri + token_directives
 *   Z  design-brief.md  Dial'lar + Seçilen Estetik Yön + Kritik Heuristic'ler
 *   Z  design-plan.md   bu çalışmanın bölümü (ADS_PLAN run=…)
 *   Z  ux-specs.md      bu çalışmanın bölümü
 *   İ  flows.md         Ortak Davranış + anahtarı geçen akışlar
 *   İ  templates.md     Kabuk + anahtarı geçen template'ler
 *   İ  ux-specs.md      anahtarı geçen önceki görev spec'leri, "Ortak" başlıklı karar bölümleri
 *   İ  project-state.md Açık maddeler + Teslim İstisnaları
 *   Z  dosyalar         adında anahtar geçen ekran / component dosyaları ve ortak varlıklar (yol + boyut; içerik değil)
 *
 * Paket kaynaklardan her çağrıda yeniden üretilir; kaynak değişince (ör. planner yazdıktan sonra) tekrar çalıştır.
 * Çıkış kodu: 0 paket yazıldı, 1 kullanım hatası.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';
import { argValue, projectRoot } from './lib/common.mjs';

const root = projectRoot();
const run = argValue('--run');
const keys = (argValue('--keys') || '').split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
const requestFile = argValue('--request-file');
const out = argValue('--out') || join(root, '.ads', `context-${run}.md`);
const BUDGET_KB = Number(argValue('--budget')) || 80;

if (!run) {
  console.error('Kullanım: node context-pack.mjs --run <çalışma kimliği> --keys "T-…,ekran-adı" [--request-file <dosya>] [--budget <KB>]');
  process.exit(1);
}

const read = f => (existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);
const hasKey = text => keys.length > 0 && keys.some(k => text.toLowerCase().includes(k));
const kbOf = t => Buffer.byteLength(t) / 1024;

// Markdown'u verilen seviyedeki başlıklara böler: [{ head, body, line, end }] — ilk parça (başlık öncesi) head = ''.
// line / end: parçanın kaynak metindeki 1 tabanlı ilk ve son satırı (base: metin bir üst parçanın içindeyse onun satırı).
function sections(text, level, base = 1) {
  const re = new RegExp(`^${'#'.repeat(level)} (?!#)`, 'm');
  const parts = [];
  const lines = text.split('\n');
  let cur = { head: '', body: '', line: base };
  lines.forEach((line, i) => {
    if (re.test(line)) { parts.push(cur); cur = { head: line, body: line + '\n', line: base + i }; }
    else cur.body += line + '\n';
  });
  parts.push(cur);
  for (const p of parts) p.end = p.line + Math.max(0, p.body.trimEnd().split('\n').length - 1);
  return parts;
}
const byHead = (text, level, pred) => sections(text, level).filter(s => s.head && pred(s.head)).map(s => s.body.trimEnd());

const required = [];   // [{ title, text }] — her zaman içerikle girer
const optional = [];   // [{ title, src, items: [{ head, body, line, end }] }] — öncelik sırasıyla, sınıra kadar
const missing = [];
const add = (title, text) => { if (text && text.trim()) required.push({ title, text: text.trim() }); };
const addOpt = (title, src, items) => { if (items.length) optional.push({ title, src, items }); };

// İstek
if (requestFile) {
  if (existsSync(requestFile)) add('İstek ve onaylı kararlar', readFileSync(requestFile, 'utf8'));
  else missing.push(`--request-file bulunamadı: ${requestFile}`);
}

// project-state.md
const state = read('project-state.md');
if (state) add('project-state.md — başlık alanları', sections(state, 2)[0].body);
else missing.push('project-state.md yok');

// spec.md
const spec = read('spec.md');
if (spec) {
  add('spec.md — Bağlayıcı Kararlar ve erişilebilirlik',
    byHead(spec, 2, h => /Bağlayıcı Kararlar|Erişilebilirlik/i.test(h)).join('\n\n'));
  const td = spec.match(/<!-- BEGIN:token_directives -->[\s\S]*?<!-- END:token_directives -->/);
  if (td) add('spec.md — token_directives', td[0]);
} else missing.push('spec.md yok');

// design-brief.md
const brief = read('design-brief.md');
if (brief) add('design-brief.md — dial, yön, heuristic',
  byHead(brief, 2, h => /Dial|Estetik Yön|Heuristic/i.test(h)).join('\n\n'));

// design-plan.md — bu çalışmanın bölümü: işareti taşıyan ### bölümü (yoksa ## bölümü)
const plan = read('design-plan.md');
const runMark = new RegExp(`run=${run.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`);
if (plan) {
  const sec = [3, 2].map(l => sections(plan, l).find(s => s.head && /ADS_PLAN/.test(s.body) && runMark.test(s.body))).find(Boolean);
  if (sec) add(`design-plan.md — çalışma ${run}`, sec.body);
  else missing.push(`design-plan.md'de run=${run} bölümü yok (planner henüz yazmadıysa normal)`);
}

// ux-specs.md — bu çalışmanın bölümü (zorunlu); önceki görev spec'leri ve ortak kararlar (isteğe bağlı)
const specs = read('ux-specs.md');
let uxDirect = [], uxCommon = [], broad = [];
if (specs) {
  const all2 = sections(specs, 2);
  const runSec = all2.find(s => s.head && s.head.includes(run));   // "## Çalışma <run>" (işaret başlığın üstünde durur)
  const others = all2.filter(s => s !== runSec);
  if (runSec) add(`ux-specs.md — çalışma ${run}`, runSec.body);
  const subs = others.flatMap(s => sections(s.body, 3, s.line).filter(t => t.head));
  uxCommon = subs.filter(t => /Ortak/i.test(t.head));
  // Önceki görev spec'leri: görev adı (design-plan.md'deki "TASK-xxx: Ad") veya en fazla 2 template sayan "Yapı:" satırı
  // anahtarı taşıyorsa içerik adayıdır; daha geniş kapsamlı (ör. tüm template'leri sayan) spec'ler yalnızca listelenir.
  const titles = Object.fromEntries([...(plan || '').matchAll(/(TASK-\d+):\s*([^\n(]+)/g)].map(m => [m[1], m[2]]));
  for (const t of subs.filter(t => /UX Spec/.test(t.head) && hasKey(t.body))) {
    const id = (t.head.match(/TASK-\d+/) || [''])[0];
    const yapi = (t.body.match(/^- Yapı:(.*)$/m) || ['', ''])[1];
    const tmplCount = (yapi.match(/T-[A-Z]+/g) || []).length;
    if (hasKey(titles[id] || '') || (hasKey(yapi) && tmplCount <= 2)) uxDirect.push(t);
    else broad.push(`${id}${titles[id] ? ` (${titles[id].trim()})` : ''} — ux-specs.md:${t.line}-${t.end}`);
  }
}

// İsteğe bağlı bölümler — öncelik sırası: akışlar, template'ler, ilgili önceki spec'ler, ortak kararlar, açık maddeler
const flows = read('flows.md');
if (flows) addOpt('flows.md — Ortak Davranış ve ilgili akışlar', 'flows.md',
  sections(flows, 2).filter(s => /Ortak Davranış/i.test(s.head) || (s.head && hasKey(s.body))));
const templates = read('templates.md');
if (templates) addOpt('templates.md — Kabuk ve ilgili template\'ler', 'templates.md',
  sections(templates, 2).filter(s => /Kabuk/i.test(s.head) || (s.head && hasKey(s.body))));
addOpt('ux-specs.md — bu ekranla doğrudan ilgili önceki görev spec\'leri', 'ux-specs.md', uxDirect);
addOpt('ux-specs.md — ortak UX kararları (önceki çalışmalar)', 'ux-specs.md', uxCommon);
if (state) addOpt('project-state.md — açık maddeler ve istisnalar', 'project-state.md',
  sections(state, 2).filter(s => /Açık maddeler|Teslim İstisnaları/i.test(s.head)));
if (broad.length) add('ux-specs.md — anahtarı geçen geniş kapsamlı spec\'ler (içerik alınmadı, gerekirse yalnızca o aralığı oku)',
  broad.map(b => `- ${b}`).join('\n'));

// Dosyalar — yol + boyut
function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc); else acc.push(p);
  }
  return acc;
}
const kb = p => `${Math.round(statSync(p).size / 1024)} KB`;
const related = ['screens', 'components'].flatMap(d => walk(join(root, d))).filter(p => hasKey(relative(root, p)));
const shared = walk(join(root, 'assets')).filter(p => /\.(css|js)$/.test(p) && !hasKey(relative(root, p)));
const relatedAssets = walk(join(root, 'assets')).filter(p => /\.(css|js)$/.test(p) && hasKey(relative(root, p)));
const fileList = [
  ...[...related, ...relatedAssets].map(p => `- ${relative(root, p)} (${kb(p)})`),
  ...shared.map(p => `- ${relative(root, p)} (${kb(p)}, ortak — baştan okuma, grep -n ile ilgili aralığı oku)`),
].join('\n');
add('İlgili dosyalar (içerik değil, yol ve boyut)', fileList);

// Sınır: zorunlular her zaman; isteğe bağlılar sığdığı kadar içerikle, kalanı satır adresiyle. Sığdırma sırası:
// 1) başlığında anahtar geçenler (ör. "## T-CHART …", "### UX Spec — TASK-3 · org-chart"), 2) ortak çerçeve
// (Ortak Davranış, Kabuk, Ortak kararlar), 3) yalnızca gövdesinde anahtar geçenler; her kademede blok sırası korunur.
let used = required.reduce((n, b) => n + kbOf(b.text), 0);
const reqKb = used;
const tier = it => (hasKey(it.head) ? 0 : /Ortak|Kabuk/i.test(it.head) ? 1 : 2);
const fits = new Set();
for (const t of [0, 1, 2]) for (const o of optional) for (const it of o.items) {
  if (tier(it) !== t) continue;
  const k = kbOf(it.body.trimEnd());
  if (used + k <= BUDGET_KB) { fits.add(it); used += k; }
}
const optBlocks = [];
let indexed = 0;
for (const o of optional) {
  const full = o.items.filter(it => fits.has(it)).map(it => it.body.trimEnd());
  const idx = o.items.filter(it => !fits.has(it))
    .map(it => `- ${o.src}:${it.line}-${it.end} — ${(it.head || '(başlık öncesi)').replace(/^#+\s*/, '')}`);
  indexed += idx.length;
  let text = full.join('\n\n');
  if (idx.length) text += `${text ? '\n\n' : ''}**Pakete sığmayan bölümler** — gerekirse yalnızca o aralığı oku (\`sed -n 'A,Bp' dosya\`):\n${idx.join('\n')}`;
  optBlocks.push({ title: o.title, text });
}

// Yaz — sıra: istek ve kararlar, plan/spec, sonra isteğe bağlılar, en sonda dosya listesi
const fileBlock = required.find(b => b.title.startsWith('İlgili dosyalar'));
const blocks = [...required.filter(b => b !== fileBlock), ...optBlocks, ...(fileBlock ? [fileBlock] : [])];
const header = `# Bağlam paketi — çalışma ${run}\n\n` +
  `<!-- context-pack.mjs ile üretildi: ${new Date().toISOString()} · anahtarlar: ${keys.join(', ') || '—'} · sınır: ${BUDGET_KB} KB -->\n` +
  `Bu paket, büyük proje dosyalarından bu iş için seçilen bölümlerdir. **Bir kez oku.** Pakette olmayan bir bilgi gerekirse\n` +
  `kaynak dosyada yalnızca o bölümü ara (\`grep -n\`) ya da aşağıdaki satır adresiyle o aralığı oku; dosyanın tamamını okuma.\n`;
const body = blocks.map(b => `\n---\n\n## ${b.title}\n\n${b.text}\n`).join('');
const text = header + body;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, text);

const size = kbOf(text);
console.log(`Bağlam paketi: ${relative(root, out)} — ${size.toFixed(1)} KB (sınır ${BUDGET_KB} KB), ${blocks.length} bölüm` +
  (indexed ? `, ${indexed} bölüm yalnızca satır adresiyle` : ''));
for (const b of blocks) console.log(`  ${kbOf(b.text).toFixed(1).padStart(5)} KB  ${b.title}`);
for (const m of missing) console.log(`  not: ${m}`);
if (reqKb > BUDGET_KB) console.log(`  uyarı: zorunlu bölümler tek başına ${reqKb.toFixed(0)} KB — sınırı aşıyor (Bağlayıcı Kararlar ya da bu çalışmanın spec'i çok uzun)`);

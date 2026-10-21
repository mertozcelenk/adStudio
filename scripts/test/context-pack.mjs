/**
 * Bağlam paketi (model çağrısı yok) — bir çalışmanın agent'larına gereken bilgiyi büyük proje dosyalarından seçip
 * tek, küçük bir dosyaya yazar. Agent'lar büyük dosyaları baştan okumak yerine önce bu paketi okur; pakette olmayan
 * bir bilgi gerekirse büyük dosyada yalnızca o bölümü arar (grep -n + aralık okuma).
 *
 * Kullanım:
 *   node context-pack.mjs --run <çalışma kimliği> --keys "T-CHART,org-chart,F-02" [--request-file <dosya>]
 *                         [--out <dosya>] [--root <proje kökü>]
 *
 *   --keys  virgüllü anahtarlar (ekran dosya adı, template kimliği, akış kimliği, component adı). Bu anahtarlardan
 *           birini başlığında ya da içinde taşıyan akış / template / önceki UX spec bölümleri pakete girer.
 *   --request-file  kullanıcının isteği ve onaylı kararlar (orkestratör yazar); pakete aynen girer.
 *   Varsayılan çıktı: <proje>/.ads/context-<run>.md
 *
 * Pakete girenler:
 *   project-state.md  başlık alanları + Açık maddeler + Teslim İstisnaları
 *   spec.md           Bağlayıcı Kararlar + Erişilebilirlik Gereksinimleri + token_directives
 *   design-brief.md   Dial'lar + Seçilen Estetik Yön + Kritik Heuristic'ler
 *   flows.md          Ortak Davranış + anahtarı geçen akışlar
 *   templates.md      Kabuk + anahtarı geçen template'ler
 *   design-plan.md    bu çalışmanın bölümü (ADS_PLAN run=…)
 *   ux-specs.md       "Ortak" başlıklı karar bölümleri + bu çalışmanın bölümü + anahtarı geçen önceki görev spec'leri
 *   dosyalar          adında anahtar geçen ekran / component dosyaları ve ortak varlıklar (yol + boyut; içerik değil)
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
const WARN_KB = 120;

if (!run) {
  console.error('Kullanım: node context-pack.mjs --run <çalışma kimliği> --keys "T-…,ekran-adı" [--request-file <dosya>]');
  process.exit(1);
}

const read = f => (existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);
const hasKey = text => keys.length > 0 && keys.some(k => text.toLowerCase().includes(k));

// Markdown'u verilen seviyedeki başlıklara böler: [{ head, body }] — ilk parça (başlık öncesi) head = ''
function sections(text, level) {
  const re = new RegExp(`^${'#'.repeat(level)} (?!#)`, 'm');
  const parts = [];
  let cur = { head: '', body: '' };
  for (const line of text.split('\n')) {
    if (re.test(line)) { parts.push(cur); cur = { head: line, body: line + '\n' }; }
    else cur.body += line + '\n';
  }
  parts.push(cur);
  return parts;
}
const byHead = (text, level, pred) => sections(text, level).filter(s => s.head && pred(s.head)).map(s => s.body.trimEnd());

const blocks = [];   // [{ title, text }]
const missing = [];
const add = (title, text) => { if (text && text.trim()) blocks.push({ title, text: text.trim() }); };

// İstek
if (requestFile) {
  if (existsSync(requestFile)) add('İstek ve onaylı kararlar', readFileSync(requestFile, 'utf8'));
  else missing.push(`--request-file bulunamadı: ${requestFile}`);
}

// project-state.md
const state = read('project-state.md');
if (state) {
  add('project-state.md — başlık alanları', sections(state, 2)[0].body);
  add('project-state.md — açık maddeler ve istisnalar',
    byHead(state, 2, h => /Açık maddeler|Teslim İstisnaları/i.test(h)).join('\n\n'));
} else missing.push('project-state.md yok');

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

// flows.md / templates.md
const flows = read('flows.md');
if (flows) add('flows.md — Ortak Davranış ve ilgili akışlar',
  sections(flows, 2).filter(s => /Ortak Davranış/i.test(s.head) || (s.head && hasKey(s.body))).map(s => s.body.trimEnd()).join('\n\n'));
const templates = read('templates.md');
if (templates) add('templates.md — Kabuk ve ilgili template\'ler',
  sections(templates, 2).filter(s => /Kabuk/i.test(s.head) || (s.head && hasKey(s.body))).map(s => s.body.trimEnd()).join('\n\n'));

// design-plan.md — bu çalışmanın bölümü: işareti taşıyan ### bölümü (yoksa ## bölümü)
const plan = read('design-plan.md');
const runMark = new RegExp(`run=${run.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`);
if (plan) {
  const sec = [3, 2].map(l => sections(plan, l).find(s => s.head && /ADS_PLAN/.test(s.body) && runMark.test(s.body))).find(Boolean);
  if (sec) add(`design-plan.md — çalışma ${run}`, sec.body);
  else missing.push(`design-plan.md'de run=${run} bölümü yok (planner henüz yazmadıysa normal)`);
}

// ux-specs.md — ortak kararlar + bu çalışmanın bölümü + anahtarı geçen önceki görev spec'leri
const specs = read('ux-specs.md');
if (specs) {
  const all2 = sections(specs, 2);
  const runSec = all2.find(s => s.head && s.head.includes(run));   // "## Çalışma <run>" (işaret başlığın üstünde durur)
  const others = all2.filter(s => s !== runSec);
  add('ux-specs.md — ortak UX kararları (önceki çalışmalar)',
    others.flatMap(s => byHead(s.body, 3, h => /Ortak/i.test(h))).join('\n\n'));
  if (runSec) add(`ux-specs.md — çalışma ${run}`, runSec.body);
  // Önceki görev spec'leri: görev adı (design-plan.md'deki "TASK-xxx: Ad") veya en fazla 2 template sayan "Yapı:" satırı
  // anahtarı taşıyorsa içerik pakete girer; daha geniş kapsamlı (ör. tüm template'leri sayan) spec'ler yalnızca listelenir.
  const titles = Object.fromEntries([...(plan || '').matchAll(/(TASK-\d+):\s*([^\n(]+)/g)].map(m => [m[1], m[2]]));
  const direct = [], broad = [];
  for (const t of others.flatMap(s => sections(s.body, 3)).filter(t => /UX Spec/.test(t.head) && hasKey(t.body))) {
    const id = (t.head.match(/TASK-\d+/) || [''])[0];
    const yapi = (t.body.match(/^- Yapı:(.*)$/m) || ['', ''])[1];
    const tmplCount = (yapi.match(/T-[A-Z]+/g) || []).length;
    if (hasKey(titles[id] || '') || (hasKey(yapi) && tmplCount <= 2)) direct.push(t.body.trimEnd());
    else broad.push(`${id}${titles[id] ? ` (${titles[id].trim()})` : ''}`);
  }
  if (direct.length) add('ux-specs.md — bu ekranla doğrudan ilgili önceki görev spec\'leri', direct.join('\n\n'));
  if (broad.length) add('ux-specs.md — anahtarı geçen geniş kapsamlı spec\'ler (içerik alınmadı, gerekirse grep -n ile oku)',
    broad.map(b => `- ${b}`).join('\n'));
}

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
const shared = walk(join(root, 'assets')).filter(p => /\.(css|js)$/.test(p));
const fileList = [
  ...related.map(p => `- ${relative(root, p)} (${kb(p)})`),
  ...shared.map(p => `- ${relative(root, p)} (${kb(p)}, ortak — baştan okuma, grep -n ile ilgili aralığı oku)`),
].join('\n');
add('İlgili dosyalar (içerik değil, yol ve boyut)', fileList);

// Yaz
const header = `# Bağlam paketi — çalışma ${run}\n\n` +
  `<!-- context-pack.mjs ile üretildi: ${new Date().toISOString()} · anahtarlar: ${keys.join(', ') || '—'} -->\n` +
  `Bu paket, büyük proje dosyalarından bu iş için seçilen bölümlerdir. Önce bunu oku. Pakette olmayan bir bilgi gerekirse\n` +
  `kaynak dosyada yalnızca o bölümü ara (\`grep -n\`) ve o aralığı oku; dosyanın tamamını okuma.\n`;
const body = blocks.map(b => `\n---\n\n## ${b.title}\n\n${b.text}\n`).join('');
const text = header + body;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, text);

const size = Buffer.byteLength(text) / 1024;
console.log(`Bağlam paketi: ${relative(root, out)} — ${size.toFixed(1)} KB, ${blocks.length} bölüm`);
for (const b of blocks) console.log(`  ${(Buffer.byteLength(b.text) / 1024).toFixed(1).padStart(5)} KB  ${b.title}`);
for (const m of missing) console.log(`  not: ${m}`);
if (size > WARN_KB) console.log(`  uyarı: paket ${WARN_KB} KB'ı aşıyor — anahtarları daralt (en büyük bölümler yukarıda)`);

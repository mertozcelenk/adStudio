/**
 * Kural kimliği denetimi (model çağrısı yok) — rules.md tek kaynak mı, HTML ve Figma kontrol dosyaları onu tutuyor mu.
 *
 * Kullanım:
 *   node check-rules.mjs [--root <repo veya proje kökü>]
 *
 * Kontroller:
 *   1. rules.md'deki her kimlik (`| DM-3 |` tablo satırı) biçime uyuyor ve bir kez tanımlı
 *   2. review-html.md ve review-figma.md her kimliği **kalın** olarak anıyor — nasıl kontrol edildiği ya da
 *      `yalnızca HTML` / `yalnızca Figma` / `Figma'da henüz yok` işareti; rules.md'de olmayan kimlik yok
 *   3. Bir kimlik iki kontrol dosyasında birden "yalnızca …" / "henüz yok" ise uyarı değil hata (kural hiçbir yerde uygulanmıyor)
 *   4. Kontrol dosyaları seviye yazmıyor (`→ **High**` gibi) — seviye yalnızca rules.md'de
 *   5. Kapsamdaki metinlerde anılan her kimlik (`AT-1`, `MW-5`…) rules.md'de var (test-runs/ hariç — eski kayıtlar)
 *
 * Çıkış kodu: 0 sorun yok, 1 sorun var.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { argValue } from './lib/common.mjs';

const root = argValue('--root') ? argValue('--root') : join(import.meta.dirname, '..', '..');
const ref = f => join(root, '.claude', 'references', f);
const problems = [];
const PREFIX = 'SP|TK|A11Y|MD|AT|TL|LY|MB|DM|RK|MO|OD|QA|MW|APP|ST|CP';
const ID_ANY = new RegExp(`(?<![\\w-])(?:${PREFIX})-\\d+(?![\\w-])`, 'g');

for (const f of ['rules.md', 'review-html.md', 'review-figma.md']) {
  if (!existsSync(ref(f))) problems.push(`.claude/references/${f} yok`);
}
if (problems.length) finish();

// 1. rules.md kimlikleri
const rulesText = readFileSync(ref('rules.md'), 'utf8');
const ids = [];
for (const m of rulesText.matchAll(/^\|\s*([A-Z0-9]+-\d+)\s*\|/gm)) {
  const id = m[1];
  if (!new RegExp(`^(?:${PREFIX})-\\d+$`).test(id)) problems.push(`rules.md: "${id}" tanınmayan önek (izinli: ${PREFIX.replaceAll('|', ', ')})`);
  if (ids.includes(id)) problems.push(`rules.md: "${id}" iki kez tanımlı`);
  ids.push(id);
}
const known = new Set(ids);

// 2–4. kontrol dosyaları
const notApplied = {};   // id → kaç dosyada uygulanmıyor
for (const f of ['review-html.md', 'review-figma.md']) {
  const text = readFileSync(ref(f), 'utf8');
  const lines = text.split('\n');
  const seen = new Set();
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/\*\*([A-Z0-9]+-\d+)\*\*/g)) {
      const id = m[1];
      if (!known.has(id)) problems.push(`${f}:${i + 1}: "${id}" rules.md'de yok`);
      seen.add(id);
      if (/yalnızca (HTML|Figma)|henüz yok/.test(line.slice(m.index))) notApplied[id] = (notApplied[id] || 0) + 1;
    }
    if (/→\s*\*\*(Blocker|High|Medium|Nitpick)\*\*/.test(line)) {
      problems.push(`${f}:${i + 1}: seviye yazılmış — seviye yalnızca rules.md'de (kimliği an)`);
    }
  });
  for (const id of ids) if (!seen.has(id)) problems.push(`${f}: ${id} anılmıyor (nasıl kontrol edildiği ya da "yalnızca …" / "henüz yok" işareti gerekli)`);
}
for (const [id, n] of Object.entries(notApplied)) {
  if (n >= 2) problems.push(`${id}: iki kontrol dosyasında da uygulanmıyor — kural hiçbir yerde kontrol edilmez`);
}

// 5. metinlerdeki kimlik atıfları
const TEXT = new Set(['.md', '.mjs', '.js', '.json']);
function* walk(dir) {
  for (const e of readdirSync(dir)) {
    if (['node_modules', '.git', 'snapshots', 'test-runs', 'fixtures'].includes(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (TEXT.has(extname(e))) yield p;
  }
}
const scope = ['.claude', 'scripts', 'README.md', 'TESTING.md', 'CONTRIBUTING.md'].map(x => join(root, x)).filter(existsSync);
for (const p of scope.flatMap(x => (statSync(x).isDirectory() ? [...walk(x)] : [x]))) {
  const rel = relative(root, p);
  if (rel === 'scripts/test/check-rules.mjs' || rel.startsWith('.claude/commands/')) continue;
  readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(ID_ANY)) {
      if (!known.has(m[0])) problems.push(`${rel}:${i + 1}: "${m[0]}" rules.md'de yok`);
    }
  });
}

finish();

function finish() {
  for (const p of problems) console.log(`  ✗ ${p}`);
  console.log(problems.length
    ? `[BAŞARISIZ] check-rules — ${problems.length} sorun`
    : `[GEÇTİ] check-rules — ${ids.length} kural; HTML ve Figma kontrol dosyaları tutarlı`);
  process.exit(problems.length ? 1 : 0);
}

/**
 * Araştırma dosyası denetimi (model çağrısı yok) — research/market-analysis.md sözleşmeye uyuyor mu
 * (.claude/references/research-file.md) ve spec.md → Bağlayıcı Kararlar ile tutarlı mı.
 *
 * Kullanım:
 *   node research-file.mjs [--root <proje kökü>]   → projedeki dosya; dosya yoksa atlanır (çıkış 0)
 *   node research-file.mjs --selftest              → fixtures/research-good (sorunsuz) ve research-bad (beklenen sorunlar)
 *
 * Kontroller:
 *   1. Başlık: `# …` + tarih (YYYY-AA-GG), pazar, is_modeli
 *   2. Her `## R<n> · …` bloğu: field / status / decision izinli değerlerde, proposal ve basis dolu; R<n> bir kez;
 *      decision `modified` ise `final:` dolu; en fazla 12 blok
 *   3. spec.md varsa → Bağlayıcı Kararlar'daki her `[Araştırma]` satırı var olan bir R<n>'e gider ve o blok
 *      `accepted` / `modified`; `accepted` / `modified` her blok bir satırla anılır; aynı R<n> iki kez geçmez
 *      (`pending` / `rejected` spec'e girmemiştir)
 *
 * Çıkış kodu: 0 sorun yok, 1 sorun var.
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { argValue } from './lib/common.mjs';

const FIELDS = new Set(['audience', 'persona', 'positioning', 'constraint', 'scope_candidate', 'tone', 'aesthetic_direction', 'design_principle', 'ux_pitfall', 'reference_screen']);
const STATUSES = new Set(['confirmed', 'hypothesis', 'stale']);
const DECISIONS = new Set(['pending', 'accepted', 'modified', 'rejected']);
const MAX_BLOCKS = 12;
const FILE = 'research/market-analysis.md';

/** @returns {{problems: string[], blocks: number, skipped: boolean}} */
export function checkResearch(root) {
  const problems = [];
  const path = join(root, FILE);
  if (!existsSync(path)) return { problems, blocks: 0, skipped: true };
  const lines = readFileSync(path, 'utf8').split('\n');
  const at = i => `${FILE}:${i + 1}`;

  // 1. başlık
  if (!/^# \S/.test(lines[0] ?? '')) problems.push(`${at(0)}: ilk satır "# <başlık>" değil`);
  const headEnd = lines.findIndex(l => /^## /.test(l));
  const head = lines.slice(0, headEnd < 0 ? lines.length : headEnd);
  const headVal = k => head.map(l => l.match(new RegExp(`^${k}:\\s*(.*)$`))).find(Boolean)?.[1].trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(headVal('tarih') ?? '')) problems.push(`${FILE}: başlıkta "tarih: YYYY-AA-GG" yok`);
  for (const k of ['pazar', 'is_modeli']) if (!headVal(k)) problems.push(`${FILE}: başlıkta "${k}:" yok`);

  // 2. bloklar
  const starts = lines.map((l, i) => (/^## /.test(l) ? i : -1)).filter(i => i >= 0);
  const byId = new Map();
  for (const [bi, s] of starts.entries()) {
    const m = lines[s].match(/^## R(\d+) · \S/);
    if (!m) { problems.push(`${at(s)}: blok başlığı "## R<n> · <başlık>" biçiminde değil`); continue; }
    const id = Number(m[1]);
    if (byId.has(id)) problems.push(`${at(s)}: R${id} iki kez tanımlı`);
    const body = lines.slice(s + 1, starts[bi + 1] ?? lines.length);
    const val = k => body.map(l => l.match(new RegExp(`^${k}:\\s*(.*)$`))).find(Boolean)?.[1].trim();
    const field = val('field'), status = val('status'), decision = val('decision');
    if (!FIELDS.has(field)) problems.push(`${at(s)}: R${id} field "${field ?? ''}" izinli değil`);
    if (!STATUSES.has(status)) problems.push(`${at(s)}: R${id} status "${status ?? ''}" izinli değil`);
    if (!DECISIONS.has(decision)) problems.push(`${at(s)}: R${id} decision "${decision ?? ''}" izinli değil`);
    for (const k of ['proposal', 'basis']) if (!val(k)) problems.push(`${at(s)}: R${id} "${k}:" boş ya da yok`);
    if (decision === 'modified' && !val('final')) problems.push(`${at(s)}: R${id} decision modified ama "final:" yok`);
    if (!byId.has(id)) byId.set(id, { decision });
  }
  if (byId.size > MAX_BLOCKS) problems.push(`${FILE}: ${byId.size} öneri var, en fazla ${MAX_BLOCKS}`);

  // 3. spec.md ile tutarlılık
  const specPath = join(root, 'spec.md');
  if (existsSync(specPath)) {
    const spec = readFileSync(specPath, 'utf8');
    const section = spec.split(/^## Bağlayıcı Kararlar\s*$/m)[1]?.split(/^## /m)[0] ?? '';
    const cited = new Map();
    for (const l of section.split('\n').filter(l => l.includes('[Araştırma]'))) {
      const m = l.match(/research\/market-analysis\.md R(\d+)/);
      if (!m) { problems.push(`spec.md: [Araştırma] satırında "research/market-analysis.md R<n>" kaynağı yok: ${l.trim().slice(0, 70)}`); continue; }
      const id = Number(m[1]);
      cited.set(id, (cited.get(id) ?? 0) + 1);
    }
    for (const [id, n] of cited) {
      const b = byId.get(id);
      if (!b) problems.push(`spec.md: [Araştırma] R${id} araştırma dosyasında yok`);
      else if (!['accepted', 'modified'].includes(b.decision)) problems.push(`spec.md: R${id} "${b.decision}" ama Bağlayıcı Kararlar'da var`);
      if (n > 1) problems.push(`spec.md: R${id} Bağlayıcı Kararlar'da ${n} kez geçiyor`);
    }
    for (const [id, b] of byId) {
      if (['accepted', 'modified'].includes(b.decision) && !cited.has(id)) problems.push(`spec.md: R${id} "${b.decision}" ama Bağlayıcı Kararlar'da yok`);
    }
  }
  return { problems, blocks: byId.size, skipped: false };
}

function selftest() {
  const dir = n => join(import.meta.dirname, 'fixtures', n);
  let bad = 0;
  const good = checkResearch(dir('research-good'));
  if (good.problems.length) { bad++; for (const p of good.problems) console.log(`  ✗ research-good: ${p}`); }
  const expected = JSON.parse(readFileSync(join(dir('research-bad'), 'expected-problems.json'), 'utf8')).problems;
  const got = checkResearch(dir('research-bad')).problems;
  for (const e of expected) if (!got.some(p => p.includes(e))) { bad++; console.log(`  ✗ research-bad: beklenen sorun bulunamadı: "${e}"`); }
  for (const p of got) if (!expected.some(e => p.includes(e))) { bad++; console.log(`  ✗ research-bad: beklenmeyen sorun: ${p}`); }
  console.log(bad
    ? `[BAŞARISIZ] research-file selftest — ${bad} sapma`
    : `[GEÇTİ] research-file — iyi fixture temiz, kötü fixture'da ${expected.length} beklenen sorun bulundu`);
  process.exit(bad ? 1 : 0);
}

if (process.argv.includes('--selftest')) selftest();
else {
  const root = argValue('--root') ?? process.cwd();
  const { problems, blocks, skipped } = checkResearch(root);
  if (skipped) { console.log('[ATLANDI] research-file — research/market-analysis.md yok'); process.exit(0); }
  for (const p of problems) console.log(`  ✗ ${p}`);
  console.log(problems.length ? `[BAŞARISIZ] research-file — ${problems.length} sorun` : `[GEÇTİ] research-file — ${blocks} öneri`);
  process.exit(problems.length ? 1 : 0);
}

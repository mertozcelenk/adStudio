/**
 * Fixture regresyon testi — her fixture'ın expected.json'ındaki beklentiyi testlerin gerçek çıktısıyla
 * kural + öğe bazında karşılaştırır. Toplam bulgu sayısına bakılmaz: bir bulgunun kaybolup yerine
 * başka bir yanlış alarmın gelmesi de yakalanır.
 *
 * Kullanım:
 *   node check-fixtures.mjs                → fixtures/ altındaki tüm expected.json'lar
 *   node check-fixtures.mjs tells-bad tokens-bad   → yalnızca adı verilen fixture'lar
 *
 * expected.json:
 *   {
 *     "tests": {
 *       "<test adı>": {
 *         "args": ["--tablet"],              (isteğe bağlı)
 *         "status": "passed | failed | not_run | not_applicable",
 *         "findings": [
 *           { "rule", "file", "selector", "viewport", "theme",   ← eşleşme anahtarı (hepsi birebir)
 *             "impact", "blocks",                               ← eşleşen bulguda ayrıca karşılaştırılır
 *             "count": 1,                                       ← aynı anahtarla kaç bulgu beklenir
 *             "note": "..." }                                   ← yalnızca açıklama
 *         ]
 *       }
 *     }
 *   }
 * Aynı seçici farklı dosya, viewport veya temada ayrı kayıttır.
 */

import { spawnSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

const HERE = import.meta.dirname;
const FIXTURES = resolve(HERE, 'fixtures');
const KEY_FIELDS = ['rule', 'file', 'selector', 'viewport', 'theme'];

const keyOf = f => KEY_FIELDS.map(k => JSON.stringify(f[k] ?? null)).join('|');
const showKey = f => KEY_FIELDS.map(k => `${k}=${f[k] ?? '–'}`).join(' ');

function runTest(fixtureDir, test, args, tmp) {
  const out = join(tmp, `${test}.json`);
  spawnSync(process.execPath, [join(HERE, `${test}.mjs`), '--root', fixtureDir, '--json', out, ...(args || [])], { encoding: 'utf8' });
  if (!existsSync(out)) return { status: 'failed', reason: 'sonuç dosyası yok (çöktü)', findings: [] };
  return JSON.parse(readFileSync(out, 'utf8'));
}

function compare(expected, actual) {
  const problems = [];
  if (expected.status !== actual.status) {
    problems.push(`sonuç: beklenen ${expected.status}, gelen ${actual.status}${actual.reason ? ` (${actual.reason})` : ''}`);
  }

  const groups = new Map();
  for (const f of actual.findings) {
    const k = keyOf(f);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(f);
  }

  for (const e of expected.findings || []) {
    const k = keyOf(e);
    const got = groups.get(k) || [];
    const want = e.count ?? 1;
    if (got.length !== want) problems.push(`adet ${got.length} ≠ beklenen ${want}: ${showKey(e)}`);
    for (const f of got) {
      if (e.impact !== undefined && f.impact !== e.impact) problems.push(`etki ${f.impact} ≠ beklenen ${e.impact}: ${showKey(e)}`);
      if (e.blocks !== undefined && f.blocks !== e.blocks) problems.push(`teslimi engeller ${f.blocks} ≠ beklenen ${e.blocks}: ${showKey(e)}`);
    }
    groups.delete(k);
  }
  for (const rest of groups.values()) {
    for (const f of rest) problems.push(`beklenmeyen bulgu: ${showKey(f)} — ${f.msg}`);
  }
  return problems;
}

const only = process.argv.slice(2);
const fixtures = readdirSync(FIXTURES)
  .filter(d => existsSync(join(FIXTURES, d, 'expected.json')))
  .filter(d => only.length === 0 || only.includes(d));

const unknown = only.filter(d => !fixtures.includes(d));
if (fixtures.length === 0 || unknown.length) {
  console.log(unknown.length ? `expected.json bulunamadı: ${unknown.join(', ')}` : 'expected.json içeren fixture yok');
  process.exit(2);
}

const tmp = mkdtempSync(join(tmpdir(), 'ads-fixtures-'));
let failed = 0;
for (const name of fixtures) {
  const dir = join(FIXTURES, name);
  const spec = JSON.parse(readFileSync(join(dir, 'expected.json'), 'utf8'));
  for (const [test, expected] of Object.entries(spec.tests)) {
    const problems = compare(expected, runTest(dir, test, expected.args, tmp));
    const n = (expected.findings || []).reduce((sum, e) => sum + (e.count ?? 1), 0);
    if (problems.length === 0) {
      console.log(`  [GEÇTİ]      ${name} · ${test} (${expected.status}, ${n} beklenen bulgu)`);
    } else {
      failed++;
      console.log(`  [BAŞARISIZ]  ${name} · ${test}`);
      for (const p of problems) console.log(`      ${p}`);
    }
  }
}
rmSync(tmp, { recursive: true, force: true });
console.log(`\n${failed === 0 ? 'Tüm fixture beklentileri karşılandı.' : `${failed} beklenti karşılanmadı.`}`);
process.exit(failed === 0 ? 0 : 1);

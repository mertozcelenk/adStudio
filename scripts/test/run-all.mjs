/**
 * Tüm testleri çalıştırır, sonuçları tek tabloda ve test-results.json'da toplar.
 * Bir test başarısız olsa, çökse veya zaman aşımına uğrasa da diğerleri çalışır.
 *
 * Genel çıkış kodu (öncelik sırasıyla):
 *   1  herhangi bir zorunlu test başarısız (aynı anda çalıştırılamayan test olsa da)
 *   2  başarısız yok ama zorunlu bir test çalıştırılamadı (doğrulama boşluğu)
 *   0  uygulanan zorunlu testlerin hepsi geçti
 * 0, "teslime hazır" demek değildir — yalnızca uygulanan otomatik testlerin geçtiğini söyler.
 *
 * Rol: "zorunlu" testler genel kodu belirler. "inceleme" rolündeki visual her zaman çalışır ve sonucu
 * test-results.json → visual_review'a yazılır; genel kodu değiştirmez ama incelenmemiş görsel fark ya da
 * yapılamamış karşılaştırma notlarda ve teslim kapısında (ads-design-strategy Adım 6, koşul 4) görünür.
 *
 * Kullanım:
 *   node run-all.mjs                         → proje kökü, çıktı türü project-state.md'den
 *   node run-all.mjs --root <dizin>          → başka bir proje kökü
 *   node run-all.mjs --format html|figma     → çıktı türünü açıkça ver
 *   node run-all.mjs --out <dosya>           → sonuç dosyası (varsayılan <kök>/test-results.json)
 *   node run-all.mjs --timeout <sn>          → test başına süre sınırı (varsayılan 300)
 *   node run-all.mjs --suite <json>          → test listesini değiştir (run-all'ın kendi testleri için)
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { resolve, join, relative } from 'path';
import { argValue, projectRoot, outputFormat, STATUS_LABEL } from './lib/common.mjs';

const HERE = import.meta.dirname;

// visual "inceleme" rolündedir: baseline ilk onaylı teslimden sonra oluşur; fark kasıtlı bir değişiklik de
// olabileceği için genel kodu otomatik belirlemez, ama her fark incelenip kabul edilmeli ya da düzeltilmelidir.
const DEFAULT_SUITE = [
  { name: 'accessibility', script: 'accessibility.mjs', required: true },
  { name: 'tokens',        script: 'tokens.mjs',        required: true },
  { name: 'responsive',    script: 'responsive.mjs',    required: true },
  { name: 'tells',         script: 'tells.mjs',         required: true },
  { name: 'structure',     script: 'structure.mjs',     required: true },
  { name: 'visual',        script: 'visual.mjs',        required: false, role: 'review' },
];

function loadSuite() {
  const suitePath = argValue('--suite');
  if (!suitePath) return DEFAULT_SUITE;
  const base = resolve(suitePath, '..');
  return JSON.parse(readFileSync(suitePath, 'utf8')).map(t => ({ ...t, script: resolve(base, t.script) }));
}

function runOne(test, root, format, timeoutMs, tmp) {
  const jsonPath = join(tmp, `${test.name}.json`);
  const args = [resolve(HERE, test.script), '--root', root, '--json', jsonPath, ...(test.args || [])];
  if (format) args.push('--format', format);

  return new Promise(done => {
    const started = Date.now();
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', d => { output += d; });
    child.stderr.on('data', d => { output += d; });

    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);

    child.on('close', code => {
      clearTimeout(timer);
      const seconds = Math.round((Date.now() - started) / 100) / 10;
      const base = { name: test.name, required: test.required, role: test.role, exitCode: code, seconds, output };
      if (timedOut) {
        return done({ ...base, status: 'not_run', reason: `zaman aşımı (${timeoutMs / 1000} sn)`, findings: [] });
      }
      if (!existsSync(jsonPath)) {
        return done({ ...base, status: 'failed', reason: `test çöktü (çıkış kodu ${code}, sonuç dosyası yok)`, findings: [] });
      }
      try {
        const r = JSON.parse(readFileSync(jsonPath, 'utf8'));
        done({ ...base, status: r.status, reason: r.reason, checked: r.checked, findings: r.findings || [] });
      } catch (err) {
        done({ ...base, status: 'failed', reason: `test çöktü (sonuç dosyası okunamadı: ${err.message})`, findings: [] });
      }
    });
  });
}

function overall(results) {
  const required = results.filter(r => r.required);
  if (required.some(r => r.status === 'failed')) return 1;
  if (required.some(r => r.status === 'not_run')) return 2;
  return 0;
}

async function run() {
  const root = projectRoot();
  const fmt = outputFormat(root);
  const timeoutMs = Number(argValue('--timeout') || 300) * 1000;
  const outPath = resolve(argValue('--out') || join(root, 'test-results.json'));
  const tmp = mkdtempSync(join(tmpdir(), 'ads-test-'));

  console.log(`Proje: ${root}`);
  console.log(`Çıktı türü: ${fmt.format ? `${fmt.format} (${fmt.source})` : `bilinmiyor — ${fmt.reason}`}\n`);

  const results = [];
  for (const test of loadSuite().map(t => ({ role: t.required ? 'required' : (t.role || 'review'), ...t }))) {
    process.stdout.write(`  ${test.name.padEnd(14)} … `);
    const r = await runOne(test, root, argValue('--format'), timeoutMs, tmp);
    results.push(r);
    console.log(`${STATUS_LABEL[r.status]}${r.reason ? ` — ${r.reason}` : ''}`);
  }
  rmSync(tmp, { recursive: true, force: true });

  const code = overall(results);
  const blocking = results.flatMap(r => r.findings.filter(f => f.blocks).map(f => ({ test: r.name, ...f })));
  const warnings = results.reduce((n, r) => n + r.findings.filter(f => !f.blocks).length, 0);

  const notes = [];
  const visual = results.find(r => r.role === 'review' || r.name === 'visual');
  let visualReview = null;
  if (visual) {
    const pending = visual.findings.filter(f => f.review).map(f => f.file);
    visualReview = {
      status: visual.status,
      compared: visual.status === 'passed' || visual.status === 'failed',
      pending_review: pending,
      reason: visual.reason || null,
    };
    if (visual.status === 'not_run') notes.push(`Görsel karşılaştırma yapılamadı: ${visual.reason}.`);
    if (pending.length) notes.push(`Görsel fark var (${pending.length} dosya): her fark incelenmeli — kasıtlıysa kabul edip baseline'ı güncelle (visual.mjs --update --only …), değilse düzelt. İncelenmemiş fark varken teslime hazır denmez.`);
  }
  if (fmt.format === 'figma') notes.push('HTML kontrolleri uygulanamaz; Figma doğrulaması ayrıca gerekli (ads-design-reviewer + ads-ux-reviewer).');
  if (code === 2) notes.push('Zorunlu bir doğrulama çalıştırılamadı — sonuç "geçti" sayılmaz.');
  notes.push('Çıkış kodu 0 "teslime hazır" demek değildir: açık teslim engeli olmaması ve çıktı türünün gerektirdiği incelemenin tamamlanması da gerekir.');

  const report = {
    root,
    format: fmt.format,
    format_source: fmt.source || null,
    generated_at: new Date().toISOString(),
    exit_code: code,
    blocking_findings: blocking.length,
    visual_review: visualReview,
    warnings,
    notes,
    tests: results.map(({ output, ...r }) => r),
  };
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('\n| Test | Rol | Sonuç | Engel | Uyarı | Süre |');
  console.log('|---|---|---|---|---|---|');
  for (const r of results) {
    const b = r.findings.filter(f => f.blocks).length;
    console.log(`| ${r.name} | ${r.required ? 'zorunlu' : 'inceleme'} | ${STATUS_LABEL[r.status]} | ${b} | ${r.findings.length - b} | ${r.seconds} sn |`);
  }
  if (blocking.length) {
    console.log('\nTeslimi engelleyen bulgular:');
    for (const f of blocking.slice(0, 40)) {
      const where = [f.file, f.viewport, f.theme].filter(Boolean).join(' · ');
      console.log(`  [${f.test}] [${f.impact}] ${where} — ${f.msg}`);
    }
    if (blocking.length > 40) console.log(`  … ve ${blocking.length - 40} tane daha (test-results.json)`);
  }
  console.log('');
  for (const n of notes) console.log(`Not: ${n}`);
  const shown = relative(process.cwd(), outPath);
  console.log(`\nGenel çıkış kodu: ${code} — sonuç dosyası: ${shown.startsWith('..') ? outPath : shown}`);
  process.exit(code);
}

run().catch(err => { console.error(err); process.exit(1); });

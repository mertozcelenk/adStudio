/**
 * run-all.mjs öz-testi — çalıştırıcının hata durumlarını sahte testlerle dener.
 *
 * Kullanım:
 *   node run-all.selftest.mjs
 *
 * Denenen durumlar:
 *   - bir test başarısız → diğerleri yine çalışır, genel kod 1
 *   - bir test çöker → "başarısız (çöktü)", diğerleri çalışır
 *   - bir test zaman aşımına uğrar → "çalıştırılamadı (zaman aşımı)", genel kod 2
 *   - zorunlu test çalıştırılamadı → genel kod 2
 *   - başarısız + çalıştırılamadı birlikte → genel kod 1, ikisi de sonuç dosyasında
 *   - zorunlu olmayan test başarısız → genel kodu etkilemez
 *   - cikti_formati: figma → HTML testleri uygulanamaz, genel kod 0, not "Figma doğrulaması ayrıca gerekli"
 *   - project-state.md yok → zorunlu testler çalıştırılamadı, genel kod 2
 *   - visual: baseline yokken "karşılaştırma yapılamadı" notu (genel kod değişmez); değişmeyen sayfa geçer;
 *     fark yakalanır ve .diff.png gerçek fark haritasıdır (kırmızı = raporlanan); farklar "inceleme bekliyor"
 *     listesine girer; --update --only yalnızca kabul edilen dosyanın baseline'ını günceller
 *   - check-names: yazım hatalı atıf, name ≠ dosya adı, eski ad kalıntısı, eksik commands kopyası
 *   - check-run: teslim üst sınırı (testler, istisnalar, görsel inceleme), istisna biçimi, project-state alanları
 *   - plan-gate: önceki çalışmadan kalan / kimliksiz COMPLETE işareti reddedilir, eksik görev ve başlıksız
 *     spec yakalanır, doğru çalışma geçer ve önceki çalışmanın bölümü korunmuş olur
 */

import { spawnSync } from 'child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync, existsSync } from 'fs';
import { PNG } from 'pngjs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

const HERE = import.meta.dirname;
const FAKE = resolve(HERE, 'fixtures', 'runner', 'fake');
const tmp = mkdtempSync(join(tmpdir(), 'ads-runner-'));
let failures = 0;

function runAll(name, { suite, root, extra = [] }) {
  const out = join(tmp, `${name}.json`);
  const args = [join(HERE, 'run-all.mjs'), '--root', root, '--out', out, ...extra];
  if (suite) {
    const suitePath = join(tmp, `${name}.suite.json`);
    writeFileSync(suitePath, JSON.stringify(suite.map(([n, required]) => ({ name: n, script: join(FAKE, `${n}.mjs`), required }))));
    args.push('--suite', suitePath);
  }
  const res = spawnSync(process.execPath, args, { encoding: 'utf8' });
  return { code: res.status, report: JSON.parse(readFileSync(out, 'utf8')), stdout: res.stdout };
}

function check(name, cond, detail) {
  console.log(`  ${cond ? '[GEÇTİ]    ' : '[BAŞARISIZ]'} ${name}${cond ? '' : ` — ${detail}`}`);
  if (!cond) failures++;
}

const statusOf = (report, n) => report.tests.find(t => t.name === n)?.status;

// Sahte testler proje köküne bakmaz; kök olarak boş bir dizin yeterli
const emptyRoot = mkdtempSync(join(tmp, 'root-'));

{
  const { code, report } = runAll('fail-continues', { root: emptyRoot, suite: [['fail', true], ['pass', true]] });
  check('başarısız test sonrası diğerleri çalışıyor', statusOf(report, 'pass') === 'passed', JSON.stringify(report.tests));
  check('başarısız → genel kod 1', code === 1, `kod ${code}`);
  check('engelleyen bulgu sonuç dosyasında', report.blocking_findings === 1, `blocking ${report.blocking_findings}`);
}
{
  const { code, report } = runAll('crash', { root: emptyRoot, suite: [['crash', true], ['pass', true]] });
  const t = report.tests.find(x => x.name === 'crash');
  check('çöken test "başarısız (çöktü)"', t.status === 'failed' && /çöktü/.test(t.reason), JSON.stringify(t));
  check('çökme sonrası diğerleri çalışıyor', statusOf(report, 'pass') === 'passed', '');
  check('çökme → genel kod 1', code === 1, `kod ${code}`);
}
{
  const { code, report } = runAll('timeout', { root: emptyRoot, suite: [['hang', true], ['pass', true]], extra: ['--timeout', '2'] });
  const t = report.tests.find(x => x.name === 'hang');
  check('takılan test "çalıştırılamadı (zaman aşımı)"', t.status === 'not_run' && /zaman aşımı/.test(t.reason), JSON.stringify(t));
  check('zaman aşımı sonrası diğerleri çalışıyor', statusOf(report, 'pass') === 'passed', '');
  check('zaman aşımı → genel kod 2 (başarılı değil)', code === 2, `kod ${code}`);
}
{
  const { code } = runAll('notrun', { root: emptyRoot, suite: [['notrun', true], ['pass', true]] });
  check('zorunlu test çalıştırılamadı → genel kod 2', code === 2, `kod ${code}`);
}
{
  const { code, report } = runAll('mixed', { root: emptyRoot, suite: [['notrun', true], ['fail', true]] });
  check('başarısız + çalıştırılamadı → genel kod 1', code === 1, `kod ${code}`);
  check('karma durumda iki ayrıntı da sonuç dosyasında',
    statusOf(report, 'notrun') === 'not_run' && statusOf(report, 'fail') === 'failed', JSON.stringify(report.tests));
}
{
  const { code } = runAll('optional', { root: emptyRoot, suite: [['fail', false], ['pass', true]] });
  check('zorunlu olmayan test başarısız → genel kod 0', code === 0, `kod ${code}`);
}

// Gerçek testlerle: uygulanabilirlik project-state.md'den
const figmaRoot = mkdtempSync(join(tmp, 'figma-'));
writeFileSync(join(figmaRoot, 'project-state.md'), '# Deneme — Project State\n\ncikti_formati: figma\nplatform: web\n');
{
  const { code, report } = runAll('figma', { root: figmaRoot });
  const required = report.tests.filter(t => t.required);
  check('figma: tüm HTML testleri uygulanamaz', report.tests.every(t => t.status === 'not_applicable'), JSON.stringify(report.tests.map(t => [t.name, t.status])));
  check('figma: genel kod 0', code === 0, `kod ${code}`);
  check('figma: not "Figma doğrulaması ayrıca gerekli"', report.notes.some(n => n.includes('Figma doğrulaması ayrıca gerekli')), JSON.stringify(report.notes));
  check('figma: zorunlu test sayısı > 0', required.length > 0, '');
}
rmSync(join(figmaRoot, 'project-state.md'));
{
  const { code, report } = runAll('no-state', { root: figmaRoot });
  check('project-state.md yok: zorunlu testler çalıştırılamadı',
    report.tests.filter(t => t.required).every(t => t.status === 'not_run'), JSON.stringify(report.tests.map(t => [t.name, t.status])));
  check('project-state.md yok: genel kod 2', code === 2, `kod ${code}`);
}

// visual: gerçek piksel karşılaştırması, fark haritası ve inceleme politikası
{
  const root = mkdtempSync(join(tmp, 'visual-'));
  const snaps = join(root, '_snapshots');
  mkdirSync(join(root, 'screens'));
  writeFileSync(join(root, 'project-state.md'), 'cikti_formati: html\n');
  const page = color => `<!doctype html><html><body style="margin:0"><div style="width:200px;height:100px;background:${color}"></div><p style="font:16px system-ui">Sabit metin</p></body></html>`;
  writeFileSync(join(root, 'screens', 'a.html'), page('#336699'));
  writeFileSync(join(root, 'screens', 'b.html'), page('#669933'));
  const visual = (...extra) => {
    const out = join(root, '_v.json');
    spawnSync(process.execPath, [join(HERE, 'visual.mjs'), '--root', root, '--snapshots', snaps, '--json', out, ...extra]);
    return JSON.parse(readFileSync(out, 'utf8'));
  };
  const suitePath = join(root, '_suite.json');
  writeFileSync(suitePath, JSON.stringify([{ name: 'visual', script: join(HERE, 'visual.mjs'), required: false, role: 'review', args: ['--snapshots', snaps] }]));
  const runVisualSuite = name => {
    const out = join(tmp, `${name}.json`);
    const res = spawnSync(process.execPath, [join(HERE, 'run-all.mjs'), '--root', root, '--out', out, '--suite', suitePath], { encoding: 'utf8' });
    return { code: res.status, report: JSON.parse(readFileSync(out, 'utf8')) };
  };

  let vr = runVisualSuite('visual-nobaseline');
  check('visual: baseline yokken "karşılaştırma yapılamadı" açıkça yazılıyor',
    vr.report.visual_review?.compared === false && vr.report.notes.some(n => n.startsWith('Görsel karşılaştırma yapılamadı')), JSON.stringify(vr.report.notes));
  check('visual: baseline yokluğu genel kodu değiştirmiyor (inceleme rolü)', vr.code === 0, `kod ${vr.code}`);

  visual('--update');
  check('visual: değişmeyen sayfa geçiyor', visual().status === 'passed', '');

  writeFileSync(join(root, 'screens', 'a.html'), page('#993366'));
  writeFileSync(join(root, 'screens', 'b.html'), page('#336699'));
  const r = visual();
  const diffPath = join(snaps, 'screens__a.diff.png');
  check('visual: değişen bölgeler yakalanıyor (2 dosya)', r.status === 'failed' && r.findings.length === 2, JSON.stringify(r));
  if (existsSync(diffPath)) {
    const map = PNG.sync.read(readFileSync(diffPath));
    let red = 0;
    for (let i = 0; i < map.data.length; i += 4) {
      if (map.data[i] === 255 && map.data[i + 1] === 0 && map.data[i + 2] === 0) red++;
    }
    const fa = r.findings.find(f => f.file === 'screens/a.html');
    const reported = Number((fa?.msg.match(/^(\d+) piksel/) || [])[1]);
    check('visual: fark haritası gerçek fark (kırmızı = raporlanan)', red > 0 && red === reported, `kırmızı ${red}, raporlanan ${reported}`);
    check('visual: fark yalnızca değişen kutuda (≤ 200×100)', red <= 200 * 100, `kırmızı ${red}`);
  } else {
    check('visual: fark haritası yazıldı', false, diffPath);
  }

  vr = runVisualSuite('visual-diff');
  check('visual: farklar "inceleme bekliyor" listesinde', JSON.stringify(vr.report.visual_review?.pending_review) === JSON.stringify(['screens/a.html', 'screens/b.html']), JSON.stringify(vr.report.visual_review));
  check('visual: fark notu teslim uyarısı içeriyor', vr.report.notes.some(n => n.includes('İncelenmemiş fark varken teslime hazır denmez')), JSON.stringify(vr.report.notes));

  visual('--update', '--only', 'screens/a.html');
  vr = runVisualSuite('visual-accept-a');
  check('visual: yalnızca kabul edilen dosyanın baseline\'ı güncellendi (b hâlâ bekliyor)',
    JSON.stringify(vr.report.visual_review?.pending_review) === JSON.stringify(['screens/b.html']), JSON.stringify(vr.report.visual_review));
  check('visual: --only bilinmeyen dosyada çalıştırılamadı', visual('--update', '--only', 'screens/yok.html').status === 'not_run', '');
}

// plan-gate: plan ↔ UX spec geçiş kontrolü
{
  const root = mkdtempSync(join(tmp, 'gate-'));
  writeFileSync(join(root, 'design-plan.md'), [
    '# Deneme — Design Plan', '## İlk Tasarım', '<!-- ADS_PLAN run=20261001-0900 tasks=TASK-001,TASK-002 -->',
    '- [x] TASK-001: Button', '- [x] TASK-002: Input', "## Geliştirme Backlog'u", '### İterasyon 20261002-1415 — Filtre',
    '<!-- ADS_PLAN run=20261002-1415 tasks=TASK-003,TASK-004 -->', '- [ ] TASK-003: Chip', '- [ ] TASK-004: Filtre çubuğu',
  ].join('\n'));
  const oldSection = ['<!-- UX_SPEC_STATUS: COMPLETE run=20261001-0900 tasks=TASK-001,TASK-002 -->', '## Çalışma 20261001-0900',
    '### UX Spec — TASK-001', 'a', '### UX Spec — TASK-002', 'b'];
  const specs = (...lines) => writeFileSync(join(root, 'ux-specs.md'), ['# UX Specs', ...lines].join('\n'));
  const gate = runId => spawnSync(process.execPath, [join(HERE, 'plan-gate.mjs'), '--root', root, '--run', runId], { encoding: 'utf8' });

  specs(...oldSection);
  let r = gate('20261002-1415');
  check('plan-gate: önceki çalışmanın COMPLETE işareti reddediliyor', r.status === 1 && /eski işaret kabul edilmez/.test(r.stdout), r.stdout);

  specs('<!-- UX_SPEC_STATUS: COMPLETE -->', '### UX Spec — TASK-003', '### UX Spec — TASK-004');
  r = gate('20261002-1415');
  check('plan-gate: kimliksiz (eski biçim) COMPLETE işareti reddediliyor', r.status === 1, r.stdout);

  specs(...oldSection, '<!-- UX_SPEC_STATUS: COMPLETE run=20261002-1415 tasks=TASK-003 -->', '## Çalışma 20261002-1415', '### UX Spec — TASK-003', 'c');
  r = gate('20261002-1415');
  check('plan-gate: eksik görev yakalanıyor (TASK-004)', r.status === 1 && /eksik görevler: TASK-004/.test(r.stdout), r.stdout);

  specs(...oldSection, '<!-- UX_SPEC_STATUS: COMPLETE run=20261002-1415 tasks=TASK-003,TASK-004 -->', '## Çalışma 20261002-1415', '### UX Spec — TASK-003', 'c');
  r = gate('20261002-1415');
  check('plan-gate: işarette olup başlığı olmayan spec yakalanıyor', r.status === 1 && /başlığı olmayan görevler: TASK-004/.test(r.stdout), r.stdout);

  specs(...oldSection, '<!-- UX_SPEC_STATUS: COMPLETE run=20261002-1415 tasks=TASK-003,TASK-004 -->', '## Çalışma 20261002-1415',
    '### UX Spec — TASK-003', 'c', '### UX Spec — TASK-004', 'd');
  r = gate('20261002-1415');
  check('plan-gate: tam ve güncel çalışma geçiyor', r.status === 0, r.stdout);
  check('plan-gate: önceki çalışmanın bölümü korunmuş ve hâlâ geçerli', gate('20261001-0900').status === 0, '');
  check('plan-gate: --run yoksa çalıştırılamadı (2)', spawnSync(process.execPath, [join(HERE, 'plan-gate.mjs'), '--root', root]).status === 2, '');
}

// check-run: çalışma sonrası denetim (model çağrısı yok)
{
  const mk = (name, { state = 'cikti_formati: html\nplatform: web\ntoken_dosyasi: yok\n', exceptions = [], results } = {}) => {
    const root = mkdtempSync(join(tmp, `cr-${name}-`));
    writeFileSync(join(root, 'project-state.md'), `# X\n\n${state}\n## Teslim İstisnaları\n\n${exceptions.join('\n')}\n`);
    if (results) writeFileSync(join(root, 'test-results.json'), JSON.stringify(results));
    return root;
  };
  const cr = (root, claimed) => spawnSync(process.execPath, [join(HERE, 'check-run.mjs'), '--root', root, ...(claimed ? ['--claimed', claimed] : [])], { encoding: 'utf8' });
  const ok = { exit_code: 0, visual_review: { pending_review: [] } };
  const ex = '- [2026-10-03] B1 ölü buton — gerekçe: v2 — onay: kullanıcı';

  check('check-run: geçen testler + istisnasız → "Teslime hazır" iddiası geçer', cr(mk('a', { results: ok }), 'Teslime hazır').status === 0, '');
  let r = cr(mk('b', { results: { exit_code: 1 } }), 'Teslime hazır');
  check('check-run: başarısız test + istisnasız → "Teslime hazır" iddiası reddedilir', r.status === 1 && /üst sınırı aşıyor/.test(r.stdout), r.stdout);
  r = cr(mk('c', { results: { exit_code: 1 }, exceptions: [ex] }), 'İstisna onayıyla teslim edilebilir');
  check('check-run: başarısız test + istisna → "İstisna onayıyla" geçer, uyarı verir', r.status === 0 && r.stdout.includes('!'), r.stdout);
  check('check-run: istisna varken "Teslime hazır" reddedilir', cr(mk('d', { results: ok, exceptions: [ex] }), 'Teslime hazır').status === 1, '');
  check('check-run: incelenmemiş görsel fark → "Teslime hazır" reddedilir',
    cr(mk('e', { results: { exit_code: 0, visual_review: { pending_review: ['screens/a.html'] } } }), 'Teslime hazır').status === 1, '');
  check('check-run: HTML çıktısında test-results.json yoksa "Teslime hazır" reddedilir', cr(mk('f'), 'Teslime hazır').status === 1, '');
  check('check-run: gerekçesiz istisna satırı yakalanır', cr(mk('g', { results: ok, exceptions: ['- [2026-10-03] B1 ölü buton'] })).status === 1, '');
  check('check-run: geçersiz cikti_formati yakalanır', cr(mk('h', { state: 'cikti_formati: pdf\nplatform: web\ntoken_dosyasi: yok\n', results: ok })).status === 1, '');
  check('check-run: tanınmayan teslim iddiası yakalanır', cr(mk('i', { results: ok }), 'Quick mod: reviewer çalışmadı').status === 1, '');
  {
    const root = mk('k');
    writeFileSync(join(root, 'design-plan.md'), '<!-- ADS_PLAN run=20261001-0900 tasks=TASK-001 -->\n<!-- ADS_PLAN run=20261003-1200 tasks=TASK-002 -->\n');
    writeFileSync(join(root, 'ux-specs.md'), '<!-- UX_SPEC_STATUS: COMPLETE run=20261001-0900 tasks=TASK-001 -->\n### UX Spec — TASK-001\n');
    const stopped = cr(root, "Adım 4'e geçilmedi — ads-design-builder başlatılmadı");
    check('check-run: geçiş kontrolünde bilerek durma beklenen duruş sayılır', stopped.status === 0 && stopped.stdout.includes('beklenen duruş'), stopped.stdout);
    check('check-run: aynı plan-gate hatası teslim iddiasında hata sayılır', cr(root, 'Teslime hazır değil').status === 1, '');
    writeFileSync(join(root, 'test-results.json'), JSON.stringify(ok));
    check('check-run: builder çalışmışken (test-results var) durma iddiası hata', cr(root, 'ads-design-builder başlatılmadı').status === 1, '');
  }
  check('check-run: üst sınırın altındaki iddia serbest', cr(mk('j', { results: ok }), 'Teslime hazır değil').status === 0, '');
}

// check-names: ad tutarlılığı
{
  const root = mkdtempSync(join(tmp, 'names-'));
  mkdirSync(join(root, '.claude', 'skills'), { recursive: true });
  mkdirSync(join(root, '.claude', 'agents'), { recursive: true });
  const skill = (n, body = '') => writeFileSync(join(root, '.claude', 'skills', `${n}.md`), `---\nname: ${n}\n---\n${body}\n`);
  const agent = (n, body = '') => writeFileSync(join(root, '.claude', 'agents', `${n}.md`), `---\nname: ${n}\n---\n${body}\n`);
  const cn = () => spawnSync(process.execPath, [join(HERE, 'check-names.mjs'), '--root', root], { encoding: 'utf8' });
  skill('ads-iterate', '`/ads-iterate` → `ads-design-builder`; durum: /tmp/ads-iterate-a3f9.json; sahne .ads-stage');
  agent('ads-design-builder');
  check('check-names: tutarlı adlar geçer', cn().status === 0, cn().stdout);
  skill('ads-check', '`/ads-iterat` ile devam');
  check('check-names: yazım hatalı komut atfı yakalanır', /bilinmeyen ad "ads-iterat"/.test(cn().stdout), cn().stdout);
  skill('ads-check', '');
  writeFileSync(join(root, '.claude', 'agents', 'ads-ux-reviewer.md'), '---\nname: ux-reviewer\n---\n');
  check('check-names: dosya adıyla uyuşmayan name yakalanır', /name "ux-reviewer"/.test(cn().stdout), cn().stdout);
  agent('ads-ux-reviewer', 'Bu kural LDF\'den kaldı');
  check('check-names: eski ad kalıntısı yakalanır', /eski ad kalıntısı/.test(cn().stdout), cn().stdout);
  agent('ads-ux-reviewer', '');
  mkdirSync(join(root, '.claude', 'commands'));
  writeFileSync(join(root, '.claude', 'commands', 'ads-iterate.md'), 'x');
  check('check-names: commands kopyasında eksik skill yakalanır', /commands\/ads-check\.md eksik/.test(cn().stdout), cn().stdout);
}

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${failures === 0 ? 'Tüm durumlar geçti.' : `${failures} durum başarısız.`}`);
process.exit(failures === 0 ? 0 : 1);

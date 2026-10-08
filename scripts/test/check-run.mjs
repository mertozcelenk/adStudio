/**
 * Çalışma sonrası denetim — bir adStudio çalışmasının bıraktığı dosyaları model çağrısı olmadan denetler.
 * Sabit kuralların (dosya, durum, çalışma kimliği, teslim kararı) kanıtı buradan alınır; ajan davranışı
 * gerektiren kontroller için ayrıca hedefe özel küçük senaryolar kullanılır.
 *
 * Kullanım:
 *   node check-run.mjs [--root <proje>] [--claimed "Teslime hazır" | "İstisna onayıyla teslim edilebilir" | "Teslime hazır değil"]
 *
 * Kontroller:
 *   1. project-state.md başlık alanları: cikti_formati (html|figma), platform (web|app|both), token_dosyasi
 *   2. plan-gate: son ADS_PLAN çalışması + ux-specs.md'de işareti olan çalışmalar (UX spec varsa)
 *   3. ## Teslim İstisnaları satırları: tarih, engel, "gerekçe:" ve "onay:" içeriyor
 *   4. Teslim üst sınırı (test-results.json + istisnalar + görsel inceleme):
 *        HTML ve test-results.json yok              → Teslime hazır değil (doğrulama yok)
 *        exit_code ≠ 0, istisna yok                 → Teslime hazır değil
 *        exit_code ≠ 0, istisna var                 → İstisna onayıyla teslim edilebilir (istisnaların açık
 *                                                     engelleri kapsadığı ayrıca doğrulanmalı — uyarı)
 *        incelenmemiş görsel fark                   → Teslime hazır değil
 *        exit_code 0, istisna var                   → İstisna onayıyla teslim edilebilir
 *        aksi halde                                 → Teslime hazır
 *      Reviewer'ların açık engelleri dosyada tutulmadığı için bu bir **üst sınırdır**: iddia bunu aşarsa hata,
 *      altında kalması serbesttir.
 *   --claimed verilirse iddia üst sınırla karşılaştırılır.
 *   İddia pipeline'ın bilerek durduğunu söylüyorsa ("başlatılmadı", "geçilmedi", "durduruldu") bu bir teslim iddiası
 *   değildir: üst sınır karşılaştırması yapılmaz; son çalışmanın plan-gate hatası beklenen duruşun nedeni olarak
 *   raporlanır, hata sayılmaz. test-results.json oluşmuşsa (builder çalışmış demektir) durma iddiası hata sayılır.
 *
 * Çıkış kodu: 0 sorun yok, 1 kural ihlali (ayrıntı çıktıda).
 */

import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { argValue, projectRoot, readProjectState } from './lib/common.mjs';

const root = projectRoot();
const claimedText = argValue('--claimed') || '';
const stoppedClaim = /başlatılmadı|geçilmedi|durduruldu|durdu\b/i.test(claimedText);
const notes = [];
const problems = [];
const warnings = [];
const read = name => (existsSync(join(root, name)) ? readFileSync(join(root, name), 'utf8') : null);

const LEVELS = ['Teslime hazır değil', 'İstisna onayıyla teslim edilebilir', 'Teslime hazır'];
const levelOf = text => {
  const t = (text || '').toLocaleLowerCase('tr');
  if (t.includes('hazır değil')) return 0;
  if (t.includes('istisna')) return 1;
  if (t.includes('teslime hazır')) return 2;
  return null;
};

// 1. project-state.md
const state = readProjectState(root);
if (!state) problems.push('project-state.md yok');
else {
  if (!['html', 'figma'].includes((state.cikti_formati || '').toLowerCase())) problems.push(`cikti_formati geçersiz: "${state.cikti_formati ?? ''}"`);
  if (!['web', 'app', 'both'].includes((state.platform || '').toLowerCase())) problems.push(`platform geçersiz: "${state.platform ?? ''}"`);
  if (!state.token_dosyasi) problems.push('token_dosyasi alanı yok');
  else if (state.token_dosyasi.toLowerCase() !== 'yok' && !existsSync(join(root, state.token_dosyasi))) problems.push(`token_dosyasi bulunamadı: ${state.token_dosyasi}`);
}

// 2. plan-gate — her çalışma
const plan = read('design-plan.md');
// UX spec yalnızca deep mod / büyük özellik çalışmalarında üretilir (quick mod ve küçük değişiklikte yok).
// Denetlenen: son plan çalışması (builder'ın en son kullandığı) + ux-specs.md'de işareti olan her çalışma.
const planRuns = plan ? [...plan.matchAll(/<!--\s*ADS_PLAN\s+run=(\S+)/g)].map(m => m[1]) : [];
const specText = read('ux-specs.md');
const specRuns = specText ? [...specText.matchAll(/UX_SPEC_STATUS:\s*COMPLETE\s+run=(\S+)/g)].map(m => m[1]) : [];
const runs = [...new Set([...planRuns.slice(-1), ...specRuns])];
if (runs.length && specText !== null) {
  for (const run of runs) {
    const res = spawnSync(process.execPath, [join(import.meta.dirname, 'plan-gate.mjs'), '--root', root, '--run', run], { encoding: 'utf8' });
    if (res.status !== 0) {
      const detail = `plan-gate run=${run}: ${res.stdout.split('\n').filter(l => l.includes('✗')).map(l => l.trim()).join(' | ')}`;
      if (stoppedClaim && run === planRuns[planRuns.length - 1]) notes.push(`beklenen duruş — ${detail}`);
      else problems.push(detail);
    }
  }
}

// 3. Teslim İstisnaları
const stateText = read('project-state.md') || '';
const exSection = (stateText.split(/^## Teslim İstisnaları\s*$/m)[1] || '').split(/^## /m)[0];
const exceptions = exSection.split('\n').filter(l => /^\s*-\s/.test(l));
for (const line of exceptions) {
  if (!/\d{4}-\d{2}-\d{2}/.test(line) || !/gerekçe:/i.test(line) || !/onay:/i.test(line)) {
    problems.push(`istisna satırı eksik (tarih / gerekçe: / onay: gerekli): ${line.trim().slice(0, 100)}`);
  }
}

// 4. Teslim üst sınırı
const results = read('test-results.json') ? JSON.parse(read('test-results.json')) : null;
const isHtml = (state?.cikti_formati || '').toLowerCase() === 'html';
let ceiling = 2;
let why = 'zorunlu testler geçti, istisna yok';
if (isHtml && !results) { ceiling = 0; why = 'test-results.json yok — otomatik doğrulama yapılmamış'; }
else if (results && results.exit_code !== 0) {
  if (exceptions.length) { ceiling = 1; why = `genel kod ${results.exit_code}, ${exceptions.length} istisna kayıtlı`; warnings.push('Açık engellerin istisnalarla kapsandığı dosyadan doğrulanamaz — reviewer raporuyla karşılaştır.'); }
  else { ceiling = 0; why = `genel kod ${results.exit_code}, istisna yok`; }
}
else if (results?.visual_review?.pending_review?.length) { ceiling = 0; why = `incelenmemiş görsel fark: ${results.visual_review.pending_review.join(', ')}`; }
else if (exceptions.length) { ceiling = 1; why = `${exceptions.length} istisna kayıtlı`; }

const claimed = stoppedClaim ? null : argValue('--claimed');
const claimedLevel = claimed ? levelOf(claimed) : null;
if (stoppedClaim) {
  if (results) problems.push('iddia pipeline\'ın durduğunu söylüyor ama test-results.json var (builder çalışmış)');
  else notes.push('pipeline bilerek durdu — teslim iddiası yok, üst sınır karşılaştırılmadı');
}
if (claimed && claimedLevel === null) problems.push(`iddia edilen teslim durumu tanınmadı: "${claimed}"`);
if (claimedLevel !== null && claimedLevel > ceiling) {
  problems.push(`iddia "${LEVELS[claimedLevel]}" üst sınırı aşıyor: en fazla "${LEVELS[ceiling]}" (${why})`);
}

console.log(`Teslim üst sınırı: ${LEVELS[ceiling]} — ${why}`);
if (claimedText) console.log(`İddia: ${claimedText}`);
for (const n of notes) console.log(`  · ${n}`);
for (const w of warnings) console.log(`  ! ${w}`);
for (const p of problems) console.log(`  ✗ ${p}`);
console.log(problems.length ? `[BAŞARISIZ] check-run — ${problems.length} sorun` : '[GEÇTİ] check-run');
process.exit(problems.length ? 1 : 0);

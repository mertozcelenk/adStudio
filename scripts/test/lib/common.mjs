/**
 * Test betiklerinin ortak sonuç sözleşmesi.
 *
 * Her test dört sonuçtan birini verir:
 *   passed          geçti                — teslimi engelleyen bulgu yok (uyarı olabilir)
 *   failed          başarısız            — en az bir teslimi engelleyen bulgu var
 *   not_run         çalıştırılamadı      — test zorunlu ama girdi / bağımlılık eksik (doğrulama boşluğu)
 *   not_applicable  uygulanamaz          — çıktı türü bu testi gerektirmiyor (ör. Figma projesinde HTML testi)
 *
 * Uygulanabilirlik dosya yokluğundan çıkarılmaz. Kaynak sırası:
 *   1. --format html|figma   (komut satırı)
 *   2. project-state.md → cikti_formati   (orkestratör pipeline başında yazar)
 *   3. ikisi de yoksa → not_run ("çıktı türü bilinmiyor")
 *
 * Bulgu alanları: rule, file, selector, viewport, theme, impact, blocks, msg
 *   impact  Blocker | High | Medium | Nitpick  — yalnızca işlevsel / erişilebilirlik etkisi
 *   blocks  true | false                       — teslimi engeller mi (Blocker, High ve şirket kuralları)
 *
 * Çıkış kodu (tek test): passed / not_applicable → 0, failed → 1, not_run → 2.
 * --json <dosya> verilirse sonuç ayrıca bu dosyaya yazılır (run-all.mjs bunu okur).
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';

export const STATUS_LABEL = {
  passed: 'GEÇTİ',
  failed: 'BAŞARISIZ',
  not_run: 'ÇALIŞTIRILAMADI',
  not_applicable: 'UYGULANAMAZ',
};

const EXIT_CODE = { passed: 0, not_applicable: 0, failed: 1, not_run: 2 };

export function argValue(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : null;
}

// --root verilmezse proje kökü scripts/test'in iki üstüdür
export function projectRoot() {
  const root = argValue('--root');
  return root ? resolve(root) : resolve(import.meta.dirname, '..', '..', '..');
}

export function findHtmlFiles(dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findHtmlFiles(full));
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results.sort();
}

export function projectHtmlFiles(root) {
  return [
    ...findHtmlFiles(join(root, 'components')),
    ...findHtmlFiles(join(root, 'screens')),
  ];
}

// project-state.md'deki "anahtar: değer" satırlarını okur
export function readProjectState(root) {
  const path = join(root, 'project-state.md');
  if (!existsSync(path)) return null;
  const state = {};
  for (const [, key, value] of readFileSync(path, 'utf8').matchAll(/^\s*([a-z_]+):\s*(.*?)\s*$/gm)) {
    if (!(key in state)) state[key] = value;
  }
  return state;
}

// Çıktı türünü açık bir girdiden belirler: { format, source } veya { format: null, reason }
export function outputFormat(root) {
  const flag = argValue('--format');
  if (flag) return { format: flag, source: '--format' };
  const state = readProjectState(root);
  if (!state) return { format: null, reason: 'project-state.md yok — çıktı türü bilinmiyor' };
  const value = (state.cikti_formati || '').toLowerCase();
  if (value !== 'html' && value !== 'figma') {
    return { format: null, reason: 'project-state.md → cikti_formati tanımsız (html | figma bekleniyor)' };
  }
  return { format: value, source: 'project-state.md' };
}

// HTML çıktısı gerektiren testler için ortak ön kontrol. Devam edilecekse null döner,
// edilmeyecekse sonuç nesnesi döner (finish ile bitirilir).
export function htmlPrecheck(test, root) {
  const fmt = outputFormat(root);
  if (!fmt.format) return { test, status: 'not_run', reason: fmt.reason, findings: [] };
  if (fmt.format === 'figma') {
    return { test, status: 'not_applicable', reason: `çıktı türü figma (${fmt.source}) — HTML kontrolleri uygulanamaz`, findings: [] };
  }
  if (projectHtmlFiles(root).length === 0) {
    return { test, status: 'not_run', reason: 'çıktı türü html ama components/ ve screens/ altında HTML yok — üretim eksik olabilir', findings: [] };
  }
  return null;
}

// Uygulama ekranları (<body data-platform="ios|android">) cihaz ölçüsünde çizilir ve yalnızca bu ölçüde test edilir
export const APP_VIEWPORTS = {
  ios:     { width: 390, height: 844 },
  android: { width: 412, height: 915 },
};

export function bodyPlatform(html) {
  return (html.match(/<body[^>]*data-platform="(web|ios|android)"/) || [])[1] || null;
}

export const blocksByImpact = impact => impact === 'Blocker' || impact === 'High';

// Bulgulardan sonucu türetir: teslimi engelleyen bulgu varsa failed
export function statusFrom(findings) {
  return findings.some(f => f.blocks) ? 'failed' : 'passed';
}

export function finish(result) {
  const out = {
    test: result.test,
    status: result.status,
    reason: result.reason || null,
    checked: result.checked ?? null,
    findings: result.findings || [],
  };
  const jsonPath = argValue('--json');
  if (jsonPath) writeFileSync(jsonPath, JSON.stringify(out, null, 2));
  const tag = STATUS_LABEL[out.status];
  console.log(`\n[${tag}] ${out.test}${out.reason ? ` — ${out.reason}` : ''}`);
  process.exit(EXIT_CODE[out.status]);
}

// Yakalanmamış hata: test çöktü sayılır (run-all JSON bulamazsa da aynı sonuca varır)
export function crash(test, err) {
  console.error(err);
  const jsonPath = argValue('--json');
  if (jsonPath) {
    writeFileSync(jsonPath, JSON.stringify({
      test, status: 'failed', reason: `test çöktü: ${String(err?.message || err).split('\n')[0]}`, findings: [],
    }, null, 2));
  }
  process.exit(1);
}

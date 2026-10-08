/**
 * Plan → UX spec geçiş kontrolü (ads-design-strategy Adım 3c → 4, ads-iterate "Uygula").
 * Builder'ın başlayabilmesi için bu çalışmanın planı ve UX spec'leri birbirini tutmalı.
 *
 * Kullanım:
 *   node plan-gate.mjs --run 20261002-1415 [--root <proje kökü>]
 *
 * Kontroller:
 *   1. design-plan.md'de <!-- ADS_PLAN run=<kimlik> tasks=… --> satırı var         → plan görevleri
 *   2. ux-specs.md'de <!-- UX_SPEC_STATUS: COMPLETE run=<kimlik> tasks=… --> var     → spec görevleri
 *      (başka bir run değeri taşıyan, önceki çalışmadan kalmış işaret kabul edilmez)
 *   3. plan görevleri = spec görevleri ve bu çalışmanın bölümünde her görev için "### UX Spec — TASK-XXX" var
 *
 * Çıkış kodu: 0 geçti, 1 eksik/uyumsuz (ayrıntı çıktıda), 2 girdi eksik (--run yok).
 * --json <dosya> verilirse sonuç ayrıca yazılır.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { argValue, projectRoot } from './lib/common.mjs';

const root = projectRoot();
const run = argValue('--run');

function done(result) {
  const json = argValue('--json');
  if (json) writeFileSync(json, JSON.stringify(result, null, 2));
  for (const p of result.problems) console.log(`  ✗ ${p}`);
  console.log(result.ok ? `[GEÇTİ] plan-gate run=${run} — ${result.planTasks.length} görev, hepsinin UX spec'i var`
                        : `[BAŞARISIZ] plan-gate run=${run} — builder başlatılmamalı`);
  process.exit(result.ok ? 0 : 1);
}

if (!run) {
  console.log('[ÇALIŞTIRILAMADI] --run <çalışma kimliği> gerekli');
  process.exit(2);
}

const read = name => (existsSync(join(root, name)) ? readFileSync(join(root, name), 'utf8') : null);
const taskList = s => s.split(',').map(t => t.trim()).filter(Boolean);
const problems = [];
let planTasks = [];
let specTasks = [];
let specFound = false;

const plan = read('design-plan.md');
if (!plan) {
  problems.push('design-plan.md yok');
} else {
  const m = [...plan.matchAll(/<!--\s*ADS_PLAN\s+run=(\S+)\s+tasks=([^\s>]*)\s*-->/g)].find(x => x[1] === run);
  if (!m) problems.push(`design-plan.md'de bu çalışmanın işareti yok (<!-- ADS_PLAN run=${run} … -->) — planner'ı yeniden çalıştır`);
  else planTasks = taskList(m[2]);
}

const specs = read('ux-specs.md');
if (!specs) {
  problems.push('ux-specs.md yok — ads-ux-designer tamamlanmamış');
} else {
  const markers = [...specs.matchAll(/<!--\s*UX_SPEC_STATUS:\s*COMPLETE(?:\s+run=(\S+))?(?:\s+tasks=([^\s>]*))?\s*-->/g)];
  const mine = markers.find(x => x[1] === run);
  if (!mine) {
    const others = markers.map(x => x[1] || '(kimliksiz)').join(', ');
    problems.push(`ux-specs.md'de bu çalışmanın COMPLETE işareti yok${others ? ` (yalnızca başka çalışmalar: ${others} — eski işaret kabul edilmez)` : ''}`);
  } else {
    specFound = true;
    specTasks = taskList(mine[2] || '');
    // Bu çalışmanın bölümü: işaretten bir sonraki COMPLETE işaretine kadar
    const start = mine.index;
    const next = markers.find(x => x.index > start);
    const section = specs.slice(start, next ? next.index : undefined);
    const headed = new Set([...section.matchAll(/^###\s*UX Spec\s*[—–-]\s*(TASK-\d+)/gm)].map(x => x[1]));
    const noHeading = specTasks.filter(t => !headed.has(t));
    if (noHeading.length) problems.push(`işarette listelenen ama bölümde "### UX Spec — …" başlığı olmayan görevler: ${noHeading.join(', ')}`);
  }
}

if (planTasks.length && specFound) {
  const missing = planTasks.filter(t => !specTasks.includes(t));
  const extra = specTasks.filter(t => !planTasks.includes(t));
  if (missing.length) problems.push(`UX spec'i eksik görevler: ${missing.join(', ')} — ads-ux-designer'ı yalnızca bunlar için yeniden çalıştır`);
  if (extra.length) problems.push(`planda olmayan spec görevleri: ${extra.join(', ')} — plan ile spec ayrışmış, kullanıcıya bildir`);
}

done({ run, ok: problems.length === 0, planTasks, specTasks, problems });

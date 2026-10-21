/**
 * Hazır ölçüm betiği (model çağrısı yok) — builder ve reviewer'lar kendi geçici Playwright betiklerini yazmak yerine
 * bunu çalıştırır. Bir ekranı açar, adımları uygular, odak / konum / görünürlük ölçer, isterse ekran görüntüsü ve
 * axe taraması alır; sonucu kısa JSON olarak yazar.
 *
 * Kullanım:
 *   node probe.mjs --file screens/org-chart.html [--query "?person=yk5"] [--viewport 1440x900,375x812]
 *                  [--theme light|dark|both] [--steps "<adım>; <adım>; …"] [--measure "#a, .b"]
 *                  [--shot <dosya.png>] [--axe] [--root <proje kökü>]
 *
 * Adımlar (noktalı virgülle ayrılır; her adımdan sonra odaktaki öğe kaydedilir):
 *   click:<seçici>        tıkla                   press:<tuş>            klavye (Tab, Enter, Space, ArrowDown, Escape…)
 *   fill:<seçici>=<metin> alana yaz              hover:<seçici>         üzerine gel
 *   focus:<seçici>        odakla                  wait:<ms>              bekle
 *   fullscreen:<seçici>   öğeyi tam ekran yap     exitfullscreen         tam ekrandan çık
 *   scroll:<seçici>       görünür alana kaydır
 *
 * --measure  her seçici için: kutu (x, y, w, h), görünür mü (display / visibility / boyut), viewport'ta mı,
 *            tam ekran öğesinin içinde mi (fullscreen açıksa). İlk eşleşen öğe ölçülür.
 * --shot     her viewport × tema için ayrı dosya: <ad>-<genişlik>-<tema>.png. Görüntüyü yalnızca gerçekten
 *            bakman gerekiyorsa oku; çoğu soruyu JSON çıktısı yanıtlar (ekran görüntüsü sınırı agent talimatında).
 * --axe      adımlardan sonraki hâlde axe taraması (ihlal kimliği, etki, düğüm sayısı, ilk seçici).
 *
 * Tema: prefers-color-scheme taklit edilir ve <html data-theme> ayarlanır (build-html.md sözleşmesi).
 * Çıkış kodu: 0 ölçüm yapıldı (adım hatası JSON'da `error` olarak görünür), 1 kullanım / açılış hatası.
 */

import { chromium } from 'playwright';
import { existsSync } from 'fs';
import { resolve, join, basename, dirname } from 'path';
import { argValue, projectRoot } from './lib/common.mjs';

const root = projectRoot();
const file = argValue('--file');
if (!file) {
  console.error('Kullanım: node probe.mjs --file screens/x.html [--steps "click:#a; press:Tab"] [--measure "#a"] [--shot x.png] [--axe]');
  process.exit(1);
}
const path = resolve(root, file);
if (!existsSync(path)) { console.error(`Dosya yok: ${path}`); process.exit(1); }

const query = argValue('--query') || '';
const viewports = (argValue('--viewport') || '1440x900').split(',').map(v => {
  const [w, h] = v.trim().split('x').map(Number);
  return { width: w, height: h || 900 };
});
const themeArg = argValue('--theme') || 'light';
const themes = themeArg === 'both' ? ['light', 'dark'] : [themeArg];
const steps = (argValue('--steps') || '').split(';').map(s => s.trim()).filter(Boolean);
const measures = (argValue('--measure') || '').split(',').map(s => s.trim()).filter(Boolean);
const shot = argValue('--shot');
const axe = process.argv.includes('--axe');

// Odaktaki öğeyi kısa tanımla: etiket#id.sınıf [role] "erişilebilir ad"
const describeActive = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'BODY';
  const id = el.id ? `#${el.id}` : '';
  const cls = el.classList.length ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
  const role = el.getAttribute('role') ? ` [${el.getAttribute('role')}]` : '';
  const name = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  return `${el.tagName.toLowerCase()}${id}${cls}${role}${name ? ` "${name}"` : ''}`;
};

const measure = sels => sels.map(sel => {
  const el = document.querySelector(sel);
  if (!el) return { sel, found: false };
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const visible = r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && !el.closest('[hidden]');
  const inViewport = r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
  const fs = document.fullscreenElement;
  return {
    sel, found: true, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
    visible, inViewport, ...(fs ? { insideFullscreen: fs.contains(el) } : {}),
  };
});

async function runStep(page, step) {
  const i = step.indexOf(':');
  const cmd = i === -1 ? step : step.slice(0, i);
  const arg = i === -1 ? '' : step.slice(i + 1).trim();
  switch (cmd) {
    case 'click': return page.click(arg, { timeout: 3000 });
    case 'press': return page.keyboard.press(arg);
    case 'fill': { const j = arg.indexOf('='); return page.fill(arg.slice(0, j), arg.slice(j + 1), { timeout: 3000 }); }
    case 'hover': return page.hover(arg, { timeout: 3000 });
    case 'focus': return page.focus(arg, { timeout: 3000 });
    case 'wait': return page.waitForTimeout(Number(arg) || 300);
    case 'scroll': return page.locator(arg).first().scrollIntoViewIfNeeded({ timeout: 3000 });
    case 'fullscreen': return page.evaluate(sel => document.querySelector(sel)?.requestFullscreen(), arg);
    case 'exitfullscreen': return page.evaluate(() => document.fullscreenElement && document.exitFullscreen());
    default: throw new Error(`bilinmeyen adım: ${cmd}`);
  }
}

const browser = await chromium.launch();
const results = [];
try {
  for (const vp of viewports) {
    for (const theme of themes) {
      const context = await browser.newContext({ viewport: vp, colorScheme: theme });
      const page = await context.newPage();
      const consoleErrors = [];
      let collecting = true;   // axe kendi stil isteklerinde CORS hatası üretir; onlar sayfanın hatası değil
      page.on('console', m => { if (collecting && m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); });
      page.on('pageerror', e => { if (collecting) consoleErrors.push(String(e.message).slice(0, 160)); });
      await page.goto(`file://${path}${query}`);
      await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
      await page.waitForTimeout(200);

      const stepLog = [];
      for (const step of steps) {
        try {
          await runStep(page, step);
          await page.waitForTimeout(120);
          stepLog.push({ step, active: await page.evaluate(describeActive) });
        } catch (e) {
          stepLog.push({ step, error: String(e.message).split('\n')[0].slice(0, 160) });
        }
      }

      const r = {
        viewport: `${vp.width}x${vp.height}`, theme,
        ...(steps.length ? { steps: stepLog } : {}),
        active: await page.evaluate(describeActive),
        fullscreen: await page.evaluate(() => (document.fullscreenElement ? (document.fullscreenElement.id ? `#${document.fullscreenElement.id}` : document.fullscreenElement.tagName.toLowerCase()) : null)),
        ...(measures.length ? { measure: await page.evaluate(measure, measures) } : {}),
        consoleErrors,
      };

      collecting = false;
      if (axe) {
        const { default: AxeBuilder } = await import('@axe-core/playwright');
        const res = await new AxeBuilder({ page }).analyze();
        r.axe = res.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, first: v.nodes[0]?.target?.join(' ') }));
      }
      if (shot) {
        const out = join(dirname(resolve(shot)), `${basename(shot, '.png')}-${vp.width}-${theme}.png`);
        await page.screenshot({ path: out });
        r.shot = out;
      }
      results.push(r);
      await context.close();
    }
  }
} catch (e) {
  console.error(`Açılış hatası: ${e.message}`);
  await browser.close();
  process.exit(1);
}
await browser.close();
// Kısa çıktı: her viewport × tema tek satır
console.log(`probe ${file}${query}`);
for (const r of results) console.log(JSON.stringify(r));

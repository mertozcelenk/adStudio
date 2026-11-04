/**
 * Erişilebilirlik testi — axe-core ile her HTML dosyasını tarar,
 * WCAG 2.1 AA + WCAG 2.2 AA ihlallerini raporlar.
 *
 * Kapsam: wcag2a, wcag2aa, wcag21aa, wcag22aa (axe-core otomatik kapsam)
 * Not: WCAG 2.2 POUR'un manuel gerektiren kuralları bu testle yakalanamaz;
 * bunlar ads-ux-reviewer agent'ı tarafından ayrıca denetlenir.
 *
 * Gizli durum taraması: axe gizli öğelere bakmaz; ekranlardaki durum blokları (boş, hata, arama sonucu listesi…)
 * açılışta `hidden` olduğu için ilk taramada hiç denetlenmez. İkinci geçişte `hidden` kaldırılır ve yalnızca ARIA yapı
 * kuralları (STATE_RULES) çalışır — görünürlüğe bağlı kurallar (kontrast, yerleşim) bu geçişte anlamsız olduğu için
 * dışarıda. İlk taramada zaten bulunan öğe tekrar yazılmaz; bulgu mesajı "[gizli durum]" ile başlar.
 *
 * Kullanım:
 *   node accessibility.mjs
 *   node accessibility.mjs --fail-on-minor  → Medium/Nitpick bulgular da teslimi engeller
 *   Ortak seçenekler (--root, --format, --json): lib/common.mjs
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { relative } from 'path';
import { projectRoot, projectHtmlFiles, applyOnly, onlyProblem, htmlPrecheck, blocksByImpact, statusFrom, finish, crash } from './lib/common.mjs';

const TEST = 'accessibility';
const PROJECT_ROOT = projectRoot();
const FAIL_ON_MINOR = process.argv.includes('--fail-on-minor');

// axe impact → adStudio etki seviyesi
const IMPACT = { critical: 'Blocker', serious: 'High', moderate: 'Medium', minor: 'Nitpick' };
const STATE_RULES = ['aria-required-children', 'aria-required-parent', 'list', 'listitem', 'aria-allowed-role',
  'aria-prohibited-attr', 'aria-valid-attr-value', 'aria-allowed-attr'];

const toFinding = (label, v, node, prefix = '') => {
  const impact = IMPACT[v.impact] || 'Medium';
  return {
    rule: `axe/${v.id}`, file: label, selector: node.target.join(' '), viewport: null, theme: null,
    impact, blocks: blocksByImpact(impact) || FAIL_ON_MINOR, msg: `${prefix}${v.description} (${v.helpUrl})`,
  };
};

async function run() {
  const skip = htmlPrecheck(TEST, PROJECT_ROOT);
  if (skip) return finish(skip);
  const scoped = applyOnly(PROJECT_ROOT, projectHtmlFiles(PROJECT_ROOT));
  const bad = onlyProblem(TEST, scoped);
  if (bad) return finish(bad);
  const htmlFiles = scoped.files;

  const browser = await chromium.launch();
  const findings = [];

  for (const file of htmlFiles) {
    const label = relative(PROJECT_ROOT, file);
    // AxeBuilder, browser.newPage() ile açılan sayfada çalışmaz — sayfa bir context içinden açılmalı
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`file://${file}`);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const seen = new Set();
    for (const v of results.violations) {
      for (const node of v.nodes) { findings.push(toFinding(label, v, node)); seen.add(`${v.id}|${node.target.join(' ')}`); }
      console.log(`  [${IMPACT[v.impact] || 'Medium'}] ${label} — ${v.id} (${v.nodes.length} öğe): ${v.description}`);
    }

    // Gizli durum taraması (yalnızca gizli öğe varsa)
    const unhidden = await page.evaluate(() => {
      const els = [...document.querySelectorAll('body [hidden]')];
      els.forEach(el => el.removeAttribute('hidden'));
      return els.length;
    });
    let stateCount = 0;
    if (unhidden) {
      const hiddenRes = await new AxeBuilder({ page }).withRules(STATE_RULES).analyze();
      for (const v of hiddenRes.violations) {
        const nodes = v.nodes.filter(n => !seen.has(`${v.id}|${n.target.join(' ')}`));
        for (const node of nodes) findings.push(toFinding(label, v, node, '[gizli durum] '));
        if (nodes.length) console.log(`  [${IMPACT[v.impact] || 'Medium'}] ${label} — ${v.id} gizli durumda (${nodes.length} öğe): ${v.description}`);
        stateCount += nodes.length;
      }
    }
    if (results.violations.length === 0 && stateCount === 0) console.log(`  [GEÇTİ]   ${label}`);
    await context.close();
  }

  await browser.close();
  finish({ test: TEST, status: statusFrom(findings), checked: htmlFiles.length, findings });
}

run().catch(err => crash(TEST, err));

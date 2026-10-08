/**
 * Erişilebilirlik testi — axe-core ile her HTML dosyasını tarar,
 * WCAG 2.1 AA + WCAG 2.2 AA ihlallerini raporlar.
 *
 * Kapsam: wcag2a, wcag2aa, wcag21aa, wcag22aa (axe-core otomatik kapsam)
 * Not: WCAG 2.2 POUR'un manuel gerektiren kuralları bu testle yakalanamaz;
 * bunlar ads-ux-reviewer agent'ı tarafından ayrıca denetlenir.
 *
 * Kullanım:
 *   node accessibility.mjs
 *   node accessibility.mjs --fail-on-minor  → Medium/Nitpick bulgular da teslimi engeller
 *   Ortak seçenekler (--root, --format, --json): lib/common.mjs
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { relative } from 'path';
import { projectRoot, projectHtmlFiles, htmlPrecheck, blocksByImpact, statusFrom, finish, crash } from './lib/common.mjs';

const TEST = 'accessibility';
const PROJECT_ROOT = projectRoot();
const FAIL_ON_MINOR = process.argv.includes('--fail-on-minor');

// axe impact → adStudio etki seviyesi
const IMPACT = { critical: 'Blocker', serious: 'High', moderate: 'Medium', minor: 'Nitpick' };

async function run() {
  const skip = htmlPrecheck(TEST, PROJECT_ROOT);
  if (skip) return finish(skip);
  const htmlFiles = projectHtmlFiles(PROJECT_ROOT);

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

    if (results.violations.length === 0) console.log(`  [GEÇTİ]   ${label}`);
    for (const v of results.violations) {
      const impact = IMPACT[v.impact] || 'Medium';
      for (const node of v.nodes) {
        findings.push({
          rule: `axe/${v.id}`,
          file: label,
          selector: node.target.join(' '),
          viewport: null,
          theme: null,
          impact,
          blocks: blocksByImpact(impact) || FAIL_ON_MINOR,
          msg: `${v.description} (${v.helpUrl})`,
        });
      }
      console.log(`  [${impact}] ${label} — ${v.id} (${v.nodes.length} öğe): ${v.description}`);
    }
    await context.close();
  }

  await browser.close();
  finish({ test: TEST, status: statusFrom(findings), checked: htmlFiles.length, findings });
}

run().catch(err => crash(TEST, err));

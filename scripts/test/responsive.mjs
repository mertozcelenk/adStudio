/**
 * Responsive test — HTML çıktılarında yatay overflow ve içerik taşmasını kontrol eder.
 *
 * Kapsam: components/ ve screens/ altındaki tüm dosyalar + varsa index.html (navigasyon sayfası).
 * index.html ekranları iframe içinde gösterdiği için tek başına yeterli değildir; her ekran kendi
 * genişliğinde ayrıca açılır.
 *   web ekranları                         375 / 768 / 1280
 *   <body data-platform="ios|android">    yalnızca cihaz ölçüsünde (390×844 / 412×915) — uygulama
 *                                         ekranı web genişliklerine uyarlanmaz
 *
 * Kullanım:
 *   node responsive.mjs
 *   Ortak seçenekler (--root, --format, --json): lib/common.mjs
 */

import { chromium } from 'playwright';
import { existsSync, readFileSync } from 'fs';
import { relative, join } from 'path';
import { projectRoot, projectHtmlFiles, htmlPrecheck, finish, crash, APP_VIEWPORTS, bodyPlatform } from './lib/common.mjs';

const TEST = 'responsive';
const PROJECT_ROOT = projectRoot();

const VIEWPORTS = [
  { label: 'mobile',  width: 375,  height: 812 },
  { label: 'tablet',  width: 768,  height: 1024 },
  { label: 'desktop', width: 1280, height: 800 },
];

async function checkOverflow(page) {
  return page.evaluate(() => {
    const bodyWidth = document.body.scrollWidth;
    const viewportWidth = window.innerWidth;
    const overflowingEls = [];

    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > viewportWidth + 1) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const cls = el.className && typeof el.className === 'string'
          ? `.${el.className.trim().split(/\s+/).join('.')}`
          : '';
        overflowingEls.push(`${tag}${id}${cls}`);
      }
    });

    return {
      hasHorizontalScroll: bodyWidth > viewportWidth,
      bodyScrollWidth: bodyWidth,
      viewportWidth,
      overflowingElements: [...new Set(overflowingEls)].slice(0, 5),
    };
  });
}

async function run() {
  const skip = htmlPrecheck(TEST, PROJECT_ROOT);
  if (skip) return finish(skip);

  const indexPath = join(PROJECT_ROOT, 'index.html');
  const htmlFiles = [
    ...(existsSync(indexPath) ? [indexPath] : []),
    ...projectHtmlFiles(PROJECT_ROOT),
  ];
  let checked = 0;

  const browser = await chromium.launch();
  const findings = [];

  for (const file of htmlFiles) {
    const label = relative(PROJECT_ROOT, file);

    const platform = bodyPlatform(readFileSync(file, 'utf8'));
    const viewports = APP_VIEWPORTS[platform]
      ? [{ label: platform, ...APP_VIEWPORTS[platform] }]
      : VIEWPORTS;

    for (const vp of viewports) {
      checked++;
      const page = await browser.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`file://${file}`);
      await page.waitForLoadState('networkidle');

      const result = await checkOverflow(page);
      await page.close();

      if (result.hasHorizontalScroll) {
        const detail = result.overflowingElements.length
          ? `taşan: ${result.overflowingElements.join(', ')}`
          : `scrollWidth=${result.bodyScrollWidth}px > ${vp.width}px`;
        findings.push({
          rule: 'responsive/horizontal-overflow',
          file: label,
          selector: result.overflowingElements[0] || 'body',
          viewport: vp.width,
          theme: null,
          impact: 'High',
          blocks: true,
          msg: `Yatay kaydırma — ${detail}`,
        });
        console.log(`  [BAŞARISIZ] ${label} @ ${vp.label} (${vp.width}px) — ${detail}`);
      } else {
        console.log(`  [GEÇTİ]    ${label} @ ${vp.label} (${vp.width}px)`);
      }
    }
  }

  await browser.close();
  finish({ test: TEST, status: findings.length ? 'failed' : 'passed', checked, findings });
}

run().catch(err => crash(TEST, err));

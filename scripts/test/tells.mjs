/**
 * AI tells & layout disiplini testi — reviewer-checklist.md'deki mekanik ölçülebilen
 * kuralları HTML çıktıları üzerinde kontrol eder.
 *
 * Geçişler:
 *   web ekranları   1280 (tüm kurallar) + 375 (genişliğe bağlı kurallar + mobil web, "@375")
 *                   + 768 yalnızca --tablet veya spec.md'de "tablet: true" ise ("@768")
 *   uygulama        <body data-platform="ios|android"> → cihaz ölçüsünde (390×844 / 412×915),
 *                   web'e özgü kurallar atlanır, uygulama kontrolleri + %130 büyük yazı geçişi
 *
 *   KURAL    Görünür metin / alt / aria-label içinde em-dash (—) veya en-dash (–)
 *            ([data-copy="user"] içindeki kullanıcı metni muaf) — şirket kuralı: etki Nitpick, teslimi engeller
 *   HIGH     CTA etiketi desktop'ta iki satıra kayıyor
 *   HIGH     Nav yüksekliği > 80px veya nav öğeleri tek satıra sığmıyor   [marketing]
 *   HIGH     Sayfa yüklenirken yakalanmamış JS hatası
 *   HIGH     Kaydırma sonrası metnin > %20'si hâlâ görünmez (başarısız reveal)
 *   HIGH     Metnin üstüne opak bir öğe binmiş
 *   MEDIUM   Başlık üstünde eyebrow / kicker ([data-eyebrow-allowed] istisnası hariç)
 *   MEDIUM   Işık halesi / spotlight, dekoratif ızgara veya çizgili zemin, sahte yanıp sönen imleç
 *   MEDIUM   Sonsuz animasyonlu küçük durum noktası ([data-live] hariç)
 *   MEDIUM   Aynı giriş animasyonu 2'den fazla section'da
 *   MEDIUM   Başlıkların üst boşluğu alt boşluğundan küçük/eşit (2+ başlıkta)
 *   MEDIUM   Yatay kaydırmada kenara yapışık kart
 *   MEDIUM   Opak katman altında görünmeyen veya ~0 opaklıkta görsel
 *   MEDIUM   Aynı kart/panelde 3+ kez tekrarlanan metin
 *   MEDIUM   Gövde satırı > 80 karakter; 4+ ara başlıklı sayfada gezinme yok   [content]
 *   MEDIUM   screens/ altındaki dosyada <body data-page-kind> eksik
 *
 *   Mobil web (@375):
 *   HIGH     Tıklanabilir alan < 24px · yalnızca :hover ile görünen buton/link
 *   MEDIUM   Tıklanabilir alan 24–43px · viewport-fit=cover iken sabit öğede env(safe-area) yok · 100vh
 *
 *   Uygulama (data-platform="ios|android"):
 *   HIGH     Dokunma alanı iOS < 44 / Android < 48 veya Android'de aralık < 8 · güvenli alana taşan buton/link
 *   MEDIUM   Sekme çubuğu öğe sayısı (iOS 2–5, Android 3–5) · giriş animasyonu · %130 yazıda taşma/kesilme
 *            · yazı boyutu rem değil (büyük yazıda büyümüyor)
 *
 * [marketing] / [content] kontrolleri yalnızca ilgili <body data-page-kind> değerine sahip
 * dosyalarda çalışır.
 *
 * Kullanım:
 *   node tells.mjs                 → proje kökündeki components/ ve screens/ taranır
 *   node tells.mjs --root <dizin>  → başka bir proje kökü (test fixture'ları için)
 *   node tells.mjs --tablet        → web ekranlarını 768px'te de tara
 */

import { chromium } from 'playwright';
import { existsSync, readFileSync } from 'fs';
import { relative, join, sep } from 'path';
import { projectRoot, findHtmlFiles, htmlPrecheck, blocksByImpact, statusFrom, finish, crash, APP_VIEWPORTS, bodyPlatform } from './lib/common.mjs';

const TEST = 'tells';
const PROJECT_ROOT = projectRoot();

const VIEWPORT = { width: 1280, height: 800 };
const MOBILE_VIEWPORT = { width: 375, height: 812 };
const TABLET_VIEWPORT = { width: 768, height: 1024 };
const DEVICES = {
  ios:     { viewport: APP_VIEWPORTS.ios, minTarget: 44, minGap: 0, safeTop: 47, safeBottom: 34, tabs: [2, 5] },
  android: { viewport: APP_VIEWPORTS.android, minTarget: 48, minGap: 8, safeTop: 24, safeBottom: 24, tabs: [3, 5] },
};
const LARGE_TEXT_SCALE = '130%';
const NAV_MAX_HEIGHT = 80;
const HIDDEN_TEXT_RATIO = 0.2;   // kaydırma sonrası görünmez metin oranı eşiği
const MAX_LINE_CHARS = 80;       // [content] gövde satırı üst sınırı (~75ch hedef + tolerans)
const SAME_ENTRANCE_LIMIT = 2;   // aynı giriş animasyonunu kullanabilecek section sayısı

// Tarayıcı içinde çalışır — tüm ölçümler tek evaluate çağrısında
function inspectPage({ mode, device, navMaxHeight, hiddenTextRatio, maxLineChars, sameEntranceLimit }) {
  // mode: 'desktop' | 'mobile' | 'tablet' | 'app'
  const desktop = mode === 'desktop';
  const app = mode === 'app';
  const once = desktop || app;   // genişlikten bağımsız kurallar her dosyada bir kez
  const isVisible = el => {
    const style = getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none' && el.getClientRects().length > 0;
  };
  const describe = el => {
    const tag = el.tagName.toLowerCase();
    const cls = typeof el.className === 'string' && el.className.trim()
      ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
    return `${tag}${el.id ? `#${el.id}` : ''}${cls}`;
  };
  const snippet = (text, idx) =>
    text.slice(Math.max(0, idx - 25), idx + 25).replace(/\s+/g, ' ').trim();

  // Bir elemanın metninin kaç satıra yayıldığı (satır kutularının dikey konumlarına göre)
  const lineCount = el => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
    if (rects.length === 0) return 0;
    const fontSize = parseFloat(getComputedStyle(el).fontSize) || 16;
    const tops = [];
    for (const r of rects) {
      if (!tops.some(t => Math.abs(t - r.top) < fontSize * 0.6)) tops.push(r.top);
    }
    return tops.length;
  };

  const findings = [];
  const pageKind = document.body.dataset.pageKind || null;

if (once) {
    // 1. Em-dash / en-dash — görünür metin, alt, aria-label
    const DASH = /[—–]/;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let dashCount = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) continue;
      if (parent.closest('[data-copy="user"]')) continue;
      const idx = node.textContent.search(DASH);
      if (idx === -1 || !isVisible(parent)) continue;
      dashCount++;
      if (dashCount <= 5) {
        findings.push({ rule: 'tells/em-dash', sel: describe(parent), sev: 'KURAL', msg: `Em/en-dash metinde: "${snippet(node.textContent, idx)}" (${describe(parent)})` });
      }
    }
    for (const el of document.querySelectorAll('[alt], [aria-label]')) {
      if (el.closest('[data-copy="user"]')) continue;
      for (const attr of ['alt', 'aria-label']) {
        const val = el.getAttribute(attr);
        if (val && DASH.test(val)) {
          dashCount++;
          if (dashCount <= 5) {
            findings.push({ rule: 'tells/em-dash', sel: describe(el), sev: 'KURAL', msg: `Em/en-dash ${attr} içinde: "${val}" (${describe(el)})` });
          }
        }
      }
    }
    if (dashCount > 5) {
      findings.push({ rule: 'tells/em-dash-overflow', sel: null, sev: 'KURAL', msg: `…toplam ${dashCount} em/en-dash (ilk 5 listelendi)` });
    }
  }

  if (!app) {
    // 2. CTA satır kayması
    const ctaSelector = 'button, a[role="button"], .btn, [class*="btn-"], [class*="button"], input[type="submit"], input[type="button"]';
    const seen = new Set();
    for (const el of document.querySelectorAll(ctaSelector)) {
      if (seen.has(el) || !isVisible(el) || el.closest('nav')) continue;
      seen.add(el);
      if (el.tagName === 'INPUT') continue; // input metni tek satırda render edilir
      const label = el.textContent.replace(/\s+/g, ' ').trim();
      if (!label) continue;
      const lines = lineCount(el);
      if (lines > 1) {
        findings.push({ rule: 'tells/cta-wrap', sel: describe(el), sev: desktop ? 'HIGH' : 'MEDIUM', msg: `CTA ${lines} satıra kayıyor: "${label}" (${describe(el)})` });
      }
    }
  }

    if (desktop && pageKind === 'marketing') {
    // 3. Nav — yükseklik ve tek satır
    const nav = document.querySelector('header nav, nav');
    if (nav && isVisible(nav)) {
      const bar = nav.closest('header') || nav;
      const height = Math.round(bar.getBoundingClientRect().height);
      if (height > navMaxHeight) {
        findings.push({ rule: 'tells/nav-height', sel: describe(bar), sev: 'HIGH', msg: `Nav yüksekliği ${height}px > ${navMaxHeight}px (${describe(bar)})` });
      }
      const items = [...nav.querySelectorAll('a, button')].filter(isVisible);
      const centers = [];
      for (const item of items) {
        const r = item.getBoundingClientRect();
        const c = r.top + r.height / 2;
        if (!centers.some(x => Math.abs(x - c) < 12)) centers.push(c);
      }
      const wrapped = items.filter(i => lineCount(i) > 1).map(i => i.textContent.trim());
      if (centers.length > 1 || wrapped.length > 0) {
        const detail = wrapped.length ? `kayan öğeler: ${wrapped.join(', ')}` : `${centers.length} satır`;
        findings.push({ rule: 'tells/nav-wrap', sel: null, sev: 'HIGH', msg: `Nav desktop'ta tek satıra sığmıyor — ${detail}` });
      }
    }

  }

  const topSections = [...document.querySelectorAll('section')].filter(s => !s.parentElement.closest('section'));
  const vis = el => isVisible(el) && el.getBoundingClientRect().width > 0;

if (once) {
    // 4. Eyebrow / kicker — başlığın hemen önündeki küçük, büyük harfli, açık aralıklı etiketler.
    //    Varsayılan olarak yasak; Bağlayıcı Kararlar istisnası [data-eyebrow-allowed] ile işaretlenir.
    const isHeading = el => el && (/^H[1-6]$/.test(el.tagName) || el.firstElementChild && /^H[1-6]$/.test(el.firstElementChild.tagName));
    const eyebrows = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (el.children.length > 0 || !isVisible(el) || el.closest('[data-eyebrow-allowed]')) continue;
      const text = el.textContent.trim();
      if (!text || text.length > 60) continue;
      const style = getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const spacing = style.letterSpacing === 'normal' ? 0 : parseFloat(style.letterSpacing);
      const upper = style.textTransform === 'uppercase' || (text === text.toLocaleUpperCase('tr') && /\p{Lu}/u.test(text));
      if (upper && fontSize <= 14 && spacing / fontSize > 0.05 && isHeading(el.nextElementSibling)) {
        eyebrows.push(text);
      }
    }
    if (eyebrows.length > 0) {
      findings.push({
        rule: 'tells/eyebrow',
        sel: null,
        sev: 'MEDIUM',
        msg: `Başlık üstünde ${eyebrows.length} eyebrow (istisna yoksa yasak): ${eyebrows.slice(0, 5).map(e => `"${e}"`).join(', ')}`,
      });
    }

    // 5. Yasak görsel desenler — ışık halesi, ızgara / çizgili zemin, sahte imleç, nabız noktası
    const isTransparentStop = bg => /transparent|rgba\([^)]*,\s*0(\.0+)?\)/.test(bg);
    for (const el of document.body.querySelectorAll('*')) {
      if (!vis(el)) continue;
      const style = getComputedStyle(el);
      const bg = style.backgroundImage;
      const r = el.getBoundingClientRect();
      if (bg && bg !== 'none') {
        if (/radial-gradient/.test(bg) && isTransparentStop(bg) && r.width >= 300 && r.height >= 200) {
          findings.push({ rule: 'tells/glow', sel: describe(el), sev: 'MEDIUM', msg: `Işık halesi / spotlight: kenara doğru kaybolan radial-gradient (${describe(el)})` });
        }
        const linearCount = (bg.match(/linear-gradient/g) || []).length;
        const fixedCell = /\d+px/.test(style.backgroundSize) && style.backgroundRepeat !== 'no-repeat';
        if (/repeating-linear-gradient/.test(bg) && r.width >= 200) {
          findings.push({ rule: 'tells/stripes', sel: describe(el), sev: 'MEDIUM', msg: `Dekoratif çizgili desen: repeating-linear-gradient (${describe(el)})` });
        } else if (linearCount >= 2 && fixedCell && r.width >= 300) {
          findings.push({ rule: 'tells/grid-bg', sel: describe(el), sev: 'MEDIUM', msg: `Dekoratif ızgara zemin: ${linearCount} linear-gradient + sabit hücre ${style.backgroundSize} — işlevsel yüzey (harita/tuval) değilse kaldır (${describe(el)})` });
        }
      }
      for (const pseudo of [null, '::after', '::before']) {
        const ps = pseudo ? getComputedStyle(el, pseudo) : style;
        if (/blink|caret|cursor/i.test(ps.animationName)) {
          findings.push({ rule: 'tells/fake-cursor', sel: describe(el), sev: 'MEDIUM', msg: `Sahte yanıp sönen imleç: animation "${ps.animationName}" (${describe(el)}${pseudo || ''})` });
          break;
        }
      }
      const round = parseFloat(style.borderTopLeftRadius) >= Math.min(r.width, r.height) / 2;
      if (r.width <= 16 && r.height <= 16 && round && style.animationIterationCount === 'infinite'
          && style.animationName !== 'none' && !el.closest('[data-live]')) {
        findings.push({ rule: 'tells/pulse-dot', sel: describe(el), sev: 'MEDIUM', msg: `Animasyonlu durum noktası — gerçek canlı veriye bağlı değilse durağan olmalı (${describe(el)})` });
      }
    }
  }

    if (once) {
    // 6. Tekrarlı giriş animasyonu — aynı animation-name / reveal sınıfı en fazla 2 section'da
    const REVEAL_CLASS = /^(reveal|fade|fade-?up|fade-?in|slide-?up|animate|aos-\S+|in-?view|appear)$/i;
    const entranceUse = new Map();
    const entranceScopes = app ? [document.body] : topSections;
    for (const sec of entranceScopes) {
      const keys = new Set();
      for (const el of [sec, ...sec.querySelectorAll('*')]) {
        const name = getComputedStyle(el).animationName;
        if (name && name !== 'none' && getComputedStyle(el).animationIterationCount !== 'infinite') {
          name.split(',').forEach(n => keys.add(`animation:${n.trim()}`));
        }
        for (const c of el.classList) if (REVEAL_CLASS.test(c)) keys.add(`class:${c}`);
        if (el.dataset.aos) keys.add(`data-aos:${el.dataset.aos}`);
      }
      for (const k of keys) entranceUse.set(k, (entranceUse.get(k) || 0) + 1);
    }
    if (app && entranceUse.size > 0) {
      findings.push({ rule: 'tells/app-entrance', sel: null, sev: 'MEDIUM', msg: `Uygulama ekranında giriş animasyonu (${[...entranceUse.keys()].slice(0, 3).join(', ')}) — içerik anında görünür, hareket yalnızca mikro etkileşimde` });
    }
    for (const [key, count] of entranceUse) {
      if (desktop && count > sameEntranceLimit) {
        findings.push({ rule: 'tells/same-entrance', sel: null, sev: 'MEDIUM', msg: `Aynı giriş animasyonu ${count} section'da (${key}) — en fazla ${sameEntranceLimit}; hareketi tek imza ana topla` });
      }
    }
  }

  // 7. Görünmeyen içerik — kaydırma sonrası hâlâ opacity 0 / visibility hidden olan metin
  const effectiveOpacity = el => {
    let o = 1;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
    return o;
  };
  const isSrOnly = el => {
    const r = el.getBoundingClientRect();
    return r.width <= 1 && r.height <= 1;
  };
  let totalChars = 0, hiddenChars = 0;
  const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (textWalker.nextNode()) {
    const node = textWalker.currentNode;
    const parent = node.parentElement;
    const len = node.textContent.trim().length;
    if (!parent || !len || ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(parent.tagName)) continue;
    if (parent.closest('[aria-hidden="true"], dialog:not([open]), details:not([open]) > :not(summary), [hidden]')) continue;
    const cs = getComputedStyle(parent);
    if (cs.display === 'none' || parent.getClientRects().length === 0 || isSrOnly(parent)) continue;
    totalChars += len;
    if (cs.visibility === 'hidden' || effectiveOpacity(parent) < 0.05) hiddenChars += len;
  }
  if (totalChars > 0 && hiddenChars / totalChars > hiddenTextRatio) {
    findings.push({ rule: 'tells/hidden-text', sel: null, sev: 'HIGH', msg: `Kaydırma sonrası metnin %${Math.round(hiddenChars / totalChars * 100)}'i görünmez — başarısız reveal; içerik varsayılan görünür olmalı` });
  }

  // 8. Metin örtüşmesi — metnin ortasında başka bir opak öğe var mı
  // Açık bir modal (aria-modal / dialog) arkasında bilerek devre dışı bırakılmış içerik (inert / aria-hidden) örtüşme sayılmaz
  const MODAL = '[aria-modal="true"], [role="dialog"], [role="alertdialog"], dialog[open]';
  const leafTexts = [...document.body.querySelectorAll('h1, h2, h3, h4, p, li, a, button, label, td, th, span')]
    .filter(el => vis(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1))
    .filter(el => !el.closest('[inert], [aria-hidden="true"]'))
    .slice(0, 400);
  const opaque = el => {
    const c = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    const alpha = c ? (c.length === 4 ? parseFloat(c[3]) : 1) : 0;
    return alpha > 0.5 || getComputedStyle(el).backgroundImage !== 'none' || el.tagName === 'IMG';
  };
  let occluded = 0;
  const occludedSamples = [];
  for (const el of leafTexts) {
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const range = document.createRange();
    range.selectNodeContents(el);
    const rect = [...range.getClientRects()].find(r => r.width > 4 && r.height > 4);
    if (!rect) continue;
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (!hit || el.contains(hit) || hit.contains(el)) continue;
    if (hit.closest(MODAL) && !el.closest(MODAL)) continue;
    const hasOwnText = [...hit.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (opaque(hit) || hasOwnText) {
      occluded++;
      if (occludedSamples.length < 3) occludedSamples.push(`"${el.textContent.trim().slice(0, 30)}" ← ${describe(hit)}`);
    }
  }
  window.scrollTo(0, 0);
  if (occluded > 0) {
    findings.push({ rule: 'tells/text-overlap', sel: null, sev: 'HIGH', msg: `Metin örtüşmesi: ${occluded} metnin üstüne başka öğe binmiş — ${occludedSamples.join('; ')}` });
  }

  // 9. Kenara yapışık kart — yatay kaydırıcıda baş ve son boşluk asimetrisi
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (!/(auto|scroll)/.test(cs.overflowX) || el.scrollWidth <= el.clientWidth + 1 || el.children.length < 2) continue;
    const box = el.getBoundingClientRect();
    const first = el.firstElementChild.getBoundingClientRect();
    const startGap = first.left - box.left + el.scrollLeft;
    const prev = el.scrollLeft;
    el.scrollLeft = el.scrollWidth;
    const last = el.lastElementChild.getBoundingClientRect();
    const endGap = box.right - last.right;
    el.scrollLeft = prev;
    if ((startGap <= 1 && endGap >= 8) || (endGap <= 1 && startGap >= 8)) {
      findings.push({ rule: 'tells/edge-card', sel: describe(el), sev: 'MEDIUM', msg: `Kenara yapışık kart: kaydırıcıda baş boşluk ${Math.round(startGap)}px, son boşluk ${Math.round(endGap)}px (${describe(el)})` });
    }
  }

  // 10. Başlık ritmi — başlığın üstündeki boşluk altındakinden büyük olmalı
  const tightHeadings = [];
  for (const h of document.body.querySelectorAll('h2, h3, h4')) {
    const prev = h.previousElementSibling, next = h.nextElementSibling;
    if (!vis(h) || !prev || !next || !vis(prev) || !vis(next)) continue;
    const hr = h.getBoundingClientRect();
    const above = hr.top - prev.getBoundingClientRect().bottom;
    const below = next.getBoundingClientRect().top - hr.bottom;
    if (above <= below) tightHeadings.push(`"${h.textContent.trim().slice(0, 30)}" (üst ${Math.round(above)} / alt ${Math.round(below)})`);
  }
  if (tightHeadings.length >= 2) {
    findings.push({ rule: 'tells/heading-rhythm', sel: null, sev: 'MEDIUM', msg: `Başlık ritmi: ${tightHeadings.length} başlığın üst boşluğu alt boşluğundan büyük değil — ${tightHeadings.slice(0, 3).join(', ')}` });
  }

if (once) {
    // 11. Görünmeyen görsel — opak gradient katmanı altında veya ~0 opaklıkta raster
    const layerAlphaMin = layer => {
      const colors = layer.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}\b/gi) || [];
      if (colors.length === 0) return 0;
      return Math.min(...colors.map(c => {
        const m = c.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
        return m ? parseFloat(m[1]) : 1;
      }));
    };
    for (const el of document.body.querySelectorAll('*')) {
      if (!vis(el)) continue;
      const bg = getComputedStyle(el).backgroundImage;
      const isImg = el.tagName === 'IMG' || el.tagName === 'PICTURE';
      if ((isImg || /url\(/.test(bg)) && effectiveOpacity(el) < 0.1) {
        findings.push({ rule: 'tells/invisible-image', sel: describe(el), sev: 'MEDIUM', msg: `Görünmeyen görsel: opaklık ~0 (${describe(el)})` });
        continue;
      }
      if (!/url\(/.test(bg)) continue;
      const layers = bg.split(/,(?![^(]*\))/);
      const urlIdx = layers.findIndex(l => /url\(/.test(l));
      const covering = layers.slice(0, urlIdx).filter(l => /gradient/.test(l));
      if (covering.some(l => layerAlphaMin(l) >= 0.9)) {
        findings.push({ rule: 'tells/invisible-image', sel: describe(el), sev: 'MEDIUM', msg: `Görünmeyen görsel: arka plan görseli ≥ 0.9 opak gradient katmanının altında (${describe(el)})` });
      }
    }

    // 12. Tekrarlı metin — aynı kart/panelde 3+ farklı yerde aynı metin
    const containers = document.body.querySelectorAll('article, li, [class*="card"], [class*="panel"], [class*="tile"]');
    for (const box of containers) {
      if (!vis(box) || box.querySelector('article, [class*="card"]')) continue;
      const counts = new Map();
      for (const el of box.querySelectorAll('*')) {
        if (el.children.length > 0 || !vis(el)) continue;
        const t = el.textContent.replace(/\s+/g, ' ').trim().toLocaleLowerCase('tr');
        if (t.length < 2 || t.length > 40) continue;
        counts.set(t, (counts.get(t) || 0) + 1);
      }
      for (const [t, n] of counts) {
        if (n >= 3) findings.push({ rule: 'tells/repeated-text', sel: describe(box), sev: 'MEDIUM', msg: `Tekrarlı metin: "${t}" aynı kartta ${n} kez (${describe(box)})` });
      }
    }
  }

    // 13. [content] — satır genişliği ve uzun sayfada gezinme
  if (desktop && pageKind === 'content') {
    let widest = null;
    for (const p of document.body.querySelectorAll('p')) {
      if (!vis(p) || p.textContent.trim().length < 120) continue;
      const probe = document.createElement('span');
      probe.textContent = '0'.repeat(20);
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
      p.appendChild(probe);
      const ch = probe.getBoundingClientRect().width / 20;
      probe.remove();
      const chars = Math.round(p.clientWidth / ch);
      if (chars > maxLineChars && (!widest || chars > widest.chars)) widest = { chars, el: p };
    }
    if (widest) {
      findings.push({ rule: 'tells/line-length', sel: describe(widest.el), sev: 'MEDIUM', msg: `Satır genişliği ~${widest.chars} karakter > ${maxLineChars} — gövdeyi 60–75ch ile sınırla (${describe(widest.el)})` });
    }
    const h2s = [...document.body.querySelectorAll('h2')].filter(vis);
    const hasToc = document.querySelector('main nav, article nav, aside nav, [class*="toc"], [aria-label*="içindekiler" i], [aria-label*="contents" i]');
    if (h2s.length >= 4 && !hasToc) {
      findings.push({ rule: 'tells/content-nav', sel: null, sev: 'MEDIUM', msg: `${h2s.length} ara başlıklı uzun sayfada içindekiler / bölüm gezinmesi yok` });
    }
  }

  // 14. Mobil web — dokunma alanı, hover'a bağlı işlev, güvenli alan, 100vh (yalnızca 375 geçişi)
  const INTERACTIVE = 'a[href], button, [role="button"], [role="tab"], [role="switch"], input:not([type="hidden"]), select, textarea, summary';
  const isInlineTextLink = el => el.tagName === 'A' && el.parentElement
    && /^(P|LI|SPAN|TD|DD|BLOCKQUOTE|FIGCAPTION|LABEL)$/.test(el.parentElement.tagName)
    && [...el.parentElement.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
  const targets = [...document.body.querySelectorAll(INTERACTIVE)]
    .filter(el => vis(el) && !el.closest('[aria-hidden="true"]') && !isInlineTextLink(el)
      && !(el.parentElement && el.parentElement.closest(INTERACTIVE)));
  const sizeOf = el => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), r }; };
  const label = el => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || '').replace(/\s+/g, ' ').trim().slice(0, 24) || describe(el);
  const styleRules = [];
  const collectRules = (rules, media) => {
    for (const rule of rules) {
      if (rule.cssRules && rule.media) collectRules(rule.cssRules, media.concat(rule.media.mediaText));
      else if (rule.cssRules && !rule.selectorText) collectRules(rule.cssRules, media);
      else if (rule.selectorText) styleRules.push({ rule, media });
    }
  };
  for (const sheet of document.styleSheets) {
    try { collectRules(sheet.cssRules, []); } catch { /* farklı origin — atla */ }
  }

  if (mode === 'mobile') {
    // WCAG 2.5.8: < 24px hedef, merkezindeki 24px çaplı daire başka bir hedefe (veya küçük hedefin
    // dairesine) değmiyorsa geçer — bu durumda yalnızca 44px önerisi (Medium) kalır
    const center = r => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    const distToRect = (p, r) => Math.hypot(Math.max(r.left - p.x, 0, p.x - r.right), Math.max(r.top - p.y, 0, p.y - r.bottom));
    const isTiny = el => { const { w, h } = sizeOf(el); return w < 24 || h < 24; };
    const crowded = el => {
      const c = center(el.getBoundingClientRect());
      return targets.some(o => {
        if (o === el) return false;
        const or = o.getBoundingClientRect();
        return isTiny(o) ? Math.hypot(c.x - center(or).x, c.y - center(or).y) < 24 : distToRect(c, or) < 12;
      });
    };
    const tiny = [], small = [];
    for (const el of targets) {
      const { w, h } = sizeOf(el);
      if ((w < 24 || h < 24) && crowded(el)) tiny.push(`"${label(el)}" ${w}×${h}`);
      else if (w < 44 || h < 44) small.push(`"${label(el)}" ${w}×${h}`);
    }
    if (tiny.length) findings.push({ rule: 'tells/target-tiny', sel: null, sev: 'HIGH', msg: `Dokunma alanı < 24px ve komşusuna çok yakın (${tiny.length}): ${tiny.slice(0, 4).join(', ')} — WCAG 2.5.8` });
    if (small.length) findings.push({ rule: 'tells/target-small', sel: null, sev: 'MEDIUM', msg: `Dokunma alanı 44px altında (${small.length}): ${small.slice(0, 4).join(', ')} — en az 44×44px` });

    // :hover ile görünür hale gelen etkileşimli öğe — dokunmatikte erişilemez
    const hoverOnly = new Set();
    for (const { rule, media } of styleRules) {
      if (!rule.selectorText.includes(':hover')) continue;
      if (media.some(m => /hover:\s*hover|pointer:\s*fine/.test(m))) continue;
      const st = rule.style;
      const reveals = (st.display && st.display !== 'none') || st.visibility === 'visible'
        || (st.opacity && parseFloat(st.opacity) > 0) || (st.pointerEvents && st.pointerEvents !== 'none');
      if (!reveals) continue;
      for (const sel of rule.selectorText.split(',')) {
        if (!sel.includes(':hover')) continue;
        const target = sel.replace(/:hover/g, '').trim();
        let nodes = [];
        try { nodes = [...document.querySelectorAll(target)]; } catch { continue; }
        for (const n of nodes) {
          const cs = getComputedStyle(n);
          const hidden = cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05;
          const interactive = n.matches(INTERACTIVE) || n.querySelector(INTERACTIVE);
          if (hidden && interactive) hoverOnly.add(`${describe(n)} ← ${sel.trim()}`);
        }
      }
    }
    if (hoverOnly.size) {
      findings.push({ rule: 'tells/hover-only', sel: null, sev: 'HIGH', msg: `Yalnızca hover ile görünen işlev (${hoverOnly.size}): ${[...hoverOnly].slice(0, 3).join('; ')} — dokunmatikte erişilemez` });
    }

    // viewport-fit=cover iken sabit üst/alt öğelerde env(safe-area-inset-*)
    const vp = document.querySelector('meta[name="viewport"]');
    if (vp && /viewport-fit\s*=\s*cover/.test(vp.content)) {
      for (const el of document.body.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (!/fixed|sticky/.test(cs.position) || !vis(el)) continue;
        const r = el.getBoundingClientRect();
        const edge = r.top <= 1 || r.bottom >= innerHeight - 1;
        if (!edge) continue;
        const usesSafe = (el.getAttribute('style') || '').includes('safe-area-inset')
          || styleRules.some(({ rule }) => rule.style.cssText.includes('safe-area-inset') && (() => { try { return el.matches(rule.selectorText); } catch { return false; } })());
        if (!usesSafe) findings.push({ rule: 'tells/safe-area-web', sel: describe(el), sev: 'MEDIUM', msg: `viewport-fit=cover iken kenara sabit öğe env(safe-area-inset-*) kullanmıyor (${describe(el)})` });
      }
    }

    // 100vh — mobil tarayıcıda adres çubuğu yüzünden alt kısım kesilir
    const vhRules = styleRules.filter(({ rule }) => /(^|[\s;])(min-)?height:\s*100vh/.test(rule.style.cssText)).map(({ rule }) => rule.selectorText);
    if (vhRules.length) findings.push({ rule: 'tells/vh-100', sel: null, sev: 'MEDIUM', msg: `100vh kullanımı: ${vhRules.slice(0, 3).join(', ')} — 100svh / 100dvh kullan` });
  }

  // 15. Uygulama — dokunma alanı + aralık, güvenli alan, sekme çubuğu
  if (app) {
    const dev = document.querySelector('.device') || document.body;
    const dr = dev.getBoundingClientRect();
    const cssPx = name => parseFloat(getComputedStyle(dev).getPropertyValue(name));
    const safeTop = cssPx('--safe-top') || device.safeTop;
    const safeBottom = cssPx('--safe-bottom') || device.safeBottom;

    const under = [];
    for (const el of targets) {
      const { w, h } = sizeOf(el);
      if (w < device.minTarget || h < device.minTarget) under.push(`"${label(el)}" ${w}×${h}`);
    }
    if (under.length) findings.push({ rule: 'tells/app-target', sel: null, sev: 'HIGH', msg: `Dokunma alanı < ${device.minTarget} (${under.length}): ${under.slice(0, 4).join(', ')}` });

    if (device.minGap > 0) {
      const tight = [];
      for (let i = 0; i < targets.length && tight.length < 4; i++) {
        for (let j = i + 1; j < targets.length; j++) {
          const a = targets[i].getBoundingClientRect(), b = targets[j].getBoundingClientRect();
          if (Math.min(a.width, a.height, b.width, b.height) >= 64) continue;
          const dx = Math.max(b.left - a.right, a.left - b.right);
          const dy = Math.max(b.top - a.bottom, a.top - b.bottom);
          const gap = Math.max(dx, dy);
          if (gap >= 0 && gap < device.minGap) { tight.push(`"${label(targets[i])}" ↔ "${label(targets[j])}" ${Math.round(gap)}`); break; }
        }
      }
      if (tight.length) findings.push({ rule: 'tells/app-target-gap', sel: null, sev: 'HIGH', msg: `Dokunma hedefleri arası < ${device.minGap} (${tight.join(', ')})` });
    }

    const inSafe = targets.filter(el => {
      const r = el.getBoundingClientRect();
      return r.top < dr.top + safeTop || r.bottom > dr.bottom - safeBottom;
    }).map(el => `"${label(el)}"`);
    if (inSafe.length) findings.push({ rule: 'tells/app-safe-area', sel: null, sev: 'HIGH', msg: `Güvenli alana taşan dokunma hedefi (${inSafe.length}): ${inSafe.slice(0, 4).join(', ')} — durum çubuğu / home indicator alanına buton konmaz` });

    const bars = [...document.querySelectorAll('nav, [role="tablist"], .tab-bar, .navigation-bar')]
      .filter(n => vis(n) && n.getBoundingClientRect().bottom >= dr.bottom - safeBottom - 120);
    for (const bar of bars) {
      const items = [...bar.querySelectorAll('a[href], button, [role="tab"]')].filter(vis).length;
      const [lo, hi] = device.tabs;
      if (items && (items < lo || items > hi)) {
        findings.push({ rule: 'tells/app-tab-count', sel: describe(bar), sev: 'MEDIUM', msg: `Sekme çubuğunda ${items} öğe — bu platformda ${lo}–${hi} (${describe(bar)})` });
      }
    }
  }

  return { pageKind, findings };
}

// %130 büyük yazı geçişi — yalnızca uygulama ekranları (Dynamic Type / sp benzetimi)
function largeTextCheck(scale) {
  const textEls = [...document.body.querySelectorAll('*')].filter(el =>
    [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1));
  const shown = textEls.filter(el => el.getClientRects().length > 0);
  const before = shown.map(el => parseFloat(getComputedStyle(el).fontSize));
  document.documentElement.style.fontSize = scale;
  const grown = shown.filter((el, i) => parseFloat(getComputedStyle(el).fontSize) > before[i] + 0.5).length;
  const findings = [];
  if (shown.length && grown / shown.length < 0.5) {
    findings.push({ rule: 'tells/app-text-px', sel: null, sev: 'MEDIUM', msg: `Metinlerin ${shown.length - grown}/${shown.length}'i büyük yazı ayarıyla büyümüyor (font-size px) — uygulama prototiplerinde rem kullan` });
    return findings;
  }
  const dev = document.querySelector('.device') || document.body;
  const dr = dev.getBoundingClientRect();
  const clipped = [];
  for (const el of textEls) {
    if (el.getClientRects().length === 0) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const hiddenOverflow = /hidden|clip/.test(cs.overflow + cs.overflowX + cs.overflowY) || cs.textOverflow === 'ellipsis';
    const cut = hiddenOverflow && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    const outside = r.right > dr.right + 1 || r.left < dr.left - 1;
    if (cut || outside) clipped.push(`"${el.textContent.trim().slice(0, 24)}"`);
  }
  if (clipped.length) {
    findings.push({ rule: 'tells/app-large-text', sel: null, sev: 'MEDIUM', msg: `Büyük yazıda (${scale}) kesilen / taşan metin (${clipped.length}): ${clipped.slice(0, 4).join(', ')}` });
  }
  return findings;
}

// Reveal işleyicilerinin çalışması için sayfayı adım adım sonuna kadar kaydırır, sonra başa döner
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}

// spec.md'den platform ve tablet bilgisini okur (yoksa web, tablet kapalı)
function readSpec() {
  const specPath = join(PROJECT_ROOT, 'spec.md');
  if (!existsSync(specPath)) return { platform: null, tablet: false };
  const text = readFileSync(specPath, 'utf8');
  const platform = (text.match(/^\s*platform:\s*(web|app|both|mobile)\b/m) || [])[1] || null;
  const tablet = /^\s*tablet:\s*true\b/m.test(text);
  return { platform, tablet };
}

// Tek bir geçiş: sayfayı verilen viewport'ta açar, kaydırır ve ölçer
async function runPass(browser, file, viewport, mode, device, mobileContext) {
  const context = await browser.newContext({
    viewport,
    ...(mobileContext ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}),
  });
  const page = await context.newPage();
  const scriptErrors = [];
  page.on('pageerror', err => scriptErrors.push(err.message.split('\n')[0]));
  await page.goto(`file://${file}`);
  await page.waitForLoadState('networkidle');
  await scrollThrough(page);
  const result = await page.evaluate(inspectPage, {
    mode,
    device,
    navMaxHeight: NAV_MAX_HEIGHT,
    hiddenTextRatio: HIDDEN_TEXT_RATIO,
    maxLineChars: MAX_LINE_CHARS,
    sameEntranceLimit: SAME_ENTRANCE_LIMIT,
  });
  if (mode === 'app') result.findings.push(...await page.evaluate(largeTextCheck, LARGE_TEXT_SCALE));
  await context.close();
  return { ...result, scriptErrors };
}

async function run() {
  const screenDir = join(PROJECT_ROOT, 'screens');
  const htmlFiles = [
    ...findHtmlFiles(join(PROJECT_ROOT, 'components')),
    ...findHtmlFiles(screenDir),
  ];

  const skip = htmlPrecheck(TEST, PROJECT_ROOT);
  if (skip) return finish(skip);

  const spec = readSpec();
  const tablet = process.argv.includes('--tablet') || spec.tablet;
  const appProject = spec.platform === 'app' || spec.platform === 'both';

  const browser = await chromium.launch();
  const summary = { KURAL: 0, HIGH: 0, MEDIUM: 0 };
  const issues = [];

  for (const file of htmlFiles) {
    const label = relative(PROJECT_ROOT, file);
    const isScreen = file.startsWith(screenDir + sep);
    const html = readFileSync(file, 'utf8');
    const platform = bodyPlatform(html);
    const findings = [];
    let pageKind = null;

    if (platform === 'ios' || platform === 'android') {
      const device = DEVICES[platform];
      const res = await runPass(browser, file, device.viewport, 'app', device, true);
      pageKind = res.pageKind;
      for (const msg of res.scriptErrors.slice(0, 3)) {
        findings.push({ rule: 'tells/js-error', sel: null, sev: 'HIGH', msg: `JS hatası: ${msg} — önce bunu düzelt, diğer bulgular etkilenebilir` });
      }
      findings.push(...res.findings);
      for (const f of findings) f.viewport = device.viewport.width;
    } else {
      const desk = await runPass(browser, file, VIEWPORT, 'desktop', null, false);
      pageKind = desk.pageKind;
      for (const msg of desk.scriptErrors.slice(0, 3)) {
        findings.push({ rule: 'tells/js-error', sel: null, sev: 'HIGH', msg: `JS hatası: ${msg} — önce bunu düzelt, diğer bulgular etkilenebilir` });
      }
      findings.push(...desk.findings);
      for (const f of findings) f.viewport = VIEWPORT.width;

      const passes = [['@375', MOBILE_VIEWPORT, 'mobile']];
      if (tablet) passes.push(['@768', TABLET_VIEWPORT, 'tablet']);
      for (const [tag, viewport, mode] of passes) {
        const res = await runPass(browser, file, viewport, mode, null, true);
        const seen = new Set(findings.map(f => f.msg));
        for (const f of res.findings) {
          if (!seen.has(f.msg)) findings.push({ ...f, viewport: viewport.width, msg: `${tag} ${f.msg}` });
        }
      }

      if (!pageKind && isScreen) {
        findings.push({ rule: 'tells/missing-page-kind', sel: 'body', sev: 'MEDIUM', msg: '<body data-page-kind="marketing|product|content"> eksik — [marketing] / [content] kontrolleri atlandı' });
      }
    }
    if (appProject && !platform && isScreen) {
      findings.push({ rule: 'tells/missing-platform', sel: 'body', sev: 'MEDIUM', msg: '<body data-platform="web|ios|android"> eksik — uygulama projesinde ekranın platformu belirtilmeli' });
    }

    for (const f of findings) {
      summary[f.sev]++;
      issues.push({ label, ...f });
    }
    const tags = [pageKind, platform].filter(Boolean).join(' · ');
    console.log(`  ${findings.length ? '[SORUN] ' : '[GEÇTİ] '}  ${label}${tags ? ` [${tags}]` : ''}`);
  }

  await browser.close();

  if (issues.length > 0) {
    console.log('\nBulgular:');
    for (const issue of issues) {
      console.log(`  [${issue.sev}] ${issue.label}`);
      console.log(`    ${issue.msg}`);
    }
  }

  console.log('\n--- AI Tells & Layout Özeti ---');
  console.log(`Taranan dosya: ${htmlFiles.length}${tablet ? ' (tablet geçişi açık)' : ''}`);
  console.log(`Kural:         ${summary.KURAL}  (şirket kuralı — etki Nitpick, teslimi engeller)`);
  console.log(`High:          ${summary.HIGH}`);
  console.log(`Medium:        ${summary.MEDIUM}`);

  // KURAL: şirket kuralı — kullanıcıya etkisi düşük (Nitpick) ama teslimi engeller
  const IMPACT = { KURAL: 'Nitpick', HIGH: 'High', MEDIUM: 'Medium' };
  const findings = issues.map(i => ({
    rule: i.rule, file: i.label, selector: i.sel ?? null, viewport: i.viewport ?? null, theme: null,
    impact: IMPACT[i.sev], blocks: i.sev === 'KURAL' || blocksByImpact(IMPACT[i.sev]), msg: i.msg,
  }));
  finish({ test: TEST, status: statusFrom(findings), checked: htmlFiles.length, findings });
}

run().catch(err => crash(TEST, err));

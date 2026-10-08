---
name: figma-use-slides
description: Figma Slides'da sunum oluşturur ve düzenler. Slayt ekleme, içerik yapısı ve tema uygulama.
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-use-slides/SKILL.md
last_checked: 2026-08-28
---

# figma-use-slides

Figma Slides ile sunum oluşturur.
**Önce `figma-use` skill'ini yükle.**

## Figma Slides ve Normal Figma Arasındaki Fark

Figma Slides, Figma'nın sunum modu — her frame bir slayt olur.
Slayt boyutu sabit: **1920×1080** (16:9) veya **1280×720**.

## Adım 1 — Slayt Yapısını Planla

Önce içerik taslağı çıkar:
- Kaç slayt?
- Her slaytın türü (başlık, içerik, kod, görsel, kapak)
- Slayt sırası ve akışı

## Adım 2 — Slayt Frame'lerini Oluştur

Her slayt için ayrı `use_figma` çağrısı:
```js
const slide = figma.createFrame();
slide.resize(1920, 1080);
slide.name = "Slide 01 — [Başlık]";
slide.x = slideIndex * 2000; // yan yana diz
return { id: slide.id };
```

## Adım 3 — Slayt Türlerine Göre İçerik

**Kapak slaytı:**
- Tam ekran arkaplan rengi veya görseli
- Büyük başlık (min 80px)
- Alt başlık, tarih, sunan

**Başlık + içerik:**
- Sol üst: bölüm numarası
- Büyük başlık
- Bullet listesi veya iki sütun

**Kod slaytı:**
- Başlık
- Kod bloğu (monospace font, koyu arkaplan)
- Açıklama metni

**Sadece görsel:**
- Tam ekran görsel
- Alt köşe: kısa açıklama

## Adım 4 — Tema Uygula

Tutarlı renk paleti ve tipografi:
```js
// Arkaplan
slide.fills = [{ type: 'SOLID', color: { r: 0.07, g: 0.07, b: 0.09 } }];

// Başlık metni
await figma.loadFontAsync({ family: "Inter", style: "Bold" });
const title = figma.createText();
title.fontSize = 72;
title.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
```

## Adım 5 — Slayt Numaraları

Her slayta sayfa numarası ekle (sağ alt köşe):
```js
const pageNum = figma.createText();
pageNum.characters = `${current} / ${total}`;
pageNum.x = 1820; pageNum.y = 1040;
pageNum.fontSize = 24;
pageNum.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
```

## Adım 6 — Doğrula

Her 5 slaytta bir `get_screenshot` al — uzun sunumlarda araya sıkıştırılmış hata kalmasın.

## Kritik Kurallar

- **`use_figma` çağrılarını asla paralelize etme** — kesinlikle sıralı.
- Her slayt ayrı `use_figma` çağrısı — 10+ slaytı tek seferde yazmaya çalışma.
- Font her metin bloğundan önce yükle.
- Slayt boyutunu tutarlı tut — karışık boyut sunumda sorun çıkarır.
- Okuma mesafesini dikkate al: min font 32px, başlık min 56px.

---
name: figma-create-new-file
description: Doğru sayfa yapısı ve başlangıç içeriğiyle Figma'da yeni dosya oluşturur.
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-create-new-file/SKILL.md
last_checked: 2026-08-28
---

# figma-create-new-file

Figma'da amacına uygun yapılandırılmış yeni dosyalar oluşturur.
**Önce `figma-use` skill'ini yükle.**

## Adım 1 — Amacı Belirle

Dosya türünü sor (önceden bilinmiyorsa):
- Design file (component, ekran, prototip)
- Design system / kütüphane
- Diagram / flowchart
- FigJam board

## Adım 2 — Dosya Oluştur

`use_figma` ile:
```js
const file = await figma.createFile();
return { fileId: file.id, fileKey: file.key };
```

Dosya adını immediately ayarla — "Untitled" bırakma:
```js
figma.root.name = "[Proje Adı] — [Tarih]";
return { id: figma.root.id };
```

## Adım 3 — Sayfa Yapısını Kur

**Design file için:**
```
Cover
Getting Started
— — —
[Feature/Section Adları]
— — —
Archive
```

**Design system için:**
```
Cover
Getting Started
Foundations (Color, Typography, Spacing, Iconography)
— — —
Components
— — —
Patterns
```

**Diagram için:**
```
Diagram
Notes
```

Her sayfa için ayrı `use_figma` çağrısı:
```js
const page = figma.createPage();
page.name = "Cover";
await figma.setCurrentPageAsync(page);
return { id: page.id };
```

## Adım 4 — Cover Sayfasını Doldur

Cover sayfasında:
- Dosya adı (büyük başlık)
- Proje açıklaması (kısa)
- Versiyon ve tarih
- Sahibi / ekip

## Adım 5 — Doğrula

```js
return {
  pages: figma.root.children.map(p => ({ id: p.id, name: p.name })),
  totalPages: figma.root.children.length
};
```

`get_screenshot` ile Cover sayfasını kontrol et.

## Kritik Kurallar

- **`use_figma` çağrılarını asla paralelize etme** — kesinlikle sıralı.
- Dosyayı oluşturur oluşturmaz adını ayarla — sonraya bırakma.
- Varsayılan "Page 1"i sil, yeni sayfaları yerleştirdikten sonra.
- Sayfa adlarında `---` separator kullan (gezinmeyi kolaylaştırır).
- Cover her zaman ilk sayfa olmalı.

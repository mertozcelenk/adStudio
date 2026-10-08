---
name: figma-use
description: Figma Plugin API (use_figma) için zorunlu temel kural seti. Herhangi bir use_figma çağrısından önce yükle.
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-use/SKILL.md
last_checked: 2026-08-28
---

# figma-use

`use_figma` aracıyla Figma Plugin API'sini çalıştırmak için temel kurallar.
Her `use_figma` çağrısından önce bu skill yüklenmiş olmalıdır.

## Temel Kurallar

- **Return kullan** — `figma.closePlugin()` değil. Return değeri otomatik JSON serialize edilir.
- **Tüm oluşturulan/değiştirilen node ID'lerini döndür** — her çağrıda.
- **Async işlemler için `await`** kullan — page değiştirme, font yükleme vb.
- **Renkler 0–1 aralığında** — 0–255 değil. (`{r:1, g:0, b:0}` = kırmızı)
- **`figma.notify()` çalışmaz** — hiç kullanma.
- **Atomik** — script hata alırsa hiçbir değişiklik uygulanmaz.
- **İnkremental çalış** — tek çağrıda max ~10 mantıksal işlem; doğrula, sonra devam et.

## Sayfa Yönetimi

```js
// Her çağrının başında — bir kez, döngü içinde değil
await figma.setCurrentPageAsync(targetPage);
```

Sync setter (`figma.currentPage = page`) çalışmaz. Her `use_figma` çağrısı sayfa bağlamını sıfırlar — sayfa değişimi gerektiren işlemleri ayrı çağrılara böl.

## Font Yükleme

```js
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
// Sonra metin düzenleme yap
node.characters = "Yeni metin";
return { id: node.id };
```

Metin düzenlemeden önce font yüklenmezse hata alırsın. Mevcut fontları keşfetmek için `await figma.listAvailableFontsAsync()` kullan.

## Auto Layout

```js
const frame = figma.createAutoLayout();
// Mutlak koordinat kullanma — auto layout container için
```

## Node ID Yönetimi

- ID'leri her zaman önceki çağrının return değerinden oku.
- Asla ID tahmin etme veya bellekten yeniden oluşturma.
- Her oluşturma/değiştirme işleminden etkilenen tüm node ID'lerini döndür.

## Validasyon

Her önemli adımdan sonra doğrula:
- `get_metadata` — yapısal kontrol
- `get_screenshot` — görsel kontrol

## Yaygın Hatalar

| Hata | Çözüm |
|---|---|
| Sync page setter | `await figma.setCurrentPageAsync(page)` kullan |
| `figma.notify()` | Kaldır — implement edilmemiş |
| Unawaited Promise | Tüm async çağrıları `await` ile bekle |
| `layoutSizing` parent'a eklenmeden önce set edildi | Önce parent'a ekle, sonra sizing ayarla |
| IIFE wrapper | Gerek yok — async context otomatik |

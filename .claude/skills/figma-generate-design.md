---
name: figma-generate-design
description: Mevcut design system kütüphanesini kullanarak Figma'da ekran, modal, drawer ve çok bölümlü UI container'ları oluşturur veya günceller.
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-generate-design/SKILL.md
last_checked: 2026-08-28
---

# figma-generate-design

Design system component'larını kullanarak Figma'da tam ekranlar ve UI container'ları üretir.
**Önce `figma-use` skill'ini yükle.**

## Adım 1 — Çıktıyı Anla

- İlgili kaynak dosyaları oku, ana bölümleri belirle.
- Ürünün gerçek font ailesini bul — Inter varsayma.
- Görseller varsa ve web uygulamasıysa paralel `generate_figma_design` çalıştır.

## Adım 2 — Design System Varlıklarını Topla

**Component'lar:**
1. Code Connect dosyalarından component key'lerini bul.
2. Mevcut ekranlardan component instance'larını incele.
3. Son çare: `search_design_system` ile ara.

**Değişkenler:**
- `get_libraries` ile kütüphane listesini al.
- Sadece local değişkenlere bakma — kütüphane değişkenlerini de dahil et.

**Stiller:**
- Text style ve effect style'ları tanımla.

## Adım 3 — Wrapper Frame Oluştur

Mevcut içerikten uzakta, izolasyonda oluştur. `figma.createAutoLayout()` kullan. Frame ID'sini döndür.

## Adım 4 — Bölümleri Sırayla İnşa Et

Her bölüm için ayrı `use_figma` çağrısı:
- Design system bağımlılıklarını import et.
- Component instance'larını wrapper'a ekle.
- `setProperties()` ile text override'larını uygula — component property key'lerini keşfetmeden kullanma.
- Variable'ları bağla — hardcode renk/spacing kullanma.

## Adım 5 — Doğrula ve Görselleri Aktar

- Her bölümü `get_screenshot` ile kontrol et.
- Typography, spacing, renk ve text rendering'i doğrula.
- Paralel `generate_figma_design` çekilmişse image hash'lerini kopyala.

## Adım 6 — Mevcut Görünümleri Güncelle

Yeni oluşturma değil güncelleme söz konusuysa:
- Mevcut node'ları bul.
- Component'ları swap et, property'leri güncelle.
- Değişikliği doğrula.

## Kritik Kurallar

- **Hardcode renk/spacing kullanma** — design system variable'ları var.
- **İlk geçişte component'laştır** — tekrarlayan elementleri.
- **SVG ikonları codebase'den import et** — elle yeniden oluşturma.
- **Font ailesini script başarısından sonra da doğrula** — başarılı script tipografiyi garanti etmez.
- **Bölüm bölüm çalış** — her bölümden sonra doğrula.
- **`use_figma` çağrılarını asla paralelize etme** — kesinlikle sıralı.
- **Design system instance'larını tercih et** — manuel frame yapımından önce.

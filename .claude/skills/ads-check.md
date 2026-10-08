---
name: ads-check
description: Mevcut projenin tüm HTML/CSS çıktılarını çapraz sayfa tutarlılık açısından kontrol eder. Ortak elementlerin (nav, header, footer) sayfalar arasında tutarlı olup olmadığını, token bağlantılarının doğru uygulandığını ve hardcode değer karışıklığı olmadığını doğrular. Sunum öncesi veya büyük değişiklikler sonrasında çalıştırılır.
---

# adStudio Check — Çapraz Sayfa Tutarlılık Kontrolü

## Durum Yönetimi

Başlamadan önce mevcut state dosyasını kontrol et:
```bash
ls /tmp/ads-check-*.json 2>/dev/null
```
Dosya varsa kullanıcıya "kaldığım yerden devam et / yeni başlat" sor.
Her adım tamamlandığında `/tmp/ads-check-{RUN_ID}.json` dosyasını güncelle.
Başarıyla tamamlanınca dosyayı sil.

---

## Token Standartları

Token JSON okurken `.claude/references/token-standards.md` dosyasını referans al.
Geçerli source değerleri ve zorunlu koleksiyonlar orada tanımlıdır.

---

## Ön Koşul Kontrolü

`project-state.md` dosyasını proje kökünde oku. Varsa:
- Üretilen dosya listesini buradan al
- Çıktı formatını doğrula (`html` değilse dur: "Bu kontrol yalnızca HTML/CSS çıktıları için geçerlidir.")

`project-state.md` yoksa `components/` ve `screens/` klasörlerini tara.
Hiç `.html` dosyası bulunamazsa dur:
> "Kontrol edilecek HTML dosyası bulunamadı. Önce `/ads-design-strategy` ile çıktı üretin."

---

## Adım 0 — Bağlam

Karşılaştırmaya başlamadan önce şunları topla:

- **`color_scheme`** — `spec.md → token_directives` (`light` / `dark` / `both`)
- **`[Korunan]` maddeler** — `spec.md → ## Bağlayıcı Kararlar` (yoksa `extension-spec.md → ## Korunacaklar`)
- **Accent ve radius token'ları** — token JSON'dan `color-accent` (veya accent rolündeki token) ve `Layout` radius değerleri
- **Ekran tipleri** — her ekran dosyasındaki `<body data-page-kind="marketing|product|content">`
- **Seviye ölçeği** — `.claude/references/reviewer-checklist.md → Seviye Ölçeği` (Blocker / High / Medium / Nitpick)

`spec.md` yoksa 2j (Korunan öğeler) ve 2k (Dark mode) bölümlerini
"Kontrol edilmedi — spec.md yok" olarak raporla, diğer kontrollere devam et.

---

## Adım 1 — Ortak Element Tespiti

Tüm `.html` dosyalarını oku. Aşağıdaki yapıları her sayfada tespit et:

| Element | Tespit kriteri |
|---------|----------------|
| Navigasyon | `<nav>`, `role="navigation"`, `class` içinde `nav` / `menu` / `header` geçenler |
| Header | `<header>`, `role="banner"` |
| Footer | `<footer>`, `role="contentinfo"` |
| Sidebar | `role="complementary"`, `class` içinde `sidebar` / `aside` geçenler |

Her tespit edilen element için hangi sayfalarda göründüğünü kaydet.
Yalnızca tek sayfada görünen elementleri bu kontrole dahil etme.

---

## Adım 2 — Tutarlılık Karşılaştırması

2a-2f her **ortak element** (Adım 1) için çalışır. 2g-2k **sayfa genelidir** —
yalnızca ortak elementlerle sınırlı değildir, tüm sayfaların tamamını karşılaştırır.

### 2a — Yapısal Tutarlılık
- Alt element sayısı ve sırası aynı mı?
- Class isimleri tutarlı mı?
- Eksik veya fazla element var mı?

### 2b — Token Tutarlılığı
- CSS değerleri `var(--token-adı)` ile mi yazılmış, hardcode mu?
- Aynı element farklı sayfalarda farklı token kullanıyor mu?
- Bir sayfada token, diğerinde hardcode değer var mı?

### 2c — Görsel Değer Tutarlılığı
Hardcode değer kullanan elementlerde:
- Aynı renk, farklı sayfalarda farklı hex kodu ile mi yazılmış? (örn. `#1a73e8` vs `#1A73E8` vs `rgb(26,115,232)`)
- Font size veya spacing değerleri sayfalar arasında farklı mı?

### 2d — İçerik Tutarlılığı
- Navigasyon link metinleri tüm sayfalarda aynı mı?
- Link href değerleri tutarlı mı?
- Icon veya görsel referanslar aynı mı?

### 2e — İkon Disiplini Tutarlılığı
- Emoji ikon olarak kullanılmış mı? (🎨 🚀 ⚙️ gibi) → High
- Aynı hiyerarşi seviyesinde filled ve outline ikon karışık mı? (örn. nav'da filled Home + outline Settings) → High
- Farklı sayfalarda aynı element için farklı ikon ailesi kullanılmış mı? → High
- SVG/vector ikon yerine raster (PNG) kullanılmış mı? → Medium

### 2f — Metadata Tutarlılığı
Her `.html` dosyasının `<head>` bölümünde:
- `<!-- Designed by: adesso Turkey -->` yorumu mevcut mu? → yoksa Kural (etki: Nitpick)
- `<meta name="author" content="adesso Turkey">` etiketi mevcut mu? → yoksa Kural (etki: Nitpick)
- `generator`, `ai`, `claude`, `artificial intelligence` içeren `<meta>` etiketi var mı? → varsa Kural (etki: Nitpick)
- Yapay zeka kökenini ima eden HTML yorumu var mı? → varsa Kural (etki: Nitpick)
- `screens/` altındaki dosyalarda `<body data-page-kind="marketing|product|content">` var mı? → yoksa Medium

### 2g — Accent Kilidi
*Kural: `reviewer-checklist.md` → HTML i*

Her sayfada birincil vurgu rollerindeki renkleri topla: CTA arka planı, link rengi,
focus ring, aktif/seçili durum. Accent token'ının değerinden (veya `var(--color-accent)`'tan)
farklı, doymuş bir renk bu rollerden birinde kullanılıyorsa → High.
Nötr tonlar (gri, off-white, off-black) ve semantic durum renkleri (hata, başarı, uyarı) bu kontrole girmez.

### 2h — Radius Kilidi
*Kural: `reviewer-checklist.md` → HTML i*

Element tipine göre (buton, kart, input, modal, badge) `border-radius` değerlerini
sayfalar arasında karşılaştır:
- Aynı element tipi farklı sayfalarda farklı radius kullanıyor → High
- Sayfa genelinde birden fazla radius sistemi var (ör. bir sayfada keskin kartlar, başka sayfada
  16px kartlar) ve bu bir kural olarak belgelenmemiş → High

### 2i — CTA Etiket Tutarlılığı
*Kural: `reviewer-checklist.md` → HTML i*

Tüm sayfalardaki buton ve CTA metinlerini topla. Href hedefine ve anlama göre niyete grupla:
iletişim, kayıt / ücretsiz deneme, satın alma, demo, portfolyo / çalışmaları görme.
Aynı niyet için birden fazla etiket (ör. bir sayfada "Bize ulaşın", diğerinde "Konuşalım") → High.
Önerilen düzeltme: en çok kullanılan etiketi tüm sayfalarda tek etiket yap.

### 2j — Korunan Öğeler
*Kural: `reviewer-checklist.md` → HTML m*

Her `[Korunan]` maddeyi tüm sayfalarla karşılaştır:
- Nav ve footer etiketleri korunan metinle birebir aynı mı?
- Sayfa yolları / dosya adları ve bu sayfalara giden `href`'ler değişmemiş mi?
- Form alanlarının `name` değerleri ve sırası korunmuş mu?
- Logo / wordmark dosyası ve kullanımı aynı mı?
- Yasal metin (KVKK, çerez, aydınlatma) linkleri ve metinleri yerinde mi?
- Analytics'e bağlı `id` ve `data-*` özellikleri duruyor mu?

Herhangi bir sapma → Kural (etki: Medium; kullanıcıyı gerçekten şaşırtıyorsa High). `[Korunan]` madde yoksa bu bölümü atla.

### 2k — Dark Mode Tutarlılığı
*Kural: `reviewer-checklist.md` → HTML l — yalnızca `color_scheme: both` veya `dark`*

- Her sayfada koyu tema blokları var mı (`[data-theme="dark"]` ve
  `@media (prefers-color-scheme: dark)`; `dark` modunda `:root` içinde koyu set)? → yoksa High
- Sayfalar koyu blokta aynı semantic değişken setini tanımlıyor mu? Bir sayfada eksik
  değişken (ör. `--color-border-default` koyu blokta yok) → Medium
- Koyu tema değerleri sayfalar arasında aynı mı? Farklı değer → Medium

`color_scheme: light` ise bu bölümü atla.

### 2l — Font Rolü, Eyebrow ve Kullanıcı Metni Tutarlılığı
*Kural: `reviewer-checklist.md` → HTML h*

- Display öğeleri (h1–h3, hero başlığı) her sayfada `var(--font-family-display)`, gövde/buton/form/nav
  `var(--font-family-body)` mı? Bir sayfada rol karışmış (ör. nav display fontuyla) → Medium
- Eyebrow / kicker: Bağlayıcı Kararlar'da istisna yoksa hiçbir sayfada olmamalı → Medium. İstisna varsa
  yalnızca istisnanın kapsamındaki öğelerde (`data-eyebrow-allowed`) ve her sayfada aynı biçimde → farklıysa Medium
- `data-copy="user"` işaretli aynı kullanıcı metni (slogan, yasal metin) sayfalar arasında birebir aynı mı?
  Bir sayfada değiştirilmiş → High
- Aynı giriş animasyonu sayfa başına ≤ 2 section mı? (`tells.mjs` sonucu) → aşım Medium

### 2m — Platform Tutarlılığı
*Kural: `references/mobile-platforms.md` — yalnızca `platform: app | both`*

- Her ekranda `data-platform` var mı ve değeri spec'teki `app_platforms` ile uyumlu mu? → eksik/uyumsuz Medium
- Aynı platformun ekranlarında sekme çubuğu / navigation bar aynı öğeleri aynı sırayla mı gösteriyor? → farklıysa High
- iOS ekranlarında Android kalıbı (FAB, Material dialog) veya tersi var mı? → High
- Aynı platformdaki ekranlar aynı cihaz çerçevesi ölçüsünü ve güvenli alan değerlerini mi kullanıyor? → farklıysa Medium

---

## Adım 3 — Rapor

Raporu şu yapıda yaz:

```
## Check Raporu — [proje adı]

### Teslim engelleri (Blocker, High ve Kural — açıkken teslime hazır değil)
- [B1] [etki: Nitpick · Kural] [element] — [sayfa]: [ne] → [ne yapılmalı]

### Blocker (sayfa erişilemiyor veya kullanıcı görevi tamamlayamaz)
- [element] — [sayfa A] vs [sayfa B]: [ne farklı] → [ne yapılmalı]

### High (kullanıcı fark eder — düzeltilmeli)
- ...

### Medium (görsel fark yok ama teknik tutarsızlık)
- ...

### Nitpick (çok küçük, isteğe bağlı)
- Nit: ...
```

**Örnek bulgular:**
```
- [Blocker] <nav> — screens/login.html vs screens/dashboard.html: dashboard'da "Profil" linki eksik → tüm sayfalara ekle
- [High] <nav> background — screens/login.html: var(--color-surface) | screens/settings.html: #ffffff → token kullanımını birleştir
- [High] İkon stili — screens/home.html: filled ikonlar | screens/profile.html: outline ikonlar → tek stil seç
- [Medium] <footer> font-size — screens/login.html: 12px | screens/dashboard.html: var(--text-sm) → token'a bağla
- [Kural · etki: Medium] Korunan nav etiketi — screens/pricing.html: "Krediler" | korunan: "Bireysel Krediler" → korunan etiketi geri yükle
- [High] Accent — screens/pricing.html CTA: #2563eb | diğer sayfalar: var(--color-accent) → token'a bağla
- [High] CTA etiketi (iletişim) — screens/home.html: "Bize ulaşın" | screens/about.html: "Konuşalım" → tek etiket seç
```

Bulgu yoksa:
> "Çapraz sayfa kontrolü tamamlandı — tutarlılık sorunu bulunamadı."

---

## Adım 4 — Sonraki Adım

Bulgu varsa kullanıcıya sor:
> "[n] tutarlılık sorunu tespit edildi. Bunları düzeltmemi ister misiniz?
> `[ ] Evet, düzelt` → `/ads-iterate` ile her bulguyu uygula
> `[ ] Hayır, raporu kaydet` → bulguları `check-report.md` olarak kaydet"

`check-report.md` formatı:
```markdown
# [Proje Adı] — Check Raporu
Tarih: [tarih]
Toplam bulgu: [n]

## Bulgular
[liste]
```

---

## Kısıtlamalar

- Yalnızca HTML/CSS modunda çalışır (Figma modu için Figma'nın kendi tutarlılık araçları kullanılır)
- Hiçbir şeyi kendisi düzeltmez — raporlar ve `/ads-iterate`'e devreder
- `spec.md` veya token dosyasını değiştirmez

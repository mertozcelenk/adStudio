---
name: ads-check
description: Mevcut projenin tüm ekranlarını (HTML/CSS veya Figma) çapraz sayfa tutarlılık açısından kontrol eder. Ortak elementlerin (nav, header, footer, sekme çubuğu) ekranlar arasında tutarlı olup olmadığını, token bağlantılarını, koparılmış component kopyalarını ve hardcode değer karışıklığını doğrular. Sunum öncesi veya büyük değişiklikler sonrasında çalıştırılır.
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

`project-state.md` dosyasını proje kökünde oku. Varsa üretilen ekran listesini ve `cikti_formati`'nı buradan al.

- `cikti_formati: html` → kontrol dosyası `.claude/references/review-html.md`
- `cikti_formati: figma` → kontrol dosyası `.claude/references/review-figma.md`; Figma linki `project-state.md → figma_linki`.
  Önce link tabanlı araçlar (`mcp__plugin_figma_figma__*`), erişilemezse masaüstü araçları.

Yalnızca çıktı türünün kontrol dosyasını oku; öteki türün dosyasını okuma.

`project-state.md` yoksa `components/` ve `screens/` klasörlerini tara (HTML). Hiç ekran bulunamazsa dur:
> "Kontrol edilecek ekran bulunamadı. Önce `/ads-design-strategy` ile çıktı üretin."

---

## Adım 0 — Bağlam

`.claude/references/rules.md`'yi oku (Seviye Ölçeği, kural tablosu — özellikle CP). Karşılaştırmaya başlamadan önce topla:

- **`color_scheme`** — `spec.md → token_directives` (`light` / `dark` / `both`)
- **`[Korunan]` maddeler** — `spec.md → ## Bağlayıcı Kararlar` (yoksa `extension-spec.md → ## Korunacaklar`)
- **Accent ve radius token'ları** — token JSON'dan accent rolündeki token ve `Layout` radius değerleri
- **Ekran tipleri ve platform** — HTML'de `<body data-page-kind / data-platform>`, Figma'da ekran annotation'ı

`spec.md` yoksa RK ve DM kontrollerini "Kontrol edilmedi — spec.md yok" olarak raporla, diğerlerine devam et.

---

## Adım 1 — Ortak element tespiti

Kontrol dosyasının **CP** bölümündeki tanıma göre ortak öğeleri bul (HTML: etiket / rol; Figma: iki ya da daha fazla
ekranda bulunan aynı component'in instance'ları) ve her birinin hangi ekranlarda göründüğünü kaydet.
Yalnızca tek ekranda görünen öğeleri karşılaştırmaya dahil etme.

---

## Adım 2 — Tutarlılık karşılaştırması

Her kuralı **ekranları birbiriyle karşılaştırarak** uygula; nasıl kontrol edileceği kontrol dosyasındaki ilgili satırdadır,
seviye `rules.md`'den gelir. Kapsam etiketi uymayan ya da kontrol dosyasında `yalnızca HTML` / `Figma'da henüz yok`
işaretli kuralı "N/A — [neden]" diye yaz.

| Ne | Kurallar |
|---|---|
| Ortak öğeler (yapı, token, değer yazımı, gezinme, ikonlar) | CP-1, CP-2, CP-3, CP-4, CP-5 |
| Accent ve radius kilidi (ekranlar arası) | TL-1, TL-2 |
| Aynı niyete tek CTA etiketi (tüm ekranlardaki buton metinleri niyete göre gruplanır; öneri: en çok kullanılan etiket) | TL-3 |
| Korunan öğeler (her `[Korunan]` madde tüm ekranlarla) | RK-1 |
| Metadata ve işaretler her ekranda | MD-1, MD-2, MD-3, MD-4, MD-5 |
| Koyu tema [dark] | DM-1, CP-6 |
| Font rolleri, eyebrow, kullanıcı metni | CP-9, AT-4, CP-7 |
| Tekrarlı giriş animasyonu (HTML, `tells.mjs` sonucu) | MO-7 |
| Platform [uygulama] | MD-4, CP-8, APP-9 |
| Yapı işaretleri ekranlar arasında (`yapi` varsa) | ST-8 |

---

## Adım 3 — Rapor

Raporu şu yapıda yaz:

```
## Check Raporu — [proje adı]

### Teslim engelleri (Blocker, High ve Kural — açıkken teslime hazır değil)
- [B1] [kimlik] · [etki: Nitpick · Kural] [element] — [ekran]: [ne] → [ne yapılmalı]

### Blocker (sayfa erişilemiyor veya kullanıcı görevi tamamlayamaz)
- [kimlik] · [element] — [ekran A] vs [ekran B]: [ne farklı] → [ne yapılmalı]

### High (kullanıcı fark eder — düzeltilmeli)
- ...

### Medium (görsel fark yok ama teknik tutarsızlık)
- ...

### Nitpick (çok küçük, isteğe bağlı)
- Nit: ...
```

**Örnek bulgular:**
```
- CP-1 · [Blocker] <nav> — screens/login.html vs screens/dashboard.html: dashboard'da "Profil" linki eksik → tüm sayfalara ekle
- CP-2 · [High] <nav> background — screens/login.html: var(--color-surface) | screens/settings.html: #ffffff → token kullanımını birleştir
- CP-5 · [High] İkon stili — screens/home.html: filled ikonlar | screens/profile.html: outline ikonlar → tek stil seç
- TK-1 · [Medium] <footer> font-size — screens/login.html: 12px | screens/dashboard.html: var(--text-sm) → token'a bağla
- RK-1 · [Kural · etki: Medium] Korunan nav etiketi — screens/pricing.html: "Krediler" | korunan: "Bireysel Krediler" → korunan etiketi geri yükle
- TL-1 · [High] Accent — screens/pricing.html CTA: #2563eb | diğer sayfalar: var(--color-accent) → token'a bağla
- TL-3 · [High] CTA etiketi (iletişim)
- CP-1 · [High] Sekme çubuğu — Figma "Ayarlar": koparılmış instance, "Kitaplık" öğesi yok | diğer ekranlar: iOS/TabBar instance → instance'ı geri bağla — screens/home.html: "Bize ulaşın" | screens/about.html: "Konuşalım" → tek etiket seç
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

- HTML ve Figma çıktısında çalışır; yalnızca çıktı türünün kontrol dosyasını okur
- Hiçbir şeyi kendisi düzeltmez — raporlar ve `/ads-iterate`'e devreder
- `spec.md` veya token dosyasını değiştirmez

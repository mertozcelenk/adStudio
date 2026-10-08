---
name: ads-inspect
description: Belirli bir UI elementini mekanik olarak tarar — touch target, hardcode renk, token bağlantısı, emoji ikon, label eşleşmesi. Pipeline çalıştırılmamış quick/sunum tasarımlarında da çalışır. Tam heuristic analiz için ads-ux-reviewer'ı çağırma seçeneği sunar.
---

# adStudio Inspect — Element Bazlı Mekanik Kontrol

## Hedef

Tüm pipeline'ı çalıştırmadan belirli bir UI elementini grep ile kontrol eder.
Yalnızca mekanik olarak doğrulanabilen (●) bulgular üretir — heuristic değerlendirme yapmaz.

---

## Ön Koşul Kontrolü

`project-state.md` dosyasını proje kökünde oku. Varsa:
- Üretilen dosya listesini ve çıktı formatını buradan al.

`project-state.md` yoksa `components/` ve `screens/` klasörlerini tara:
```bash
find . -name "*.html" -not -path "./.claude/*" | head -30
```

Hiç `.html` dosyası bulunamazsa dur:
> "Kontrol edilecek HTML dosyası bulunamadı. Önce `/ads-design-strategy` ile bir tasarım çıktısı üretin veya HTML dosyalarının bulunduğu dizinde çalıştırın."

---

## Adım 1 — Element Tipini Belirle

Kullanıcı element tipini belirttiyse direkt Adım 2'ye geç.

Belirtmediyse sor:
> "Hangi elementi kontrol etmemi istersiniz?
> 1. Butonlar ve CTA'lar
> 2. Tipografi ve font boyutları
> 3. Form alanları
> 4. Navigasyon
> 5. Kartlar
> 6. Tümü"

---

## Adım 1b — Bağlam ve Otomatik Ölçüm

**Bağlam:**
- `spec.md` varsa `## Bağlayıcı Kararlar` içindeki `[Korunan]` maddeleri oku
  (yoksa `extension-spec.md → ## Korunacaklar`; ikisi de yoksa Korunan kontrolleri atlanır).
- Her ekran dosyasının `<body data-page-kind>` değerini not et — `[marketing]` işaretli
  kontroller yalnızca `marketing`, `[content]` işaretli kontroller yalnızca `content` ekranlarda uygulanır.
- Seviyeler `.claude/references/reviewer-checklist.md → Seviye Ölçeği`'nden gelir.

**Otomatik ölçüm:** `scripts/test/tells.mjs` varsa çalıştır:

```bash
node scripts/test/tells.mjs
```

Çıktıdan yalnızca seçilen element tipine ait bulguları rapora ● olarak al:

| Element tipi | tells.mjs bulguları |
|---|---|
| Butonlar | CTA satır kayması, buton metnindeki em/en-dash |
| Tipografi | Em/en-dash (`data-copy="user"` hariç), eyebrow, okuma genişliği, başlık ritmi, metin örtüşmesi |
| Navigasyon | Nav yüksekliği, tek satır |

Script yoksa veya Playwright çalışmazsa bu ölçümleri "Kontrol edilmedi → belirsiz"
bölümüne yaz — tahmini sonuç üretme.

---

## Adım 2 — Mekanik Kontroller

### Butonlar

```bash
# Hardcode renk
grep -rn "background.*#\|color.*#\|border.*#" components/ screens/ 2>/dev/null | grep -i "btn\|button"

# İkon-only buton — aria-label kontrolü
grep -rn "<button[^>]*>.*<svg\|<button[^>]*>.*<img" components/ screens/ 2>/dev/null

# Birden fazla primary CTA aynı sayfada mı?
grep -rn "class.*primary\|type=\"submit\"" components/ screens/ 2>/dev/null

# Buton / CTA etiketleri (niyet tutarlılığı için)
grep -rnoE "<(button|a)[^>]*(btn|button|cta)[^>]*>[^<]+" screens/ 2>/dev/null
```

Kontrol edilecekler:
- [ ] Buton renkleri `var(--*)` ile mi tanımlı? Hardcode `#` değer var mı?
- [ ] İkon-only butonlarda `aria-label` var mı?
- [ ] Bir sayfada birden fazla primary CTA var mı?
- [ ] Aynı niyete (iletişim, kayıt/deneme, satın alma, demo) aynı sayfada veya sayfalar arasında
  farklı etiket var mı? (ör. "Bize ulaşın" + "Konuşalım") → High *(checklist HTML i)*
- [ ] Desktop'ta iki satıra kayan CTA var mı? (tells.mjs) → High *(checklist HTML i)*
- [ ] Buton metninde em-dash (`—`) veya en-dash (`–`) var mı? → Kural (etki: Nitpick) *(checklist HTML h)*
- [ ] Touch target: web'de tıklanabilir kutu ≥ 44×44px (24 altı High); uygulama ekranında (`data-platform="ios|android"`)
  iOS ≥ 44pt / Android ≥ 48dp + 8dp aralık (tells.mjs `@375` / uygulama bulguları) *(checklist HTML q / r)*
  ```bash
  grep -rn "min-height\|padding" components/ screens/ 2>/dev/null | grep -i "btn\|button"
  ```

---

### Tipografi

```bash
# Hardcode font-size
grep -rn "font-size: [0-9]" components/ screens/ 2>/dev/null

# Başlık hiyerarşisi
grep -rn "<h[1-6]" components/ screens/ 2>/dev/null | sort

# Emoji ikon — yalnızca emoji aralıkları (Türkçe karakterleri yakalamaz; macOS ve Linux'ta çalışır)
find components/ screens/ -name "*.html" 2>/dev/null | xargs perl -CSD -ne \
  'print "$ARGV:$.: $_" if /[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]/; close ARGV if eof'

# Em-dash / en-dash
grep -rn "—\|–" components/ screens/ 2>/dev/null | grep -v "<!--"
```

Kontrol edilecekler:
- [ ] Body metin font-size ≥ 16px mi? (12px altı: Blocker, 13–15px: High, 16px altı body: Medium)
- [ ] Font-size değerleri `var(--font-size-*)` veya `var(--text-*)` mi?
- [ ] Başlık hiyerarşisinde atlama var mı? (h1'den h3'e geçiş gibi)
- [ ] Emoji ikon olarak kullanılmış mı?
- [ ] Görünür metinde, `alt` veya `aria-label`'da em-dash (`—`) veya ayraç en-dash (`–`) var mı? `data-copy="user"` içindeki kullanıcı metni muaf → Kural (etki: Nitpick) *(checklist HTML h)*
- [ ] Başlık üstünde eyebrow / kicker var mı? Bağlayıcı Kararlar istisnası yoksa (tells.mjs) → Medium *(checklist HTML h)*
- [ ] Display öğeleri `--font-family-display`, gövde `--font-family-body` mi? → değilse Medium *(checklist HTML h)*
- [ ] [content] Gövde satır genişliği ≤ ~75 karakter, başlıkların üst boşluğu alt boşluğundan büyük mü? (tells.mjs) → Medium *(checklist HTML o)*

---

### Form Alanları

```bash
# Label–input eşleşmesi
grep -rn "<label\|<input\|<textarea\|<select" components/ screens/ 2>/dev/null

# Zorunlu alan belirtimi
grep -rn "required\|aria-required" components/ screens/ 2>/dev/null

# Placeholder-only kullanımı
grep -rn "placeholder=" components/ screens/ 2>/dev/null
```

Kontrol edilecekler:
- [ ] Her `<input>` / `<textarea>` için `<label for="">` + eşleşen `id` var mı?
- [ ] Zorunlu alanlar `required` veya `aria-required` ile belirtilmiş mi?
- [ ] Placeholder, label'ın yerini tutuyor mu? (label yoksa sorun)
- [ ] `[Korunan]` form alanlarının `name` değerleri ve sırası korunmuş mu? → değilse Kural (etki: Medium) *(checklist HTML m)*
  ```bash
  grep -rnoE "<(input|select|textarea)[^>]*name=\"[^\"]+\"" screens/ 2>/dev/null
  ```
- [ ] Touch target: input min-height ≥ 44px mi?
  ```bash
  grep -rn "min-height\|height.*[0-9]" components/ screens/ 2>/dev/null | grep -i "input\|field\|form"
  ```

---

### Navigasyon

```bash
# nav elementi ve role
grep -rn "<nav\|role=\"navigation\"" components/ screens/ 2>/dev/null

# Aktif sayfa işareti
grep -rn "aria-current" components/ screens/ 2>/dev/null

# İkon stili karışıklığı
grep -rn "filled\|outline\|stroke\|solid" components/ screens/ 2>/dev/null | grep -i nav
```

Kontrol edilecekler:
- [ ] Navigasyon `<nav>` veya `role="navigation"` ile sarmalanmış mı?
- [ ] Aktif sayfa `aria-current="page"` ile işaretlenmiş mi?
- [ ] Aynı nav içinde filled + outline ikon karışımı var mı?
- [ ] Alt navigasyon / sekme çubuğu — iOS 2–5, Android 3–5 öğe mi? Dışında → Medium *(checklist HTML r)*
- [ ] Uygulama ekranında menü platformun mu (tab bar / navigation bar), kendi icadı global menü yok mu? → değilse High *(mobile-platforms.md → 5)*
- [ ] [marketing] Desktop'ta nav tek satır ve ≤ 80px mi? (tells.mjs) → değilse High *(checklist HTML j)*
- [ ] `[Korunan]` nav etiketleri ve `href`'leri korunan değerle birebir aynı mı? → değilse Kural (etki: Medium) *(checklist HTML m)*

---

### Kartlar

```bash
# Çakışan bağlantı
grep -rn "<a " components/ screens/ 2>/dev/null | grep -i card

# Görsel alt attribute
grep -rn "<img" components/ screens/ 2>/dev/null | grep -v "alt="

# Hardcode renk
grep -rn "background.*#\|border.*#" components/ screens/ 2>/dev/null | grep -i card

# 3 eşit kolonlu grid
grep -rnE "grid-template-columns:\s*(repeat\(3,\s*(1fr|minmax\([^)]*\))\)|1fr 1fr 1fr)" components/ screens/ 2>/dev/null
```

Kontrol edilecekler:
- [ ] Tıklanabilir kartlarda çakışan çoklu `<a>` var mı?
- [ ] Kart görselleri `alt` attribute içeriyor mu?
- [ ] Kart arka plan ve kenarlık renkleri `var(--*)` mi?
- [ ] [marketing] Feature kartları 3 eşit kolon halinde mi dizilmiş? → Medium *(checklist AI Tells → Layout)*

---

## Adım 3 — Rapor

```
## Inspect Raporu — [element tipi] / [proje adı veya dosya adı]

### Kural  (şirket/proje kuralı — etkisi düşük olabilir ama teslimi engeller)
- [etki: Nitpick] [ne gözlemlendi] — [dosya:satır] → [ne yapılmalı]

### Blocker  (erişilebilirlik ihlali veya kullanıcı görevi tamamlayamaz)
- [●] [ne gözlemlendi] — [dosya:satır] → [ne yapılmalı]

### High  (ciddi sorun — düzeltilmeli)
- ...

### Medium  (teknik tutarsızlık — gönderilebilir ama düzeltilmeli)
- ...

### Nitpick  (küçük, isteğe bağlı)
- Nit: ...

### Kontrol edilmedi → belirsiz
- [kontrol adı] — [neden kontrol edilemedi]
```

Tüm bulgular `●` — mekanik doğrulanmış. Bu rapor heuristic değerlendirme içermez.

Bulgu yoksa:
> "[element tipi] mekanik kontrolü tamamlandı — sorun bulunamadı."

---

## Adım 4 — Tam Analiz Seçeneği

Raporu sunduktan sonra kullanıcıya sor:

> "Mekanik kontrol tamamlandı. Heuristic analiz (Nielsen 10, WCAG POUR, component binding) için ads-ux-reviewer'ı da çalıştırmamı ister misiniz?"

Kullanıcı onaylarsa şunları topla ve `ads-ux-reviewer` agent'ına ilet:
- Taranan HTML dosyalarının listesi
- `spec.md` varsa yolu (yoksa bunu belirt)
- `[proje-adı]-tokens.json` varsa yolu
- Bu inspect raporundaki bulgular (ads-ux-reviewer aynı bulguları tekrar etmez)
- `project-state.md` yoksa: "Pipeline çalıştırılmamış — spec ve brief mevcut değil"

---

## Adım 5 — Düzeltme Seçeneği

Blocker veya High bulgu varsa ve kullanıcı ads-ux-reviewer'ı çalıştırmak istemiyorsa:

> "Bulguları düzeltmemi ister misiniz?
> `[ ] Evet, düzelt` → `/ads-iterate` ile her bulguyu uygula
> `[ ] Hayır, raporu kaydet` → bulguları `inspect-report.md` olarak kaydet"

`inspect-report.md` formatı:
```markdown
# Inspect Raporu — [element tipi]
Tarih: [tarih]
Toplam bulgu: [n]

## Bulgular
[liste]
```

---

## Kısıtlamalar

- Yalnızca HTML/CSS modunda çalışır
- Kural metinleri ve seviyeler `.claude/references/reviewer-checklist.md`'den gelir; bu skill
  yalnızca element bazlı alt kümesini uygular. Sayfalar arası tutarlılık (accent, radius,
  CTA etiketleri, dark mode) için `/ads-check` kullanılır
- Yalnızca mekanik (●) bulgular üretir — heuristic veya ○ insan testi değerlendirmesi yapmaz
- Hiçbir şeyi kendisi düzeltmez — raporlar, `/ads-iterate`'e veya `ads-ux-reviewer`'a devreder
- `project-state.md` zorunlu değil — quick mod ve sunum tasarımlarında da çalışır

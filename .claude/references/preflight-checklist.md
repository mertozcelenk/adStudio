# Pre-flight Checklist

ads-design-builder'ın teslimden **önce** kendi çıktısı üzerinde çalıştırdığı öz-kontrol.
Quick modda reviewer çalışmadığı için tek kalite kapısı budur; deep modda reviewer'ların
yükünü azaltır.

Kural metinleri burada tekrarlanmaz — her madde `references/reviewer-checklist.md`'deki
bölüme referans verir. Belirsiz kalan bir maddede o bölümü oku.

## Nasıl çalıştırılır

1. Her maddeyi işaretle: `✓` geçti · `✗` geçmedi · `N/A` uygulanmaz (gerekçesiyle).
2. `✗` olan her maddeyi **düzelt**, ardından tekrar işaretle.
3. Düzeltilemeyen `✗` kalırsa raporda nedenini yaz — tamamlanmış gibi gösterme.
4. `scripts/test/` varsa `node tells.mjs` çalıştır, sonucunu ilgili maddelere işle.
   Çalıştırılamazsa "tells.mjs çalıştırılamadı, kaynak analiziyle kontrol edildi" yaz.

`[marketing]` maddeleri yalnızca marketing ekranlarında, `[content]` maddeleri yalnızca content
ekranlarında, `[dark]` maddeleri yalnızca `color_scheme: both | dark` iken uygulanır.
`[web]` maddeleri web ekranlarında, `[uygulama]` maddeleri `data-platform="ios|android"` ekranlarda uygulanır;
uygulama ekranlarında `[marketing]`, `[content]` ve web hareket maddeleri N/A'dır (`references/mobile-platforms.md → 8`).

## Liste

**Metadata ve token**
- [ ] HTML `<head>`'de "Designed by: adesso Turkey" yorumu + `meta author`; yapay zeka iması yok (HTML g / Figma e)
- [ ] Ekranlarda `data-page-kind` (HTML) veya `page_kind` description satırı (Figma) mevcut (HTML g / Figma e)
- [ ] `platform: app | both` ise ekranlarda `data-platform` / `platform:` satırı mevcut (HTML g / Figma e)
- [ ] Renk, font, font-size, radius, spacing hardcode edilmemiş, hepsi token'a bağlı (HTML c / Figma c)
- [ ] `spec.md → Bağlayıcı Kararlar` maddelerinin hiçbiri ihlal edilmemiş; `[Korunan]` öğeler aynen korunmuş (HTML m / Figma j)

**AI tells**
- [ ] Görünür metin, `alt` ve `aria-label`'da sıfır em-dash (`—`) ve ayraç en-dash (`–`); kullanıcı metni `data-copy="user"` ile işaretli (HTML h)
- [ ] Div/dikdörtgenlerden sahte ürün UI yok (HTML h)
- [ ] Başlık üstünde eyebrow / kicker yok (Bağlayıcı Kararlar istisnası hariç, `data-eyebrow-allowed`) (HTML h)
- [ ] Display öğeleri `--font-family-display`, geri kalanı `--font-family-body` kullanıyor (HTML h)
- [ ] Işık halesi / spotlight, dekoratif ızgara veya çizgili zemin, sahte yanıp sönen imleç yok (Katalog → Görsel)
- [ ] Çıktı brief'teki "Reddettiği kalıp"a kaymamış; Kendi dünyası tarifiyle tutarlı (HTML h)
- [ ] Katalogdaki "Süs ve Meta Metinler" maddelerinin hiçbiri yok (Katalog)
- [ ] Placeholder isim, dolgu fiiller ("Seamless", "Elevate"), mükemmel sayılar yok (Katalog → İçerik)
- [ ] Görünür her metin yeniden okundu; dil bilgisi bozuk veya anlamsız ifade yok

**Tutarlılık kilitleri**
- [ ] Tek accent rengi, tüm ekranlarda aynı (HTML i)
- [ ] Tek radius sistemi veya belgelenmiş kural (HTML i)
- [ ] Her niyet için tek CTA etiketi; desktop'ta hiçbir CTA iki satıra kaymıyor (HTML i)
- [ ] Buton ve form öğeleri WCAG AA kontrastı geçiyor (HTML i, d)

**Layout [marketing]**
- [ ] Hero: başlık ≤ 2 satır, alt metin ≤ 20 kelime, ≤ 4 metin öğesi, CTA ilk görünümde, üst padding ≤ 96px (HTML j)
- [ ] Nav desktop'ta tek satır ve ≤ 80px (HTML j)
- [ ] VARIANCE > 4 ise hero ortalanmamış (HTML j)
- [ ] Layout ailesi tekrarı yok, zigzag ≤ 2 ardışık, bento hücre sayısı = içerik sayısı, split-header yok (HTML j)

**Okuma [content]**
- [ ] Gövde satır genişliği ≤ ~75 karakter; başlıkların üst boşluğu alt boşluğundan büyük; uzun sayfada gezinme var (HTML o)

**Kalite**
- [ ] Konsolda JS hatası yok; içerik JS olmadan da görünür (reveal başlangıcı gizli değil) (HTML p)
- [ ] Metin üstüne binen katman yok; kaydırılan kartlar iki yanda eşit boşluklu (HTML p)
- [ ] Görünmeyen arka plan görseli yok; aynı kartta 3+ tekrarlanan metin yok (HTML p)

**Mobil web [web @375]**
- [ ] Dokunulan her öğe ≥ 44×44px (24 altı yok, paragraf içi linkler muaf); hiçbir işlev yalnızca hover'a bağlı değil (HTML q)
- [ ] `100vh` yok (`svh`/`dvh`); `viewport-fit=cover` varsa sabit öğelerde `env(safe-area-inset-*)` (HTML q)

**Uygulama [uygulama]** (`references/mobile-platforms.md`)
- [ ] Cihaz çerçevesi (iOS 390×844 / Android 412×915), içerik ve kontroller güvenli alanın içinde (HTML r / Figma n)
- [ ] Dokunma alanı iOS ≥ 44pt / Android ≥ 48dp + 8dp aralık; sekme çubuğu iOS 2–5 / Android 3–5 (HTML r / Figma n)
- [ ] Platform kontrolleri kullanıldı (`component_source`'a göre), ikonlar `icon_source`'a göre; yeniden icat edilmiş kontrol yok (HTML r / Figma n)
- [ ] Ekran geçişleri sistemin, kaydırınca belirme yok; yazılar `rem` ile ve %130'da taşmıyor (HTML r)
- [ ] iOS + Android ise Platform Farkları parçalarının iki versiyonu var (HTML r / Figma n)

**Yapı [`yapi` varsa]** (`references/structure-standards.md`)
- [ ] Her ekranda `data-template` + `data-flow`; template'in bölgeleri ve zorunlu durumlarının hepsi var (HTML s / Figma o)
- [ ] Boş durumlar çıkmaz sokak değil; başka akışı başlatan eylem `data-flow-start` ile işaretli (HTML s / Figma o)
- [ ] Akış dalları (hata, iptal onayı) ve `Sonra` bağlantıları ekranda; Ortak Davranış uygulandı (HTML s / Figma o)
- [ ] `scripts/test/` varsa `node structure.mjs` geçti (HTML s)

**Mobil, tema, hareket**
- [ ] Her çok kolonlu section'ın 375px düzeni açıkça tanımlı (HTML k / Figma k)
- [ ] [dark] Koyu tema blokları/modları mevcut, kontrast iki temada da kontrol edildi (HTML l / Figma i)
- [ ] Animasyon miktarı MOTION değerine uygun; `prefers-reduced-motion` desteği var; `scroll` event listener yok (HTML n, e)
- [ ] MOTION ≥ 4 ise tek imza an var ve Tez'e bağlı; aynı giriş animasyonu ≤ 2 section; blur/mask/clip-path yalnızca MOTION ≥ 7'de ve geçişte (HTML n)

## Rapor formatı

Builder özetinin sonuna eklenir:

```
## Pre-flight
✓ 18 · ✗ 1 · N/A 2
✗ CTA satır kayması — "Ücretsiz denemeye başla" 1280px'te 2 satır; etiket kısaltılamadı, Açık Sorular'a eklendi
N/A Layout [marketing] — tüm ekranlar product
N/A [dark] — color_scheme: light
```

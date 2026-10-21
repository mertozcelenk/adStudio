# Pre-flight Checklist

ads-design-builder'ın teslimden **önce** kendi çıktısı üzerinde çalıştırdığı öz-kontrol.
Quick modda reviewer çalışmadığı için tek kalite kapısı budur; deep modda reviewer'ların
yükünü azaltır.

Kural metinleri burada tekrarlanmaz — her madde `references/rules.md`'deki kural kimliğine atıf yapar;
nasıl kontrol edileceği çıktı türünün dosyasındadır (`review-html.md` / `review-figma.md`). Belirsiz kalan
maddede kuralı ve o dosyadaki satırını oku. Figma'da `yalnızca HTML` / `Figma'da henüz yok` işaretli kurallar N/A'dır.

## Nasıl çalıştırılır

1. Her maddeyi işaretle: `✓` geçti · `✗` geçmedi · `N/A` uygulanmaz (gerekçesiyle).
2. `✗` olan her maddeyi **düzelt**, ardından tekrar işaretle.
3. Düzeltilemeyen `✗` kalırsa raporda nedenini yaz — tamamlanmış gibi gösterme.
4. `scripts/test/` varsa tells sonucunu ilgili maddelere işle: bu turda `run-all.mjs` çalıştırdıysan sonucu
   `test-results.json`'dan al (tells run-all'un içinde; `tells.mjs`'i ayrıca çalıştırma), çalıştırmadıysan `node tells.mjs`.
   Çalıştırılamazsa "tells.mjs çalıştırılamadı, kaynak analiziyle kontrol edildi" yaz.

`[marketing]` maddeleri yalnızca marketing ekranlarında, `[content]` maddeleri yalnızca content
ekranlarında, `[dark]` maddeleri yalnızca `color_scheme: both | dark` iken uygulanır.
`[web]` maddeleri web ekranlarında, `[uygulama]` maddeleri `data-platform="ios|android"` ekranlarda uygulanır;
uygulama ekranlarında `[marketing]`, `[content]` ve web hareket maddeleri N/A'dır (`references/mobile-platforms.md → 8`).

## Liste

**Metadata ve token**
- [ ] HTML `<head>`'de "Designed by: adesso Turkey" yorumu + `meta author` (MD-1, yalnızca HTML); yapay zeka iması yok (MD-2)
- [ ] Ekranlarda `data-page-kind` (HTML) veya `page_kind` annotation satırı (Figma) mevcut (MD-3); Figma'da ekranlar frame + `adStudio` annotation (MD-5)
- [ ] `platform: app | both` ise ekranlarda `data-platform` / `platform:` satırı mevcut (MD-4)
- [ ] Renk, font, font-size, radius, spacing hardcode edilmemiş, hepsi token'a bağlı (TK-1, TK-2)
- [ ] `spec.md → Bağlayıcı Kararlar` maddelerinin hiçbiri ihlal edilmemiş; `[Korunan]` öğeler aynen korunmuş (RK-3, RK-1, RK-2)

**AI tells**
- [ ] Görünür metin, `alt` ve `aria-label`'da sıfır em-dash (`—`) ve ayraç en-dash (`–`); kullanıcı metni `data-copy="user"` ile işaretli (AT-1)
- [ ] Div/dikdörtgenlerden sahte ürün UI yok (AT-2)
- [ ] Başlık üstünde eyebrow / kicker yok (Bağlayıcı Kararlar istisnası hariç, `data-eyebrow-allowed`) (AT-4)
- [ ] Display öğeleri `--font-family-display`, geri kalanı `--font-family-body` kullanıyor; display fontu kaçınma listesinden gerekçesiz değil (AT-3)
- [ ] Işık halesi / spotlight, dekoratif ızgara veya çizgili zemin, sahte yanıp sönen imleç, emoji ikon yok (AT-10); Figma'da ikon yer tutucusu varsa katman adı, annotation `not:` ve "elle yapılacak" maddesi üçü de var — öyleyse ✓ (bilinen sınır)
- [ ] Çıktı brief'teki "Reddettiği kalıp"a kaymamış; Kendi dünyası tarifiyle tutarlı (AT-11)
- [ ] Katalogdaki "Süs ve Meta Metinler" maddelerinin hiçbiri yok (AT-9)
- [ ] Placeholder isim, dolgu fiiller ("Seamless", "Elevate"), mükemmel sayılar yok (AT-7, AT-12); saf siyah / beyaz ve cream zemin yok (AT-8, AT-6); 3 eşit feature card yok (AT-5)
- [ ] Görünür her metin yeniden okundu; dil bilgisi bozuk veya anlamsız ifade yok

**Tutarlılık kilitleri**
- [ ] Tek accent rengi, tüm ekranlarda aynı (TL-1)
- [ ] Tek radius sistemi veya belgelenmiş kural (TL-2)
- [ ] Her niyet için tek CTA etiketi; desktop'ta hiçbir CTA iki satıra kaymıyor (TL-3, TL-4)
- [ ] Buton ve form öğeleri WCAG AA kontrastı geçiyor (TL-5, A11Y-2); yazı boyutları alt sınırın üstünde (A11Y-3)

**Layout [marketing]**
- [ ] Hero: başlık ≤ 2 satır, alt metin ≤ 20 kelime, ≤ 4 metin öğesi, CTA ilk görünümde, üst padding ≤ 96px; hero yasakları yok (LY-1, LY-2)
- [ ] Nav desktop'ta tek satır ve ≤ 80px (LY-5)
- [ ] VARIANCE > 4 ise hero ortalanmamış (LY-3); logo wall ayrı ve gerçek (LY-4)
- [ ] Layout ailesi tekrarı yok, zigzag ≤ 2 ardışık, bento hücre sayısı = içerik sayısı, split-header yok (LY-6, LY-7, LY-8, LY-9)

**Okuma [content]**
- [ ] Gövde satır genişliği ≤ ~75 karakter; başlıkların üst boşluğu alt boşluğundan büyük; uzun sayfada gezinme var; landing kalıbı akışı bölmüyor (OD-1, QA-5, OD-2, OD-3)

**Kalite**
- [ ] Konsolda JS hatası yok; içerik JS olmadan da görünür (reveal başlangıcı gizli değil) (QA-1, QA-2 — yalnızca HTML)
- [ ] Metin üstüne binen katman yok; kaydırılan kartlar iki yanda eşit boşluklu (QA-3, QA-4)
- [ ] Görünmeyen arka plan görseli yok; aynı kartta 3+ tekrarlanan metin yok (QA-6 yalnızca HTML, QA-7)

**Mobil web [web @375]**
- [ ] Dokunulan her öğe ≥ 44×44px (24 altı yok, paragraf içi linkler muaf); hiçbir işlev yalnızca hover'a bağlı değil (MW-1, MW-2); 375'te CTA tek satır (MW-5)
- [ ] `100vh` yok (`svh`/`dvh`); `viewport-fit=cover` varsa sabit öğelerde `env(safe-area-inset-*)` (MW-4, MW-3 — yalnızca HTML)

**Uygulama [uygulama]** (`references/mobile-platforms.md`)
- [ ] Cihaz çerçevesi (iOS 390×844 / Android 412×915), içerik ve kontroller güvenli alanın içinde (APP-1, APP-2)
- [ ] Dokunma alanı iOS ≥ 44pt / Android ≥ 48dp + 8dp aralık; sekme çubuğu iOS 2–5 / Android 3–5 (APP-3, APP-4)
- [ ] Platform kontrolleri kullanıldı (`component_source`'a göre), ikonlar `icon_source`'a göre; yeniden icat edilmiş kontrol yok; bir platformun kalıbı ötekinde yok (APP-7, APP-9, APP-10)
- [ ] Ekran geçişleri sistemin, kaydırınca belirme yok; yazılar `rem` ile ve %130'da taşmıyor (APP-8, APP-5, APP-6 — Figma'da henüz yok)
- [ ] iOS + Android ise Platform Farkları parçalarının iki versiyonu var; Tez yapıyı değiştirmemiş; tablet yeniden kurgulanmış (APP-11, APP-12, APP-13)

**Yapı [`yapi` varsa]** (`references/structure-standards.md`)
- [ ] Her ekranda `data-template` + `data-flow`; template'in bölgeleri ve zorunlu durumlarının hepsi var (ST-8, ST-1, ST-6)
- [ ] Boş durumlar çıkmaz sokak değil; başka akışı başlatan eylem `data-flow-start` ile işaretli (ST-2)
- [ ] Figma: bir ekranın ana ve durum frame'lerindeki annotation'lar birbiriyle çelişmiyor (varsayılan durum, akış adı); brief'in söylemediği varsayılan Açık Sorular'da (ST-8)
- [ ] Akış dalları (hata, iptal onayı) ve `Sonra` bağlantıları ekranda; Ortak Davranış uygulandı; tanımsız işlev yok (ST-3, ST-4, ST-5, ST-7)
- [ ] `scripts/test/` varsa `node structure.mjs` geçti (ST-8, yalnızca HTML); Figma'da `flows.md` ekran linkleri eklendi (ST-8)

**Spec ve erişilebilirlik**
- [ ] Kapsamdaki her ekran / component ve brief'teki durumlar üretildi; spec'in erişilebilirlik gereksinimi karşılandı (SP-1, SP-2, A11Y-1)

**Mobil, tema, hareket**
- [ ] Her çok kolonlu section'ın 375px düzeni açıkça tanımlı (MB-1)
- [ ] [dark] Koyu tema blokları/modları mevcut, kontrast iki temada da kontrol edildi; hiyerarşi korunuyor, renkler token'a bağlı, ters tema bölümü yok (DM-1 … DM-5)
- [ ] Animasyon miktarı MOTION değerine uygun; `prefers-reduced-motion` desteği var; `scroll` event listener yok (MO-5, MO-3, MO-4, MO-2)
- [ ] MOTION ≥ 4 ise tek imza an var ve Tez'e bağlı; aynı giriş animasyonu ≤ 2 section; blur/mask/clip-path yalnızca MOTION ≥ 7'de ve geçişte; durum noktaları gerçek veride; süs döngüsü yok (MO-6, MO-7, MO-1, MO-8, MO-9 — Figma'da henüz yok)

## Rapor formatı

Builder özetinin sonuna eklenir:

```
## Pre-flight
✓ 18 · ✗ 1 · N/A 2
✗ TL-4 CTA satır kayması — "Ücretsiz denemeye başla" 1280px'te 2 satır; etiket kısaltılamadı, Açık Sorular'a eklendi
N/A Layout [marketing] — tüm ekranlar product
N/A [dark] — color_scheme: light
```

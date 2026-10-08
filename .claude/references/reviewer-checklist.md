# Reviewer Checklist

ads-design-reviewer'ın ihtiyaç duyduğunda okuduğu tam kontrol listesi.
Workflow ve çıktı formatı için `agents/ads-design-reviewer.md`'ye bak.
Builder'ın teslim öncesi öz-kontrolü bu listenin kısaltılmış hâlidir: `references/preflight-checklist.md`.

---

## Seviye Ölçeği

Her bulgu iki ayrı alan taşır. İkisi birbirine karıştırılmaz:

- **etki** — yalnızca kullanıcıya etkisi: işlev ve erişilebilirlik
- **teslimi engeller** — bulgu açıkken çıktı "teslime hazır" sayılabilir mi

| etki | Ne zaman | teslimi engeller |
|---|---|---|
| **Blocker** | Kullanıcı görevi tamamlayamaz; erişilebilirlik ihlali (kontrast, okunamayan metin, klavye/odak kaybı) | evet |
| **High** | Ciddi UX sorunu: tutarlılık kilidi ihlali, CTA sorunları, hero ve nav kuralları | evet |
| **Medium** | Fark edilir ama görev tamamlanır: AI tells (katalogdaki diğer maddeler), layout tekrarı, bento, split-header, eksik mobil düzen, 4 katı skalası, tekrarlı giriş animasyonu, okuma düzeni | hayır |
| **Nitpick** | Çok küçük, isteğe bağlı | hayır |

**Kural** — şirket ve proje kuralları. Etkileri düşük olabilir ama teslimi **her zaman** engeller;
raporda kendi etkisiyle birlikte yazılır, ciddi bir UX hatası gibi gösterilmez:

| Kural | Varsayılan etki |
|---|---|
| Em-dash / ayraç en-dash (kullanıcı metni `data-copy="user"` muaf) | Nitpick |
| adesso metadata eksik, yapay zeka kökeni iması | Nitpick |
| Div / dikdörtgen ile sahte ürün UI | Medium |
| `[Korunan]` öğe ihlali | Medium (kullanıcıyı gerçekten şaşırtıyorsa High) |
| `spec.md → Bağlayıcı Kararlar` ihlali | Kararın konusuna göre; belirsizse Medium |

Medium ve Nitpick estetik önerilerdir: gerekçesi yazılarak aşılabilir, teslimi engellemez.
Teslim kuralı ve düzeltme döngüsü: `skills/ads-design-strategy.md → Adım 6`.

## Kapsam Etiketleri

- **[her ekran]** — tüm ekran ve component'larda uygulanır
- **[marketing]** — yalnızca strategist'in `marketing` olarak etiketlediği ekranlarda uygulanır
  (HTML'de `<body data-page-kind="marketing">`, Figma'da frame description'ında `page_kind: marketing`).
  `product` / `content` ekranlarda bu maddeleri atla, "N/A — product ekran" / "N/A — content ekran" yaz.
- **[content]** — yalnızca `content` (blog yazısı, makale, doküman, yardım merkezi) ekranlarında uygulanır
  (`data-page-kind="content"` / `page_kind: content`). Diğer tiplerde "N/A" yaz.
- **[web]** — `data-platform="web"` (veya etiketsiz) ekranlar. **[uygulama]** — `data-platform="ios|android"`
  (Figma'da `platform: ios|android`) ekranlar; kurallar `references/mobile-platforms.md`'dedir.
  Uygulama ekranlarında web'e özgü kurallar (`[marketing]`, `[content]`, 3 eşit feature card, scroll cue,
  1280 CTA kayması, `data-page-kind` zorunluluğu, web hareket bantları) "N/A — uygulama ekranı" yazılır
  (`mobile-platforms.md → 8`).

## Bağlam Girdileri

Kontrole başlamadan önce şunları topla:
- **Dial'lar:** VARIANCE / MOTION / DENSITY — stratejist brief'inden veya `spec.md → token_directives.dials`'tan
- **`color_scheme`:** `spec.md → token_directives` (`light` / `dark` / `both`)
- **`[Korunan]` kararlar:** `spec.md → ## Bağlayıcı Kararlar` (veya `extension-spec.md → ## Korunacaklar`)
- **`user_explicit` token'lar:** token JSON — AI tells kontrollerinde muaf
- **Kullanıcı metni:** `data-copy="user"` işaretli öğeler (HTML) / spec'te kullanıcı metni olarak geçen
  text layer'lar (Figma) — yazım kontrollerinden (em-dash, placeholder isim, yasak kelimeler) muaf
- **Tez / Kendi dünyası:** stratejist brief'i — "Reddettiği kalıp"a kayan çıktı **High**
- **Eyebrow istisnası:** `spec.md → ## Bağlayıcı Kararlar` içinde eyebrow'a izin veren madde var mı
- **Platform:** `spec.md → platform`, `app_platforms`, `tablet`, `icon_source`, `component_source`

---

## HTML Modu Kontrolleri

### a. Otomatik Testler

Tüm testleri tek komutla çalıştır. Çalıştırıcı biri başarısız olsa, çökse ya da zaman aşımına uğrasa
da diğerlerine devam eder ve sonuçları `test-results.json`'a yazar:

```bash
node scripts/test/run-all.mjs
```

Proje kökünden, tek komut olarak çalıştır (`cd … &&` zinciri kurma — izin kuralları tek komutu tanır).
`scripts/test/node_modules` yoksa önce `npm --prefix scripts/test install` (README → Kurulum).

Raporda `test-results.json`'daki test başına sonucu aynen aktar. Dört sonuç birbirine karıştırılmaz:

| Sonuç | Anlamı | Raporda |
|---|---|---|
| `GEÇTİ` | Teslimi engelleyen bulgu yok | Uyarıları (Medium/Nitpick) ilgili bölümde raporla |
| `BAŞARISIZ` | Teslimi engelleyen bulgu var ya da test çöktü | Her bulguyu kendi `etki` ve `teslimi engeller` alanıyla raporla |
| `ÇALIŞTIRILAMADI` | Test zorunlu ama girdi/bağımlılık eksik ya da zaman aşımı | **Doğrulama boşluğu** — nedeniyle birlikte "Teslim engelleri" listesine yaz |
| `UYGULANAMAZ` | Çıktı türü bu testi gerektirmiyor (`project-state.md → cikti_formati: figma`) | "Uygulanamaz" yaz, Figma kontrollerini (aşağıda) eksiksiz yap |

Genel çıkış kodu `0` yalnızca "uygulanan otomatik testler geçti" demektir; teslime hazır olmak için
yeterli değildir. `1` = başarısız test var, `2` = başarısız yok ama zorunlu bir doğrulama çalıştırılamadı.

`visual` **inceleme** rolündedir: genel kodu değiştirmez ama her zaman raporlanır. `visual_review.compared: false`
ise "görsel karşılaştırma yapılamadı" yaz (nedeniyle). `pending_review`'daki her dosya için `.diff.png`'ye bak,
farkı tarif et ve kasıtlı mı (brief / istekle uyumlu) beklenmedik mi yaz; beklenmedik farkı Medium bulgu
olarak raporla. Kabul kararı kullanıcınındır (`ads-design-strategy.md → Adım 6`, koşul 4).

`tells` em/en-dash, CTA satır kayması, nav yüksekliği, eyebrow, yasak görsel desenler (ışık halesi,
ızgara/çizgili zemin, sahte imleç), tekrarlı giriş animasyonu, okuma genişliği ve kalite kontrollerini
(JS hatası, görünmeyen içerik, metin örtüşmesi, kesilen kart, başlık ritmi, görünmeyen görsel,
tekrarlı metin) mekanik olarak ölçer; bulgularını aşağıdaki ilgili bölümlerde kendi seviyesiyle raporla.
Web ekranlarını 1280 **ve 375**'te (spec'te `tablet: true` ise 768'de de) açar; 375 bulguları `@375` etiketlidir
(bölüm **q**). Uygulama ekranlarını cihaz ölçüsünde açar ve bölüm **r**'nin mekanik maddelerini ölçer.

`structure` (`project-state.md → yapi` varsa) ekranları `flows.md` / `templates.md` ile karşılaştırır: işaretler,
zorunlu durumlar, bölgeler, çıkmaz sokak, akış bağımlılıkları; bulgularını bölüm **s**'de raporla. `yapi` yoksa
`UYGULANAMAZ` — eski proje, bulgu değildir.

`scripts/test/` yoksa veya `npm install` başarısız olursa kaynak analiziyle devam et, ama zorunlu testlerin
hepsini `ÇALIŞTIRILAMADI` olarak raporla ve "Teslim engelleri" listesine yaz. Kaynak analizi otomatik testin
yerine geçmez; bu durumda çıktı "teslime hazır" sayılmaz. Kurulum için README → Kurulum.

### b. Spec Uyumu

- Her component brief'in kapsam listesinde var mı?
- Eksik state var mı? (boş, hata, yükleniyor — brief'te geçiyorsa kontrol et)

### c. Token Uyumu

Token JSON mevcutsa:
- CSS custom property değerleri token değerleriyle eşleşiyor mu?
- Yaklaştırma yapılmış değer var mı? (örn. `#1A1B1C` yerine `#000` kullanılmış)
- **4 katı skalası:** Spacing ve border-radius değerleri 4'ün katı mı?
  (4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64…) — `user_explicit` token'lar muaf,
  diğerleri 4 katı değilse **Medium** bulgu olarak raporla. Font-size / line-height için 4 katı yalnızca
  öneridir, bulgu değildir (`references/token-standards.md → 4 Katı Skalası`); okunabilirlik alt sınırları ayrıca geçerlidir

### d. Erişilebilirlik

- spec.md'deki erişilebilirlik gereksinimi karşılanıyor mu? (varsayılan: WCAG AA)
- **Kontrast oranı (WCAG AA zorunlu):**
  - Normal metin (< 18px normal veya < 14px bold) → ≥ 4.5:1
  - Büyük metin (≥ 18px normal veya ≥ 14px bold) → ≥ 3:1
  - UI bileşen kenarlıkları / ikonlar → ≥ 3:1
  - Token JSON varsa ön plan ve arka plan renk token değerlerinden hesapla; yoksa CSS'ten oku
- **Minimum font-size:**
  - Body / label metinleri ≥ 14px (önerilen ≥ 16px)
  - Caption / yardımcı metin ≥ 12px — 12px altı Blocker
  - Değer `em`/`rem` ise tarayıcı varsayılanı 16px üzerinden px karşılığını hesapla

### e. Animasyon

- MOTION < 7 ise yalnızca `transform` / `opacity` kullanılmış mı? (MOTION ≥ 7'de geçiş sırasında
  sınırlı alanda blur / mask / clip-path serbest — bkz. **n**)
- Statik elemanlarda gereksiz transition var mı?
- `prefers-reduced-motion` guard eklenmiş mi?
- `window.addEventListener('scroll', …)` kullanılmış mı? → **Medium** (IntersectionObserver veya CSS scroll-driven animation kullanılmalı)

### f. Responsive

`scripts/test/` mevcutsa:

```bash
node scripts/test/responsive.mjs
```

- [ ] `responsive.mjs` çalıştı ve tüm kontroller geçti mi?

`scripts/test/` yoksa veya `npm install` başarısızsa: "responsive.mjs çalıştırılamadı, manuel doğrulama gerekiyor" notu ekle — bu kontrol atlanır.

---

### g. Metadata Kontrolü

Her HTML dosyasının `<head>` bölümünde:

- [ ] `<!-- Designed by: adesso Turkey -->` yorumu mevcut mu? → yoksa **Kural** (etki: Nitpick)
- [ ] `<meta name="author" content="adesso Turkey">` etiketi mevcut mu? → yoksa **Kural** (etki: Nitpick)
- [ ] `generator`, `ai`, `claude`, `artificial intelligence` içeren `<meta>` etiketi var mı? → varsa **Kural** (etki: Nitpick)
- [ ] Yapay zeka kökenini ima eden HTML yorumu var mı? (`<!-- AI generated -->`, `<!-- Claude -->` vb.) → varsa **Kural** (etki: Nitpick)
- [ ] `data-ai`, `data-generated`, `data-claude` gibi özel veri özelliği var mı? → varsa **Kural** (etki: Nitpick)
- [ ] Ekran dosyalarında `<body data-page-kind="marketing|product|content">` mevcut mu? → yoksa **Medium**
- [ ] `platform: app | both` projelerinde ekranlarda `<body data-platform="web|ios|android">` mevcut mu? → yoksa **Medium**
  (landing kuralları uygulanamaz — ekranı stratejist kapsamından eşleştirip devam et)

---

### h. AI Tells Kontrolü [her ekran]

Token JSON'dan `"source": "user_explicit"` olan token'ları oku — bu token'lara
karşılık gelen değerler aşağıdaki kontrollerde atlanır.

Geri kalan (`ai_inferred` ve `reference_derived`) çıktıda, sayfanın tamamında
(başlık, eyebrow, pill, gövde metni, alıntı, atıf, caption, buton, `alt`, `aria-label`) kontrol et:

- [ ] Em-dash (`—`) veya ayraç olarak en-dash (`–`) var mı? → **Kural** (etki: Nitpick)
  (aralıklar dahil: `2018-2026`, `₺40-80` tire ile yazılır). `data-copy="user"` içindeki metin muaf.
- [ ] Div-based fake screenshot / sahte ürün UI (div'lerden görev listesi, terminal, dashboard) var mı? → **Kural** (etki: Medium)
- [ ] Display fontu (`--font-family-display`) kaçınma listesinden `user_explicit` olmadan ve
  `_meta.font_rationale` gerekçesi olmadan seçilmiş mi? → **Medium** (gövde fontunda Inter serbest)
- [ ] Başlığın üstünde eyebrow / kicker / hero chip (küçük, harf aralıklı, büyük harfli etiket) var mı?
  Bağlayıcı Kararlar'da istisna yoksa → **Medium** (istisna varsa yalnızca o kapsamda, `data-eyebrow-allowed`).
  Uygulama ekranlarında platform liste bölüm başlıkları ("GENEL", "GİZLİLİK") muaf.
- [ ] 3 eşit genişlikte yan yana feature card var mı? → **Medium**
- [ ] Warm cream / bone zemin (`#f5f1ea` ailesi) `user_explicit` olmadan kullanılmış mı? → **Medium**
  (her brief'te; premium-consumer brief'te brass/clay accent ailesi de)
- [ ] Placeholder isim (`John Doe`, `Acme Corp` vb.) var mı? → **Medium**
- [ ] Pure `#000000` veya `#ffffff` kullanılmış mı? → **Medium** (uygulama ekranlarında sistem zeminine eşlenen
  zemin token'ları muaf — `mobile-platforms.md → 4`)
- [ ] Katalogdaki "Süs ve Meta Metinler" maddelerinden biri var mı? → **Medium** (her biri ayrı bulgu)
- [ ] Katalogdaki "Görsel" yasaklarından biri (ışık halesi / spotlight, dekoratif ızgara veya çizgili zemin,
  sahte yanıp sönen imleç) var mı? → **Medium**
- [ ] Çıktı stratejist brief'indeki "Reddettiği kalıp"a kaymış mı? → **High**

Token JSON yoksa bu kontrol kaynak analizi üzerinden yapılır. Yapılamayan kontrolleri
"Token JSON sağlanmadı, manuel doğrulama gerekiyor" notu ile işaretle.

---

### i. Tutarlılık Kilitleri [her ekran]

- [ ] **Accent kilidi:** Tek bir accent rengi tüm ekranlarda aynı şekilde kullanılıyor mu?
  Bir section'da beliren farklı accent (örn. gri-turuncu sitede mavi CTA) → **High**
- [ ] **Radius kilidi:** Tek bir köşe yuvarlama sistemi mi var (hepsi keskin / hepsi yumuşak /
  etkileşimli öğeler pill)? Karışık sistem ancak belgelenmiş bir kuralla mümkün
  ("butonlar pill, kartlar 16, input'lar 8") ve kural her yerde uygulanmalı → ihlal **High**
- [ ] **Aynı amaçlı çift CTA:** Aynı niyete iki farklı etiket ("Bize ulaşın" + "Konuşalım",
  "Ücretsiz dene" + "Hemen başla") → **High**. Her niyet için tek etiket, nav/hero/footer'da aynı.
- [ ] **CTA satır kayması:** Desktop'ta (1280px) bir CTA etiketi iki satıra kayıyor mu? → **High**
  (birincil CTA'lar en fazla 3 kelime)
- [ ] **Buton ve form kontrastı:** Her CTA metni, input, placeholder, focus ring, helper ve hata metni
  bulunduğu section arka planına karşı WCAG AA geçiyor mu? Fotoğraf üstündeki ghost butonlarda
  scrim/stroke var mı? → ihlal **Blocker** (erişilebilirlik)

### j. Layout Disiplini [marketing]

- [ ] **Hero:** başlık desktop'ta ≤ 2 satır; alt metin ≤ 20 kelime ve ≤ 4 satır; toplam ≤ 4 metin öğesi
  (marka şeridi, başlık, alt metin, CTA'lar; eyebrow yalnızca Bağlayıcı Kararlar istisnasıyla); CTA ilk görünümde (scroll'suz);
  üst padding ≤ 96px → ihlal **High**
- [ ] **Hero'da yasak:** CTA altında küçük tagline, güven mikro-şeridi, fiyat teaser'ı, madde listesi,
  avatar sırası → **High**
- [ ] **VARIANCE > 4** iken ortalanmış hero → **Medium** (editorial / manifesto brief'leri hariç)
- [ ] **Logo wall** hero'nun altında ayrı bir section mı, gerçek logolar mı (düz metin wordmark değil)? → ihlal **Medium**
- [ ] **Nav:** desktop'ta tek satır ve yükseklik ≤ 80px → ihlal **High**
- [ ] **Layout ailesi çeşitliliği:** aynı layout ailesi sayfada bir kez; 8 section'da en az 4 farklı aile → ihlal **Medium**
- [ ] **Zigzag:** art arda en fazla 2 görsel+metin split section → 3. tekrar **Medium**
- [ ] **Bento:** hücre sayısı = içerik sayısı (boş hücre yok); en az 2 hücrede görsel çeşitlilik
  (görsel, desen, ton farkı — hepsi aynı zeminde düz metin değil) → ihlal **Medium**
- [ ] **Split-header:** "solda büyük başlık + sağda küçük açıklama paragrafı" section başlığı → **Medium**
  (sağ kolon gerçek bir görsel/etkileşim taşıyorsa geçerli)

### k. Mobil Düzen [her ekran]

- [ ] Her çok kolonlu section'ın 375px düzeni CSS'te açıkça tanımlı mı (kolonların nasıl
  yığıldığı belli mi)? "Kendiliğinden sarar" varsayımı → **Medium**

### l. Dark Mode [`color_scheme: both` veya `dark`]

`color_scheme: light` ise bu bölümü atla ("N/A — yalnızca açık tema").

- [ ] Koyu tema token blokları mevcut mu (`[data-theme="dark"]` ve
  `@media (prefers-color-scheme: dark)`)? `both` ise yoksa → **High**
- [ ] Kontrast kontrolleri (d ve i) **her iki temada** ayrı ayrı yapıldı mı? Koyu temada ihlal → **Blocker**
- [ ] Koyu temada hiyerarşi korunuyor mu (birincil/ikincil metin ve yüzey farkları seçilebiliyor mu)? → ihlal **High**
- [ ] Koyu tema renkleri token'a bağlı mı (koyu tema için hardcode değer yok)? → ihlal **Medium**
- [ ] Sayfa ortasında tek bir section'ın ters temaya geçmesi var mı? → **Medium**

### m. Redesign Koruma [her ekran]

`spec.md → ## Bağlayıcı Kararlar` içindeki her `[Korunan]` maddeyi çıktıyla karşılaştır:

- [ ] URL / dosya slug'ları, nav etiketleri, form alanı adları ve sırası, logo/wordmark,
  yasal/KVKK/çerez metinleri, analytics'e bağlı ID ve `data-*` özellikleri değişmemiş mi? → ihlal **Kural** (etki: Medium)
- [ ] Mevcut erişilebilirlik kazanımları (focus state, alt metin, klavye navigasyonu) gerilememiş mi? → ihlal **Blocker**

`[Korunan]` madde yoksa bu bölümü atla.

### n. Motion Uyumu [her ekran]

Stratejist brief'indeki MOTION değerini kullan:

| MOTION | Beklenen |
|---|---|
| 1-3 | Yalnızca durum geçişleri (hover, focus, açılma/kapanma). Giriş/scroll animasyonu varsa → **Medium** |
| 4-6 | Durum geçişleri + hover + tek imza an + yumuşak giriş. Scroll'a bağlı anlatım varsa → **Medium** |
| 7-10 | Scroll ile açılan / scroll'a bağlı bölümler bekleniyor. Hiç hareket yoksa ("iddia edilen ama gösterilmeyen motion") → **Medium** |

- [ ] MOTION ≥ 4 ise bir **imza an** var mı ve brief'teki Tez'e bağlanıyor mu? Hareket her section'a eşit dağılmışsa → **Medium**
- [ ] Aynı giriş animasyonu (aynı `animation-name` / reveal sınıfı) 2'den fazla section'da mı? → **Medium**
- [ ] Blur / mask / clip-path animasyonu MOTION < 7'de mi kullanılmış, ya da sürekli / tam ekran mı? → **Medium**
- [ ] Animasyonlu (nabız atan, yanıp sönen) durum noktası gerçek canlı veriye bağlı değil mi? → **Medium**
- [ ] MOTION > 3 ise her animasyon `prefers-reduced-motion: reduce` altında kapatılıyor/sadeleşiyor mu? → yoksa **High**
- [ ] Her animasyon tek cümleyle gerekçelendirilebiliyor mu (hiyerarşi, geri bildirim, durum geçişi, anlatım)? Süs amaçlı sonsuz döngüler → **Medium**

### o. Okuma Düzeni [content]

- [ ] **Satır genişliği:** gövde paragrafları desktop'ta en fazla ~75 karakter (`max-width` ≈ 60–75ch) mi? → aşım **Medium**
- [ ] **Başlık ritmi:** her başlığın üst boşluğu alt boşluğundan büyük mü (başlık kendi içeriğine yakın)? → ihlal **Medium**
- [ ] **Gezinme:** 4+ ara başlıklı uzun sayfada içindekiler, yapışkan başlık listesi veya bölüm bağlantıları var mı? → yoksa **Medium**
- [ ] Landing kalıpları (hero CTA, layout ailesi çeşitliliği, zigzag) okuma akışını bölüyor mu? → **Medium**

### p. Kalite Kontrolleri [her ekran]

Estetik değil, kusur kontrolleri:

- [ ] **JS hatası:** sayfa yüklenirken konsolda yakalanmamış hata var mı? → **High** (önce bunu düzelt, diğer bulgular etkilenebilir)
- [ ] **Görünmeyen içerik:** yüklemeden ve reveal'lar çalıştıktan sonra metnin belirgin bir kısmı `opacity: 0` / `visibility: hidden` mi? → **High**
- [ ] **Metin örtüşmesi:** metnin üstüne opak bir öğe veya başka bir metin binmiş mi? → **High**
  (okunamıyorsa erişilebilirlik ihlali olarak **Blocker**)
- [ ] **Kesilen kart:** yatay kaydırma / sekme panelinde ilk veya son kart kenara yapışık, köşesi kesik mi (iki yanda eşit boşluk yok)? → **Medium**
- [ ] **Başlık ritmi:** başlıkların üst boşluğu alt boşluğundan küçük veya eşit mi? → **Medium** (content ekranlarında **o** ile birlikte raporla, tek bulgu)
- [ ] **Görünmeyen görsel:** arka plan görseli ≥ 0.9 opaklıkta bir renk katmanının altında mı, ya da görselin opaklığı ~0 mı? → **Medium**
- [ ] **Tekrarlı metin:** aynı kart/panel içinde aynı metin 3+ farklı yerde mi? → **Medium** (bilinçli tekrar gerekçelendirilirse göz ardı edilebilir)

### q. Mobil Web [web @375]

`tells.mjs` 375px geçişinin bulguları (`@375`) ve kaynak analizi:

- [ ] **Dokunma alanı:** buton, ikon ve linklerin tıklanabilir kutusu (padding dahil) < 24×24px → **High**
  (WCAG 2.5.8); 24–43px → **Medium**. Paragraf içi metin linkleri muaf.
- [ ] **Hover'a bağlı işlev:** bir buton/link/menü yalnızca `:hover` ile görünür hale geliyor mu? → **High**.
  Süs amaçlı hover efekti serbest.
- [ ] **Güvenli alan:** `viewport-fit=cover` varken üst/alt sabit öğeler `env(safe-area-inset-*)` kullanmıyor mu? → **Medium**
- [ ] **`100vh`:** tam ekran bölümde `100vh` kullanılmış mı? → **Medium** (`100svh` / `100dvh`)
- [ ] 375'te düzene bağlı kurallar (kenara yapışık kart, metin örtüşmesi, başlık ritmi, görünmeyen içerik)
  bölüm **p** seviyeleriyle; CTA iki satıra kayması 375'te **Medium**.

### r. Uygulama Kontrolleri [uygulama]

Ölçüler ve kurallar: `references/mobile-platforms.md`. `tells.mjs` ilk dört maddeyi ölçer.

- [ ] **Dokunma alanı:** iOS < 44×44pt, Android < 48×48dp veya öğeler arası < 8dp → **High**
- [ ] **Güvenli alan:** buton/link durum çubuğu veya home indicator / gezinme alanına taşıyor mu? → **High**
- [ ] **Sekme çubuğu:** iOS 2–5, Android 3–5 öğe dışı → **Medium**
- [ ] **Giriş animasyonu:** kaydırınca belirme / section giriş animasyonu var mı? → **Medium**
- [ ] **Büyük yazı:** kök yazı %130'da taşan, kesilen veya örtüşen metin var mı? → **Medium**
- [ ] **Yeniden icat edilmiş kontrol** (div'den switch, sahte action sheet, özel tab bar) veya özel global menü → **High**
- [ ] **Özel ekran geçişi** (sistem push / sheet / container transform yerine) → **High**
- [ ] **Bir platformun kalıbı ötekinde** (Android'de iOS switch, iOS'ta FAB) → **High**
- [ ] **İkonlar** `icon_source` ile tutarlı mı (platform → SF Symbols / Material Symbols)? → ihlal **Medium**
- [ ] `app_platforms: [ios, android]` ise Platform Farkları tablosundaki parçaların iki versiyonu var mı? → yoksa **High**
- [ ] Brief'teki Tez / Kendi dünyası navigasyon veya kontrolleri değiştirmiş mi (yapı platformun)? → **High**

### s. Yapı — Flow ve Template [`yapi` varsa]

Kaynak: `flows.md`, `templates.md`, `references/structure-standards.md`. `structure.mjs` (run-all) işaretleri ve
bağımlılıkları ölçer; aşağıdakilerin **anlamını** reviewer denetler.

- [ ] **Zorunlu durumlar** ekranda var mı ve içerikleri gerçek mi (boş durum metni ve eylemi, hata mesajı ne olduğunu
  + ne yapılacağını söylüyor mu)? Durum yok → **High**
- [ ] **Çıkmaz sokak:** boş durumdaki eylem kullanıcıyı önkoşulu tamamlayacağı ya da sıradaki akışı başlatacağı yere
  mi götürüyor (yalnızca "Ana sayfaya dön" değil)? Değilse → **High**
- [ ] **Akış dalları:** `Dallar`'daki hata / iptal / boş durumları ekranda karşılık buluyor mu? Eksik dal → **High**
- [ ] **`Sonra`:** akışın son adımı tanımlı hedefe gidiyor mu? Yanlış / ölü bağlantı → **High**
- [ ] **Ortak Davranış:** doğrulama zamanı, başarı/hata geri bildirimi, geri alma tanıma uyuyor mu? Aykırılık →
  **Medium**; yıkıcı işlemde onay yoksa → **High**
- [ ] **Template uyumu:** ekran template'inin bölgelerini ve `Davranış` / `Pattern` maddelerini izliyor mu; aynı
  template'i kullanan ekranlar aynı davranıyor mu? Sapma → **Medium**
- [ ] Ekran akışta veya template'te tanımlı olmayan bir işlev / dal ekliyor mu? → kapsam kararı (builder kuralı)

---

## Figma Modu Kontrolleri

### a. Frame İçeriğini Oku

`get_design_context` ve `get_screenshot` ile her frame'i incele.
Frame description'larından `page_kind` değerini oku.

### b. Spec Uyumu

- Kapsam listesindeki her component / ekran mevcut mu?
- Eksik state var mı?

### c. Token Uyumu

Token JSON mevcutsa:
- Renk, tipografi ve boşluk değerleri token'larla eşleşiyor mu?
- Serbest değer (token'a bağlı olmayan renk, font boyutu vb.) kullanılmış mı?
- **4 katı skalası:** Spacing ve corner radius değerleri 4'ün katı mı?
  (4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64…) — `user_explicit` token'lar muaf,
  diğerleri 4 katı değilse **Medium** bulgu olarak raporla. Font size için 4 katı yalnızca öneridir, bulgu değildir

### d. Erişilebilirlik

- **Kontrast oranı (WCAG AA zorunlu):**
  - Normal metin (< 18px normal veya < 14px bold) → ≥ 4.5:1
  - Büyük metin (≥ 18px normal veya ≥ 14px bold) → ≥ 3:1
  - UI bileşen kenarlıkları / ikonlar → ≥ 3:1
  - `get_design_context` çıktısından fill renklerini oku; token JSON varsa değerleri oradan hesapla
- **Minimum font-size:**
  - Body / label metinleri ≥ 14 (Figma px birimi)
  - Caption / yardımcı metin ≥ 12 — 12 altı Blocker

### e. Metadata Kontrolü

`get_design_context` çıktısında:

- [ ] Herhangi bir frame veya component'ın `description` alanında "Designed by: adesso Turkey" yazıyor mu? → yoksa **Kural** (etki: Nitpick) — ads-design-builder'ın bunu eklemiş olması gerekir
- [ ] Herhangi bir `description` alanında `AI`, `Claude`, `generated` gibi yapay zeka iması var mı? → varsa **Kural** (etki: Nitpick)
- [ ] Ekran frame'lerinin description'ında `page_kind: marketing|product|content` satırı var mı? → yoksa **Medium**
- [ ] `platform: app | both` projelerinde ekran description'ında `platform: web|ios|android` satırı var mı? → yoksa **Medium**

---

### f. AI Tells Kontrolü [her ekran]

Token JSON'dan `"source": "user_explicit"` olan token'ları oku — bu token'lara
karşılık gelen değerler aşağıdaki kontrollerde atlanır.

`get_design_context` ve `get_screenshot` çıktısı üzerinden kontrol et:

- [ ] Em-dash (`—`) veya ayraç olarak en-dash (`–`) herhangi bir text layer'da var mı? → **Kural** (etki: Nitpick)
  (spec'te kullanıcı metni olarak geçen metin muaf)
- [ ] Sahte ürün UI (dikdörtgenlerden yapılmış görev listesi / dashboard / terminal) var mı? → **Kural** (etki: Medium)
- [ ] Display fontu kaçınma listesinden `user_explicit` / gerekçe olmadan seçilmiş mi? → **Medium** (gövde fontunda Inter serbest)
- [ ] Başlık üstünde eyebrow / kicker var mı (Bağlayıcı Kararlar istisnası yoksa)? → **Medium**
- [ ] 3 eşit genişlikte yan yana feature card var mı? → **Medium**
- [ ] Warm cream / bone zemin `user_explicit` olmadan kullanılmış mı? → **Medium**
- [ ] Placeholder isim (`John Doe`, `Acme Corp` vb.) bir text layer'da var mı? → **Medium**
- [ ] Pure `#000000` veya `#ffffff` fill kullanılmış mı? → **Medium**
- [ ] Katalogdaki "Süs ve Meta Metinler" veya "Görsel" maddelerinden biri var mı? → **Medium**
- [ ] Çıktı stratejist brief'indeki "Reddettiği kalıp"a kaymış mı? → **High**

### g. Tutarlılık Kilitleri [her ekran]

HTML bölüm **i** ile aynı kurallar; frame'ler ve text layer'lar üzerinden değerlendir
(CTA satır kayması: 1280 genişlikteki frame'de buton metni tek satır mı).

### h. Layout Disiplini [marketing]

HTML bölüm **j** ile aynı kurallar; 1280 (veya en yakın desktop) genişlikteki ekran frame'leri üzerinden.

### i. Dark Mode [`color_scheme: both` veya `dark`]

- [ ] `Color` variable koleksiyonunda `Light` ve `Dark` modları var mı? `both` ise yoksa → **High**
- [ ] Ekranların fill'leri variable'a bağlı mı (mod değişince renk değişiyor mu)? Bağlı olmayan fill → **Medium**
- [ ] Kontrast her iki modda geçiyor mu? Koyu modda ihlal → **Blocker**

### j. Redesign Koruma [her ekran]

HTML bölüm **m** ile aynı kurallar; nav etiketleri, form alanları, logo ve yasal metinler text layer'lardan okunur.

### k. Mobil Düzen [her ekran]

- [ ] Kapsamdaki her ekranın mobil (375) frame'i var mı veya auto-layout ile mobilde nasıl yığıldığı tanımlı mı? → yoksa **Medium**

### l. Okuma Düzeni [content]

HTML bölüm **o** ile aynı kurallar; gövde text layer genişliği ve başlıkların üst/alt boşlukları frame'den ölçülür.

### m. Kalite Kontrolleri [her ekran]

HTML bölüm **p**'deki metin örtüşmesi, kesilen kart, başlık ritmi ve tekrarlı metin maddeleri frame'ler
üzerinden uygulanır. JS hatası, görünmeyen içerik ve görünmeyen görsel yalnızca HTML'e özgüdür — "N/A — Figma" yaz.


### n. Uygulama Kontrolleri [uygulama]

Figma'yı betik taramaz; ölçüler `get_design_context` / `get_metadata` çıktısındaki katman boyutlarından okunur.
Kurallar: `references/mobile-platforms.md`.

- [ ] **Cihaz çerçevesi:** frame iOS 390×844 / Android 412×915 mi, durum çubuğu ve home indicator / gezinme çubuğu katmanları var mı? → yoksa **Medium**
- [ ] **Güvenli alan:** içerik veya kontrol bu katmanların altına taşıyor mu? → **High**
- [ ] **Dokunma alanı:** etkileşimli katmanların (veya hit alanı katmanının) boyutu iOS < 44pt / Android < 48dp, aralık < 8dp → **High**
- [ ] **Sekme çubuğu** öğe sayısı iOS 2–5 / Android 3–5 dışı → **Medium**
- [ ] **Bileşen kaynağı** `component_source` ile tutarlı mı: `kit` ise kit instance'ları, `drawn` ise platform adlı component'ler
  (`iOS/Switch`), `own` ise mevcut kütüphane? Yeniden icat edilmiş kontrol → **High**
- [ ] **İkonlar** `icon_source` ile tutarlı mı? → ihlal **Medium**
- [ ] **İki tema:** uygulama `color_scheme: both` ise fill'ler Light/Dark variable modlarına bağlı mı? → bağlı değilse **Medium**
- [ ] `app_platforms: [ios, android]` ise Platform Farkları tablosundaki parçaların iOS ve Android versiyonları var mı? → yoksa **High**
- [ ] `tablet: true` ise tablet frame'i yeniden kurgulanmış mı (büyütülmüş telefon değil)? → **High**

### o. Yapı [`yapi` varsa]

HTML bölüm **s** ile aynı kontroller; işaretler frame adı (`T-… · Ekran`) ve frame açıklamasından
(`flow: … · states: …`) okunur, durumlar ayrı frame / variant olarak aranır. Betik çalışmaz — hepsi elle.

---

## AI Tells — Yasak Desenler Kataloğu

ads-design-builder tarafından da referans alınır. Reviewer bu listeye göre HTML **h** / Figma **f** kontrolünü yapar.
Seviyeler yukarıdaki ölçeğe göredir; işaretlenmemiş maddeler **Medium**.

### Layout

| Yasak | Alternatif |
|---|---|
| 3 eşit sütun feature card | 2-kolon zig-zag, asimetrik grid, yatay scroll, bento |
| Başlık üstünde eyebrow / kicker / hero chip | Yok — başlık kendi başına taşır; gerekirse kelimeyi başlığa veya gövdeye kat. Yalnızca Bağlayıcı Kararlar istisnasıyla |
| Zigzag image+text 3+ tekrar [marketing] | 3. tekrarda farklı layout ailesi kullan |
| Her brief için centered hero [marketing] | VARIANCE > 4 ise split screen, sola yaslı veya asimetrik; editorial/manifesto'da centered geçerli |
| Uzun listelerde her satıra `border-top` + `border-bottom` | Tek yönlü ayraç veya farklı bir liste component'i |
| Dolu arka plan izli skor/progress bar'ları karşılaştırma görseli olarak [marketing] | Sayı + küçük ikon veya izsiz ince bar |

### İçerik

| Yasak | Alternatif |
|---|---|
| Em-dash (`—`) — **Kural** (etki: Nitpick) (kullanıcı metni `data-copy="user"` muaf) | Virgül, nokta, iki nokta, parantez veya iki ayrı cümle |
| Ayraç olarak en-dash (`–`) — **Kural** (etki: Nitpick) | Normal tire (`-`); aralıklar `2018-2026` |
| "John Doe", "Acme Corp" | Brief'e uygun, gerçekçi isimler |
| "Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize" | Somut, işlevsel kelimeler |
| `99.99%`, `50%`, `1,234,567` | Organik değerler (`47.2%`, `1,381`) veya sayıyı kaldır |
| Scroll cue ("↓ scroll", "Keşfetmek için kaydır", animasyonlu fare ikonu) | Yok — kullanıcı scroll'u bilir |
| Genel adım etiketleri ("Step 1 / Step 2", "Adım 1", "Phase 01", "Aşama 1") | Adımın kendisi etiket olur: "Kur", "Ayarla", "Yayınla" |

### Süs ve Meta Metinler

| Yasak | Alternatif |
|---|---|
| Hero'da versiyon etiketi (`V0.6`, `BETA`, `INVITE-ONLY PREVIEW`, `EARLY ACCESS`) | Kaldır — yalnızca brief gerçekten bir lansman/önizleme ise |
| Numaralı section eyebrow'ları (`00 / INDEX`, `001 · Capabilities`, `06 · how it works`) | Konuyu düz dille adlandır veya eyebrow'u kaldır |
| Görsel/bento üzerinde `01 / 4` tarzı sayfalama | Kaldır |
| `·` ayracının her yerde kullanılması ("foo · bar · baz · qux") | Satır başına en fazla 1 `·`; satır sonu, ince çizgi veya kolon |
| Süs amaçlı renkli durum noktaları (her nav öğesi, liste satırı, badge önünde) | Yalnızca gerçek durum bilgisi (canlı sunucu durumu vb.), section başına en fazla 1; nabız / yanıp sönme animasyonu yalnızca gerçekten canlı değişen veride |
| Görsel üstüne bindirilmiş pill/etiketler (`Brand · 02`, `PLATE · BRAND`) | Görseli yalnız bırak veya görselin altına tek satır işlevsel caption |
| Süs amaçlı fotoğraf kredileri (`Field study no. 12 · Ines Caetano`) | Yalnızca gerçek fotoğrafçıya gerçek atıf; yoksa kaldır |
| Şehir / saat / hava durumu şeritleri (`İstanbul 14:23 · 18°C`) | Kaldır — yalnızca dağıtık stüdyo, seyahat veya fiziksel mekân brief'lerinde |
| Eyebrow/başlık altında mikro açıklama cümleleri ("Bunların her biri bugün sunduğumuz bir özellik, yol haritası vaadi değil.") | Eyebrow + başlık + gövde yeterli; cümleyi kaldır |
| Hero altında dekoratif metin şeridi (`MARKA. HAREKET. MEKÂN.`) | Kaldır — gerçek link/durum taşımıyorsa |
| Pazarlama sayfasında versiyon footer'ı (`v1.4.2`, `Build 0048`) | Kaldır |
| Section başlığında sağ üst köşede yüzen küçük açıklama metni | Metni başlığın altına al veya hizalı 2 kolonlu başlık kur |
| "Quietly trusted by", "From the field", "Field notes" gibi şiirsel etiketler | "Müşterilerimiz", "Son yazılar" gibi işlevsel etiket veya etiketsiz |
| Gerçek veri olmadan "800'den 412. rezervasyon" tarzı sayaçlar | Kaldır |

### Görsel

| Yasak | Alternatif |
|---|---|
| Div-based fake screenshot / sahte ürün UI — **Kural** (etki: Medium) | Gerçek component, gerçek görsel veya açık placeholder |
| Hand-rolled SVG icon | Phosphor, HugeIcons, Radix, Tabler |
| Elle çizilmiş süs SVG'leri (varsayılan olarak) | Gerçek görsel, `https://picsum.photos/seed/{açıklayıcı-kelime}/{w}/{h}` veya açık placeholder alanı |
| Emoji as icon (🔔 ✅ ❌ 🏠 vb.) | Gerçek ikon kütüphanesi — aksi spec'te belirtilmedikçe yasak |
| Inter + slate-900 + AI-purple gradient stack'i | Brief'ten türetilmiş font + renk seçimi |
| Pure `#000000` / `#ffffff` (uygulamada zemin token'ları muaf) | Off-black (`#111111`) / off-white (`#fafafa`) |
| Işık halesi / spotlight: hero veya section arkasında merkezi doygun, kenara doğru kaybolan `radial-gradient` parlama | Düz veya hafif ton farklı zemin; ışık gerekiyorsa gerçek bir görsel malzeme |
| Dekoratif ızgara zemin: sabit hücreli ince `linear-gradient` çizgilerle kareli arka plan | Düz yüzey veya ürünün kendi yapısı. Harita, tuval, ölçüm aracı gibi işlevsel yüzeylerde serbest |
| Dekoratif çizgili desen (`repeating-linear-gradient` şeritler) | Kasıtlı bir doku veya düz yüzey |
| Sahte yanıp sönen imleç (hero başlığı sonunda `\|` blink animasyonu) | Yok — gerçek input alanları kendi imlecini çizer |

Not: Kayan şerit (marquee) ve organik clip-path şekilleri bilinçli olarak **yasak değildir**.

### Kalite (estetik değil, kusur)

| Kusur | Düzeltme |
|---|---|
| JS hatası yüzünden çalışmayan reveal / etkileşim | Hatayı düzelt; içerik JS olmadan da görünür olmalı |
| Varsayılan olarak `opacity: 0` / gizli içerik | İçerik varsayılan görünür, JS yalnızca girişi süsler |
| Metnin üstüne binen opak katman veya ikinci metin | Katmanlara yer aç veya metni katmanın altından çıkar |
| Kaydırılan listede kenara yapışık, kesik kart | İki yanda eşit iç boşluk |
| Başlığın üst boşluğu ≤ alt boşluğu | Başlığın üstünü aç, altını daralt |
| Opak renk katmanı altında görünmeyen arka plan görseli | Tonu 0.9 opaklığın altına indir, blend mode kullan veya görseli kaldır |
| Aynı kartta 3+ kez tekrarlanan metin | Bir kez, en anlamlı yerde söyle |

### Font Yasakları (ai_inferred token'larda, yalnızca display rolü)

- Display kaçınma listesi: `Inter`, `Fraunces`, `Instrument Serif`, `Instrument Sans`, `Playfair Display`,
  `Cormorant`, `Lora`, `Crimson`, `Newsreader`, `Syne`, `Space Grotesk`, `Space Mono`, `IBM Plex`,
  `DM Sans`, `DM Serif`, `Outfit`, `Plus Jakarta Sans`, `Geist`, `Roboto` — ayrıntı `ads-token-generator.md → 2c`
- Gövde / UI fontunda (`--font-family-body`) bu liste uygulanmaz; `Inter` ve sistem yığını serbest

### Renk Yasakları (ai_inferred token'larda)

Her brief'te:
- Pure `#000000` → `#111111` veya `zinc-950`
- Pure `#ffffff` → `#fafafa` veya `#f8f8f8`
- Background: `#f5f1ea`, `#fbf8f1`, `#faf7f1`, `#ece6db`, `#efeae0` ailesi (warm cream/bone)

- Varsayılan AI-purple: `#7c3aed`, `#8b5cf6`, `#a855f7` — her brief'te; brief açıkça mor istemiyorsa yasak

Premium-consumer brief'lerde (cookware, wellness, artisan, luxury) ek olarak:
- Accent: `#b08947`, `#b6553a`, `#9a2436`, `#9c6e2a`, `#bc7c3a` ailesi (brass/clay/oxblood)

**Override:** Token JSON'da `"source": "user_explicit"` olan değerler bu listeden muaftır.

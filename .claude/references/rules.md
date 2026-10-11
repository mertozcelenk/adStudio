# Kurallar

adStudio'nun tasarım kuralları — **her kural burada bir kez** yazılır: kimlik, kural, seviye, kapsam.
Nasıl uygulanacağı ve nasıl kontrol edileceği çıktı türüne göre ayrı dosyalardadır; yalnızca o işin dosyası okunur:

| | HTML çıktısı | Figma çıktısı |
|---|---|---|
| Üretim (ads-design-builder) | `references/build-html.md` | `references/build-figma.md` |
| Kontrol (reviewer'lar, `/ads-check`, `/ads-inspect`) | `references/review-html.md` | `references/review-figma.md` |
| Teslim öncesi öz-kontrol | `references/preflight-checklist.md` | aynı |

**Kimlik:** `KISALTMA-numara` (`DM-3`). Numaralar kalıcıdır — silinen kuralın numarası başka kurala verilmez.
Seviye yalnızca bu dosyada yazılır; diğer dosyalar kimliği anar. Bulgu biçimi: `B1 · DM-3 · High — [ne, nerede]`.
Bir kural bir çıktı türünde uygulanamıyorsa o türün kontrol dosyasında `yalnızca HTML` / `yalnızca Figma` ya da
`Figma'da henüz yok` diye işaretlenir. Denetim: `scripts/test/check-rules.mjs` (model çağrısız).

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
raporda kendi etkisiyle birlikte yazılır, ciddi bir UX hatası gibi gösterilmez. Aşağıdaki tabloda seviyesi
`Kural (etki: …)` olan maddeler (AT-1, AT-2, MD-1, MD-2, RK-1, RK-3).

**değerlendir** — kuralın sabit seviyesi yok; reviewer etkiye göre ölçekten seçer.

Medium ve Nitpick estetik önerilerdir: gerekçesi yazılarak aşılabilir, teslimi engellemez.
Teslim kuralı ve düzeltme döngüsü: `skills/ads-design-strategy.md → Adım 6`.

## Kapsam Etiketleri

- **[her ekran]** — tüm ekran ve component'larda uygulanır (etiketsiz kurallar da böyledir)
- **[marketing]** — yalnızca strategist'in `marketing` olarak etiketlediği ekranlarda uygulanır
  (HTML'de `<body data-page-kind="marketing">`, Figma'da ekran annotation'ında `page_kind: marketing`).
  `product` / `content` ekranlarda bu maddeleri atla, "N/A — product ekran" / "N/A — content ekran" yaz.
- **[content]** — yalnızca `content` (blog yazısı, makale, doküman, yardım merkezi) ekranlarında uygulanır
  (`data-page-kind="content"` / `page_kind: content`). Diğer tiplerde "N/A" yaz.
- **[web]** — `data-platform="web"` (veya etiketsiz) ekranlar; **[web @375]** bunların 375 görünümü.
  **[uygulama]** — `data-platform="ios|android"` (Figma'da `platform: ios|android`) ekranlar; ölçüler
  `references/mobile-platforms.md`'dedir. Uygulama ekranlarında web'e özgü kurallar (`[marketing]`, `[content]`,
  AT-5 3 eşit feature card, scroll cue, TL-4 1280 CTA kayması, MD-3 `data-page-kind` zorunluluğu, MO web hareket
  bantları) "N/A — uygulama ekranı" yazılır (`mobile-platforms.md → 8`).
- **[dark]** — `color_scheme: both | dark`; `light` ise "N/A — yalnızca açık tema".
- **[yapi]** — `project-state.md → yapi` varsa; yoksa "N/A — eski proje".
- **[korunan]** — `spec.md → ## Bağlayıcı Kararlar`'da `[Korunan]` madde varsa.

## Bağlam Girdileri

Kontrole başlamadan önce şunları topla:
- **Dial'lar:** VARIANCE / MOTION / DENSITY — stratejist brief'inden veya `spec.md → token_directives.dials`'tan
- **`color_scheme`:** `spec.md → token_directives` (`light` / `dark` / `both`)
- **`[Korunan]` kararlar:** `spec.md → ## Bağlayıcı Kararlar` (veya `extension-spec.md → ## Korunacaklar`)
- **`user_explicit` token'lar:** token JSON — AI tells kontrollerinde muaf
- **Kullanıcı metni:** `data-copy="user"` işaretli öğeler (HTML) / spec'te kullanıcı metni olarak geçen
  text layer'lar (Figma) — yazım kontrollerinden (em-dash, placeholder isim, yasak kelimeler) muaf
- **Tez / Kendi dünyası:** stratejist brief'i — "Reddettiği kalıp"a kayan çıktı AT-11
- **Eyebrow istisnası:** `spec.md → ## Bağlayıcı Kararlar` içinde eyebrow'a izin veren madde var mı
- **Platform:** `spec.md → platform`, `app_platforms`, `tablet`, `icon_source`, `component_source`

---

## Kurallar

### SP — Spec uyumu

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| SP-1 | Kapsam listesindeki her component / ekran üretilmiş | değerlendir | her ekran |
| SP-2 | Brief'te geçen durumlar (boş, hata, yükleniyor) üretilmiş | değerlendir | her ekran |

### TK — Token bağlama

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| TK-1 | Renk, font, font-size, radius, spacing token'a bağlı; token değeriyle birebir (yaklaştırma yok, ör. `#1A1B1C` yerine `#000`) | değerlendir | her ekran |
| TK-2 | Spacing ve radius 4'ün katı (4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64…); `user_explicit` muaf. Font-size / line-height için 4 katı yalnızca öneri (`token-standards.md → 4 Katı Skalası`) | Medium | her ekran |

### A11Y — Erişilebilirlik

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| A11Y-1 | spec.md'deki erişilebilirlik gereksinimi karşılanıyor (varsayılan WCAG AA) | değerlendir | her ekran |
| A11Y-2 | Kontrast: normal metin (< 18px normal / < 14px bold) ≥ 4.5:1; büyük metin ≥ 3:1; UI kenarlık / ikon ≥ 3:1 | Blocker | her ekran |
| A11Y-3 | Yazı boyutu: body / label ≥ 14 (önerilen ≥ 16); caption / yardımcı metin ≥ 12 — 12 altı Blocker | Blocker (12 altı); 14 altı body/label değerlendir | her ekran |

### MD — Metadata ve işaretler

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| MD-1 | adesso imzası: `<!-- Designed by: adesso Turkey -->` yorumu + `<meta name="author" content="adesso Turkey">` | Kural (etki: Nitpick) | her ekran |
| MD-2 | Yapay zeka kökeni iması yok (meta etiket, yorum, `data-ai` özelliği, açıklama / annotation metni) | Kural (etki: Nitpick) | her ekran |
| MD-3 | Ekranda sayfa tipi işareti: `marketing \| product \| content` | Medium | her ekran |
| MD-4 | `platform: app \| both` projelerinde ekranda platform işareti: `web \| ios \| android` | Medium | her ekran |
| MD-5 | Ekranlar frame (component değil) ve her ekranda `adStudio` annotation'ı var | Medium | her ekran |

### AT — Yasak desenler (AI tells)

Ayrıntı ve alternatifler: aşağıdaki **Yasak Desenler Kataloğu**. `user_explicit` token değerleri ve kullanıcı metni muaf.

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| AT-1 | Em-dash (`—`) ya da ayraç olarak en-dash (`–`) yok; aralıklar tire ile (`2018-2026`, `₺40-80`) | Kural (etki: Nitpick) | her ekran |
| AT-2 | Sahte ürün UI yok (div / dikdörtgenlerden görev listesi, terminal, dashboard) | Kural (etki: Medium) | her ekran |
| AT-3 | Display fontu kaçınma listesinden `user_explicit` ya da `_meta.font_rationale` gerekçesi olmadan seçilmemiş (gövde fontunda Inter serbest) | Medium | her ekran |
| AT-4 | Başlık üstünde eyebrow / kicker / hero chip yok (Bağlayıcı Kararlar istisnası dışında; uygulamada platform liste bölüm başlıkları muaf) | Medium | her ekran |
| AT-5 | 3 eşit genişlikte yan yana feature card yok | Medium | her ekran |
| AT-6 | Warm cream / bone zemin (`#f5f1ea` ailesi) `user_explicit` olmadan yok; premium-consumer brief'te brass / clay accent ailesi de | Medium | her ekran |
| AT-7 | Placeholder isim yok (`John Doe`, `Acme Corp`…) | Medium | her ekran |
| AT-8 | Pure `#000000` / `#ffffff` yok (uygulamada sistem zeminine eşlenen zemin token'ları muaf — `mobile-platforms.md → 4`) | Medium | her ekran |
| AT-9 | Katalogdaki "Süs ve Meta Metinler" maddeleri yok (her biri ayrı bulgu) | Medium | her ekran |
| AT-10 | Katalogdaki "Görsel" yasakları yok (ışık halesi, dekoratif ızgara / çizgili zemin, sahte yanıp sönen imleç, emoji ikon, elle çizilmiş ikon / süs SVG) | Medium | her ekran |
| AT-11 | Çıktı stratejist brief'indeki "Reddettiği kalıp"a kaymamış | High | her ekran |
| AT-12 | Katalogdaki diğer Layout / İçerik maddeleri yok (sıfır noktalı sayılar, "Elevate" kelimeleri, scroll cue, genel adım etiketleri…) | Medium | her ekran |

### TL — Tutarlılık kilitleri

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| TL-1 | Accent kilidi: tek accent rengi tüm ekranlarda aynı şekilde (CTA zemini, link, focus ring, aktif durum); nötr tonlar ve semantik durum renkleri (hata, başarı, uyarı) kapsam dışı | High | her ekran |
| TL-2 | Radius kilidi: tek köşe sistemi; karışık sistem yalnızca belgelenmiş kuralla ("butonlar pill, kartlar 16, input'lar 8") ve her yerde | High | her ekran |
| TL-3 | Aynı niyete tek CTA etiketi; nav / hero / footer'da aynı | High | her ekran |
| TL-4 | Desktop (1280) CTA etiketi tek satır (birincil CTA en fazla 3 kelime) | High | web |
| TL-5 | Her CTA metni, input, placeholder, focus ring, helper ve hata metni bulunduğu zemine karşı AA; fotoğraf üstü ghost butonda scrim / stroke | Blocker | her ekran |

### LY — Layout disiplini

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| LY-1 | Hero: başlık desktop'ta ≤ 2 satır; alt metin ≤ 20 kelime ve ≤ 4 satır; toplam ≤ 4 metin öğesi; CTA ilk görünümde; üst padding ≤ 96px | High | marketing |
| LY-2 | Hero'da yasak: CTA altında tagline, güven mikro-şeridi, fiyat teaser'ı, madde listesi, avatar sırası | High | marketing |
| LY-3 | VARIANCE > 4 iken ortalanmış hero yok (editorial / manifesto hariç) | Medium | marketing |
| LY-4 | Logo wall hero'nun altında ayrı section ve gerçek logolar (düz metin wordmark değil) | Medium | marketing |
| LY-5 | Nav desktop'ta tek satır, yükseklik ≤ 80px | High | marketing |
| LY-6 | Aynı layout ailesi sayfada bir kez; 8 section'da en az 4 farklı aile | Medium | marketing |
| LY-7 | Art arda en fazla 2 görsel + metin split section | Medium | marketing |
| LY-8 | Bento: hücre sayısı = içerik sayısı; en az 2 hücrede görsel çeşitlilik | Medium | marketing |
| LY-9 | Split-header (solda büyük başlık + sağda küçük paragraf) yok; sağ kolon gerçek görsel / etkileşim taşıyorsa geçerli | Medium | marketing |

### MB — Mobil düzen

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| MB-1 | Her çok kolonlu bölümün 375 düzeni açıkça tanımlı ("kendiliğinden sarar" varsayımı yok) | Medium | her ekran |

### DM — Koyu tema

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| DM-1 | Koyu tema tanımlı (`both` ise iki tema, `dark` ise koyu) | High | dark |
| DM-2 | Kontrast kuralları (A11Y-2, TL-5) her iki temada ayrı ayrı geçiyor | Blocker | dark |
| DM-3 | Koyu temada hiyerarşi korunuyor (birincil / ikincil metin ve yüzey farkları seçilebilir) | High | dark |
| DM-4 | Koyu tema renkleri token'a bağlı (koyu tema için hardcode değer yok) | Medium | dark |
| DM-5 | Sayfa ortasında tek bir bölüm ters temaya geçmiyor | Medium | dark |

### RK — Koruma ve bağlayıcı kararlar

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| RK-1 | `[Korunan]` öğeler değişmemiş: URL / slug, nav etiketleri, form alanı adları ve sırası, logo / wordmark, yasal / KVKK / çerez metinleri, analytics ID ve `data-*` özellikleri | Kural (etki: Medium; kullanıcıyı gerçekten şaşırtıyorsa High) | korunan |
| RK-2 | Mevcut erişilebilirlik kazanımları (focus state, alt metin, klavye gezinmesi) gerilememiş | Blocker | korunan |
| RK-3 | `spec.md → Bağlayıcı Kararlar` maddeleri ihlal edilmemiş | Kural (etki: kararın konusuna göre; belirsizse Medium) | her ekran |

### MO — Hareket

Stratejist brief'indeki MOTION değeri kullanılır (bantlar: `build-html.md → Hareket Bantları`).

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| MO-1 | MOTION < 7 iken yalnızca `transform` / `opacity`; blur / mask / clip-path yalnızca MOTION ≥ 7'de, sınırlı alanda, geçiş sırasında (sürekli / tam ekran değil) | Medium | web |
| MO-2 | Statik öğelerde gereksiz geçiş yok | değerlendir | web |
| MO-3 | Azaltılmış hareket desteği: MOTION > 3 ise her animasyon `prefers-reduced-motion: reduce` altında kapanıyor / sadeleşiyor | High | web |
| MO-4 | Scroll dinleyicisi yok (IntersectionObserver ya da CSS scroll-driven) | Medium | web |
| MO-5 | Hareket miktarı MOTION bandına uygun (1-3: yalnızca durum geçişleri; 4-6: + hover, tek imza an, yumuşak giriş; 7-10: scroll'a bağlı bölümler bekleniyor) | Medium | web |
| MO-6 | MOTION ≥ 4 ise bir imza an var ve brief'teki Tez'e bağlanıyor (hareket her bölüme eşit dağılmamış) | Medium | web |
| MO-7 | Aynı giriş animasyonu 2'den fazla bölümde yok | Medium | web |
| MO-8 | Animasyonlu (nabız atan, yanıp sönen) durum noktası yalnızca gerçek canlı veride | Medium | web |
| MO-9 | Her animasyon tek cümleyle gerekçelendirilebilir; süs amaçlı sonsuz döngü yok | Medium | web |

### OD — Okuma düzeni

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| OD-1 | Gövde paragrafları desktop'ta en fazla ~75 karakter (`max-width` ≈ 60–75ch) | Medium | content |
| OD-2 | 4+ ara başlıklı uzun sayfada içindekiler, yapışkan başlık listesi veya bölüm bağlantıları | Medium | content |
| OD-3 | Landing kalıpları (hero CTA, layout ailesi çeşitliliği, zigzag) okuma akışını bölmüyor | Medium | content |

### QA — Kalite (kusur)

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| QA-1 | Sayfa yüklenirken yakalanmamış JS hatası yok (önce bunu düzelt, diğer bulgular etkilenebilir) | High | her ekran |
| QA-2 | Görünmeyen içerik yok (yükleme ve reveal sonrası metnin belirgin kısmı `opacity: 0` / gizli değil) | High | her ekran |
| QA-3 | Metin örtüşmesi yok (metnin üstüne opak öğe ya da ikinci metin binmiyor) | High (okunamıyorsa Blocker) | her ekran |
| QA-4 | Yatay kaydırma / sekme panelinde ilk ve son kart kenara yapışık, kesik değil | Medium | her ekran |
| QA-5 | Başlık ritmi: başlığın üst boşluğu alt boşluğundan büyük (content ekranında OD ile birlikte tek bulgu) | Medium | her ekran |
| QA-6 | Görünmeyen görsel yok (arka plan görseli ≥ 0.9 opak katman altında ya da opaklığı ~0 değil) | Medium | her ekran |
| QA-7 | Aynı kart / panel içinde aynı metin 3+ yerde tekrarlanmıyor (bilinçli tekrar gerekçelendirilirse geçerli) | Medium | her ekran |

### MW — Mobil web

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| MW-1 | Dokunma alanı: buton, ikon ve linklerin tıklanabilir kutusu (padding dahil) ≥ 24×24 (WCAG 2.5.8); paragraf içi linkler muaf | High (< 24); Medium (24–43) | web @375 |
| MW-2 | Hiçbir buton / link / menü yalnızca hover ile görünür hale gelmiyor (süs amaçlı hover serbest) | High | web @375 |
| MW-3 | `viewport-fit=cover` varken üst / alt sabit öğeler güvenli alanı kullanıyor | Medium | web @375 |
| MW-4 | Tam ekran bölümde `100vh` yok (`100svh` / `100dvh`) | Medium | web @375 |
| MW-5 | 375'te CTA etiketi iki satıra kaymıyor; düzene bağlı QA kuralları (QA-2, QA-3, QA-4, QA-5) 375'te de kendi seviyeleriyle | Medium | web @375 |

### APP — Uygulama ekranları

Ölçüler ve kurallar: `references/mobile-platforms.md`.

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| APP-1 | Cihaz çerçevesi: iOS 390×844 / Android 412×915; durum çubuğu ve home indicator / gezinme çubuğu | Medium | uygulama |
| APP-2 | Güvenli alan: içerik ya da kontrol durum çubuğu, home indicator / gezinme alanına taşmıyor | High | uygulama |
| APP-3 | Dokunma alanı: iOS ≥ 44×44pt, Android ≥ 48×48dp; öğeler arası ≥ 8dp | High | uygulama |
| APP-4 | Sekme çubuğu öğe sayısı: iOS 2–5, Android 3–5 | Medium | uygulama |
| APP-5 | Kaydırınca belirme / bölüm giriş animasyonu yok | Medium | uygulama |
| APP-6 | Büyük yazıda (kök %130) taşan, kesilen ya da örtüşen metin yok | Medium | uygulama |
| APP-7 | Yeniden icat edilmiş kontrol yok (div'den switch, sahte action sheet, özel tab bar, özel global menü); bileşen kaynağı `component_source` ile tutarlı | High | uygulama |
| APP-8 | Ekran geçişleri sistemin (push / sheet / container transform); özel geçiş yok | High | uygulama |
| APP-9 | Bir platformun kalıbı ötekinde yok (Android'de iOS switch, iOS'ta FAB) | High | uygulama |
| APP-10 | İkonlar `icon_source` ile tutarlı (platform → SF Symbols / Material Symbols) | Medium | uygulama |
| APP-11 | `app_platforms: [ios, android]` ise Platform Farkları tablosundaki parçaların iki versiyonu var | High | uygulama |
| APP-12 | Brief'teki Tez / Kendi dünyası navigasyonu ya da kontrolleri değiştirmemiş (yapı platformun) | High | uygulama |
| APP-13 | `tablet: true` ise tablet düzeni yeniden kurgulanmış (büyütülmüş telefon değil) | High | uygulama |

### ST — Yapı (flow ve template)

Kaynak: `flows.md`, `templates.md`, `references/structure-standards.md`.

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| ST-1 | Template'in zorunlu durumları var ve içerikleri gerçek (boş durum metni + eylemi; hata mesajı ne olduğunu ve ne yapılacağını söylüyor) | High | yapi |
| ST-2 | Çıkmaz sokak yok: boş durumdaki eylem önkoşulu tamamlatıyor ya da sıradaki akışı başlatıyor (yalnızca "Ana sayfaya dön" değil) | High | yapi |
| ST-3 | `Dallar`'daki hata / iptal / boş durumlarının ekranda karşılığı var | High | yapi |
| ST-4 | Akışın son adımı `Sonra` hedefine gidiyor (yanlış / ölü bağlantı yok) | High | yapi |
| ST-5 | `## Ortak Davranış`'a uyuluyor (doğrulama zamanı, başarı / hata geri bildirimi, geri alma); yıkıcı işlemde onay var | Medium (onaysız yıkıcı işlem High) | yapi |
| ST-6 | Ekran template'inin bölgelerini ve `Davranış` / `Pattern` maddelerini izliyor; aynı template'i kullanan ekranlar aynı davranıyor | Medium | yapi |
| ST-7 | Akışta ya da template'te tanımlı olmayan işlev / dal eklenmemiş | kapsam kararı (`ads-design-builder.md → Adım 1`) | yapi |
| ST-8 | Yapı işaretleri doğru ve `flows.md` / `templates.md` ile tutarlı (hangisinin doğru olduğuna karar verilmez, ikisi de yazılır) | Medium | yapi |

### CP — Çapraz sayfa tutarlılığı

Ekranlar birbiriyle karşılaştırılarak bulunur (`/ads-check`; reviewer'lar da birden çok ekranda uygular).
Tek ekranda görülebilen ihlaller kendi kurallarıyla raporlanır (accent TL-1, radius TL-2, CTA etiketi TL-3,
korunan öğe RK-1, emoji ikon AT-10).

| Kimlik | Kural | Seviye | Kapsam |
|---|---|---|---|
| CP-1 | Ortak öğeler (nav, header, footer, sidebar; uygulamada sekme / navigation bar) her ekranda aynı yapı, aynı sıra; eksik ya da fazla alt öğe yok | değerlendir (gezinmeyi bozan eksik öğe Blocker) | her ekran |
| CP-2 | Ortak öğe her ekranda aynı token'ları kullanıyor (bir ekranda token, ötekinde sabit değer yok) | High | her ekran |
| CP-3 | Aynı değer her ekranda aynı yazılıyor (`#1a73e8` / `#1A73E8` / `rgb(26,115,232)` karışık değil) | Medium | her ekran |
| CP-4 | Gezinme metinleri, hedefleri ve ikonları her ekranda aynı | High | her ekran |
| CP-5 | İkon disiplini: aynı hiyerarşide filled / outline karışık değil, aynı öğe için tek ikon ailesi; vektör yerine raster ikon Medium | High (raster Medium) | her ekran |
| CP-6 | Koyu tema her ekranda aynı semantik değişken setini ve aynı değerleri tanımlıyor | Medium | dark |
| CP-7 | Kullanıcı metni (slogan, yasal metin) ekranlar arasında birebir aynı | High | her ekran |
| CP-8 | Aynı platformun ekranlarında sekme / navigation bar aynı öğeleri aynı sırayla gösteriyor; cihaz çerçevesi ve güvenli alan aynı | High (çerçeve farkı Medium) | uygulama |
| CP-9 | Font rolleri ekranlar arasında aynı (display öğeleri display fontu, gövde / buton / form / nav gövde fontu) | Medium | her ekran |

---

## Yasak Desenler Kataloğu

ads-design-builder ve reviewer'lar referans alır (AT kuralları). İşaretlenmemiş maddeler **Medium**.

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
| Em-dash (`—`) — AT-1 (kullanıcı metni muaf) | Virgül, nokta, iki nokta, parantez veya iki ayrı cümle |
| Ayraç olarak en-dash (`–`) — AT-1 | Normal tire (`-`); aralıklar `2018-2026` |
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
| Div-based fake screenshot / sahte ürün UI — AT-2 | Gerçek component, gerçek görsel veya açık placeholder |
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

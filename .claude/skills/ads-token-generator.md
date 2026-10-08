---
name: ads-token-generator
description: Tamamlanmış bir spec.md'den (spec-intake veya impact-analysis çıktısı) design token seti üretmek için kullanılır. Spec'teki Referans Girdiler'in `constraint` veya `inspiration` etiketine göre iki farklı modda çalışır. "Token oluştur", "design token üret", spec tamamlandıktan sonraki adım gibi taleplerde tetiklenir.
---

# Token Generator

## Durum Yönetimi

Bu skill `references/skill-state-pattern.md` kalıbını uygular.

Başlamadan önce mevcut state dosyasını kontrol et:
```bash
ls /tmp/ads-token-generator-*.json 2>/dev/null
```
Dosya varsa kullanıcıya "kaldığım yerden devam et / yeni başlat" sor.
Her koleksiyon tamamlandığında `/tmp/ads-token-generator-{RUN_ID}.json` dosyasını güncelle.
Başarıyla tamamlanınca dosyayı sil.

---

## Token Standartları

Başlamadan önce `.claude/references/token-standards.md` dosyasını oku.
Geçerli source değerleri, $value kuralı, zorunlu koleksiyonlar ve 4 katı skalası orada tanımlıdır — bu dosya kazanır.

---

## Doğrulama İlkesi — Hiçbir Şeyi Varsayma
"Muhtemelen"/"pattern'e göre" diye bir değeri doğrulamadan token setine
yazma — doğrulaması mümkünse (ek bir instance sorgusu, screenshot
karşılaştırması) doğrula. Mümkün değilse "doğrulanmadı" diye açıkça
işaretle, kesinmiş gibi sunma.

## Amaç
Tamamlanmış bir spec'ten, projenin ihtiyacına uygun bir design token seti
(W3C DTCG formatında) üretmek.

## Model Optimizasyonu — `ads-token-generator-worker` Subagent'ı
Mekanik veri toplama (Figma variable/layer çekme, görsellerden ham stil
gözlemi) `ads-token-generator-worker` subagent'ına devredilir.
Ana akışta kalanlar: token mimarisine karar verme, erişilebilirlik/kontrast
kontrolü, kullanıcı etkileşimi.

**Önemli — worker tool erişimi:** Worker spawn etmeden önce Figma MCP
araçlarının mevcut bağlamda erişilebilir olduğunu teyit et. Erişim yoksa
worker spawn etme — veri toplamayı doğrudan ana akışta yap. Küçük bir
modelle spawn edeceksen Figma MCP erişimini doğrula; yoksa modeli yükselt
veya ana akışta çalış.

## Girdi
Bir `spec.md` (spec-intake çıktısı). Özellikle şu bölümler okunur:
- Design System Kaynağı (sıfırdan / türetilecek)
- Referans Girdiler → Design Token Library (etiketi: `constraint`/`inspiration`)
- **`token_directives` meta bloğu** (spec-intake v2 çıktısında bulunur —
  varsa oku, yoksa adım 0'dan başla)
- Referans Girdiler → Ekran Görüntüleri / Component Showcase
- Erişilebilirlik Gereksinimleri

## Akış

### 0. Kaynak Güven Değerlendirmesi (constraint modunda zorunlu)

Spec etiketi `constraint` ise — veri çekmeye başlamadan önce — kaynak
güvenilirliğini belirle. Spec'te `token_directives.trust_profile` varsa
oku ve bu adımı atla. Yoksa kullanıcıya sor:

> "Bu kaynak dosyaya ne kadar güveniyorsunuz?
> — **Tam:** Tüm değerleri koru, sadece mimari yeniden organize et
> — **Kısmi:** Belirli katmanları koru, diğerlerini yeniden tasarla (hangilerini belirtin)
> — **Yönsel:** Sadece genel yönü al (marka renk ailesi, font), değerleri sıfırdan kur"

Cevaba göre **Constraint Profili** belirle:

| Profil | Ne korunur | Ne yeniden tasarlanır |
|--------|-----------|----------------------|
| `full` | Her şey | — |
| `partial` | Kullanıcının belirttiği katmanlar | Geri kalanlar |
| `directional` | Marka ailesi (renk tonu, font adı) | Tüm değerler |

`partial` seçilirse hangi katmanların korunacağını netleştir.
**Bu adım `inspiration` modunda atlanır.**

---

### 1. Modu belirle
Spec'teki Design Token Library etiketine ve `token_directives` bloğuna bak:
- **`constraint`** → Adım 0 → Adım 2a
- **`inspiration`** → Adım 2b
- **`brand_guide_mode: true`** → Adım 2c (brand-guide modu) → ardından Adım 2b
- Etiket yoksa → kullanıcıya sor: sıfırdan başlangıç seti mi önerilsin?

---

### 1.5. Source Assignment — Hazırlık

Veri toplamaya başlamadan önce `token_directives.aesthetic_directives.user_explicit` bloğunu oku
(spec-intake v2 çıktısında bulunur). Bu listeyi bellekte tut — veri topladıktan sonra
her token'a source atanırken kullanılacak.

**Geçerli source değerleri (yalnızca bu üçü):**

| `source` | Ne zaman atanır |
|---|---|
| `user_explicit` | Token değeri `user_explicit.fonts/colors/styles` listesiyle eşleşiyor |
| `reference_derived` | Değer 2a veya 2b'de Figma'dan / reference'dan çekildi (güven seviyesi ne olursa olsun) |
| `ai_inferred` | Agent'ın kendi kararı |

**`user_explicit.colors` listesini işle:**

Liste okunurken her değerin hex kodu mu yoksa metin açıklaması mı olduğunu belirle:

- `#` ile başlayan 3 veya 6 haneli değer → **hex** → token'a doğrudan yaz, `source: "user_explicit"`
- `#` olmadan 3 veya 6 haneli alfanumerik değer (örn. `f5f1ea`, `fff`) → **hex** — başına `#` ekle, token'a yaz, `source: "user_explicit"`
- Diğer her şey → **metin açıklaması** → aşağıdaki tablodan renk ailesini bul, o aile içinde token üret, `source: "user_explicit"`

Metin açıklaması da `user_explicit` sayılır — kullanıcı yönü belirtmiştir, değeri değil.
Tabloda karşılık bulunamazsa kullanıcıya sor: "Bu renk için yaklaşık bir hex kodu verebilir misiniz?"

| Metin (TR/EN) | Renk ailesi | Örnek hex aralığı |
|---|---|---|
| krem, cream, kirli beyaz | warm off-white | `#F5F0E8` – `#FAF7F2` |
| bej, beige | warm sand | `#E8DDD0` – `#D4C5B0` |
| toprak, earth, earthy | warm brown | `#8B6347` – `#6B4226` |
| gri, grey, gray | neutral grey | `#6B7280` – `#374151` |
| lacivert, navy | deep blue | `#1B2A4A` – `#0F1F3D` |
| turkuaz, teal | blue-green | `#0D9488` – `#0F766E` |
| zeytin, olive | yellow-green | `#6B7C2D` – `#4D5A1E` |
| terracotta, kiremit | warm red-orange | `#C2603A` – `#A0452A` |
| mercan, coral | pink-orange | `#F4845F` – `#E8643C` |
| açık mavi, sky blue | light blue | `#7DD3FC` – `#38BDF8` |
| siyah, black, koyu | off-black | `#111111` – `#1A1A1A` |
| beyaz, white, açık | off-white | `#F8F8F8` – `#FAFAFA` |

**`selected_options` bloğunu da oku:**

`token_directives.aesthetic_directives.selected_options` mevcutsa şu eşlemeyi uygula:

| `selected_options` alanı | Token üretimindeki etkisi |
|---|---|
| `language: "minimal / editorial"` | Spacing geniş tut, component'lar sade — gereksiz dekorasyon ekleme |
| `language: "sıcak / organik"` | Radius yüksek, renk tonu sıcak tarafa çek |
| `language: "teknik / fonksiyonel"` | Monospace ağırlık, neutral renk, yoğun grid |
| `language: "cesur / deneysel"` | Kontrast yüksek, asimetrik spacing değerleri |
| `density: "low density"` | Spacing scale'i geniş tut (base × 1.5) |
| `density: "high density"` | Spacing scale'i sıkıştır (base × 0.75) |
| `typography: "geometrik sans-serif"` | Display: Cabinet Grotesk, General Sans, Clash Display ailesi |
| `typography: "humanist sans-serif"` | Display: Satoshi, Switzer ailesi |
| `typography: "serif / editorial"` | Display: Spectral, Source Serif 4, Erode ailesi |
| `typography: "monospace / teknik"` | Display: JetBrains Mono, Commit Mono ailesi |
| `color_approach: "nötr + tek accent"` | Restrained: gri/nötr zemin, tek güçlü accent rengi |
| `color_approach: "tek baskın renk"` | Committed: tek doygun renk yüzeyin %30–60'ını kaplar (hero, section zeminleri); nötrler destekler |
| `color_approach: "sınırlı palet"` | 2-3 renk, her biri semantic role taşır |
| `color_approach: "zengin / çok renkli"` | Full palette: geniş primitive rampa, 3-4 adlandırılmış semantic rol |
| `color_approach: "renge boyanmış yüzey"` | Drenched: zemin rengin kendisi (`color-bg` doygun marka rengi); metin ve yüzey katmanları bu renkten türetilir, kontrast her katmanda ayrıca doğrulanır |

**Font rolleri:** Typography katmanında iki rol üretilir: `font-family-display` (büyük başlıklar,
hero, pazarlama vurguları) ve `font-family-body` (gövde metni, buton, form, tablo, navigasyon).
İkisi aynı font olabilir. Yukarıdaki tablo **display** rolü içindir; body rolü için okunaklı bir iş
fontu veya sistem yığını (`Inter`, `system-ui` vb.) serbesttir. Font kaçınma listesi → Adım 2c.

`selected_options` değerleri `ai_inferred` token'ların üretiminde yol gösterir —
`user_explicit` değerlerin üzerinde baskı oluşturmaz.

**Not — Adım 2a'daki Figma çekim seviyeleri ve source eşlemesi:**
- Seviye 1 (`get_variable_defs`) → `reference_derived`
- Seviye 2 (`get_design_context` / css-fallback) → `reference_derived` + `"confidence": "low"` notu
- Seviye 3 (`get_screenshot` / görsel tahmin) → `reference_derived` + `"confidence": "estimated"` notu
- Seviye 4 (manuel kullanıcı girişi) → `user_explicit`

`user_explicit` token'lara isteğe bağlı `"note"` alanı ekle:
`"Normally discouraged; honored because user explicitly requested."`

---

### 2a. Constraint modu — Figma Veri Çekme

**Figma MCP Fallback Zinciri (sırayla dene, başarısız olunca bir sonrakine geç):**

**Seviye 1 — `get_variable_defs`**
Bu araç **Figma Desktop açık + aktif layer seçimi** gerektirir.
Hata alınırsa kullanıcıya belirt:
> "Figma Desktop'ta herhangi bir layer'ı seçmeniz gerekiyor."
İki denemede başarısız olursa Seviye 2'ye geç, bu araçla denemeyi bırak.

**Seviye 2 — `get_design_context`**
`get_metadata` ile sayfadaki node ID'lerini tespit et, ardından
bileşenler için `get_design_context` çağır. CSS `var(--token, fallback)`
çıktısından değerleri çıkar.

⚠️ Fallback değerleri gerçek Figma variable değerlerinden farklı olabilir.
Her çekilen değeri `"source": "reference_derived", "confidence": "low"` olarak işaretle
ve bunu token dosyasının `_meta` bölümünde belgele.

**Seviye 3 — `get_screenshot`**
Sayfa görüntüsü al, renkleri görsel olarak çıkar.
Tüm değerleri `"source": "reference_derived", "confidence": "estimated"` olarak işaretle.

**Seviye 4 — Manuel**
Yukarıdaki üç yöntem de başarısız olursa kullanıcıya sun:
a) Token değerlerini JSON veya liste olarak paylaşsın,
b) Ekran görüntüsü göndersin (değerler tahmini olacak).

**Constraint Profiline göre çekim kapsamı:**
- `full`: Tüm katmanlar için fallback zincirini uygula
- `partial`: Sadece korunan katmanlar için çek; yeniden tasarlananlar için → 2b
- `directional`: Sadece marka ailesini (dominant renk, font adı) tespit et → 2b

**Instance override çelişkisi:**
Aynı semantik rol için farklı instance'lar farklı değer gösterirse sessizce
birini seçme — çelişkiyi raporla, kullanıcıya sor.

---

### 2b. Inspiration modu / Yeniden Tasarlanan Katmanlar

Referans görselleri ve Component Showcase'i analiz et. Renk ailesini,
tipografi yönünü ve spacing ritmini gözlemle. Değerleri olduğu gibi
kopyalama — gözlemlenen yönden türeterek WCAG uyumlu, özgün değerler üret.
Çıktıyı taslak olarak sun, varsayımları açıkça belirt.

---

### 2b.5. Brand-Guide Modu (`brand_guide_mode: true`)

`token_directives.brand_guide_mode` true ise bu adım çalışır.
Korunan katmanlar: `preserved_layers` (genellikle `colors` ve `typography`).

**Korunan katmanlar için:**

`brand_guide_source`'u oku. Kaynak türüne göre değerleri çıkar:

| Kaynak | Yöntem |
|---|---|
| PDF / döküman | `reference-ingest` çıktısından renk + font değerlerini al |
| Kullanıcının listelediği değerler | Doğrudan kullan |
| Görsel (logo, materyaller) | `get_screenshot` ile görsel analiz — `confidence: "estimated"` |

Çıkarılan marka renklerini ve fontlarını kullanıcıya göster:

> "Kılavuzdan şu değerleri okudum: [liste]. Bunlar token'lara binding
> geçsin mi, yoksa bazıları sadece yön olarak kalsın mı?"

| Kullanıcı yanıtı | Source ataması |
|---|---|
| Tamamı binding | `user_explicit` |
| Kısmen binding | Belirtilenlere `user_explicit`, geri kalanına `reference_derived` |
| Sadece yön | `reference_derived` + `"confidence": "directional"` |

**Korunmayan katmanlar için (spacing, semantic yapı, component'lar):**
→ Adım 2b (inspiration modu) ile sıfırdan üret.

`_meta`'ya ekle:
```json
"brand_guide_mode": true,
"brand_guide_preserved": ["colors", "typography"],
"brand_guide_source": "[kaynak adı]"
```

---

### 2c. AI Tells Filtresi — Source Assignment Tamamlandıktan Sonra

2a ve/veya 2b tamamlandıktan sonra çalışır. **Yalnızca `source: "ai_inferred"` olan
token'lara uygulanır.** `user_explicit` ve `reference_derived` bu adımı atlar.

**Font kaçınma listesi — yalnızca `font-family-display` rolünde:**

Yapay zekânın refleksle seçtiği display fontları:
`Inter`, `Fraunces`, `Instrument Serif`, `Instrument Sans`, `Playfair Display`, `Cormorant`,
`Lora`, `Crimson`, `Newsreader`, `Syne`, `Space Grotesk`, `Space Mono`, `IBM Plex` (tüm aile),
`DM Sans`, `DM Serif`, `Outfit`, `Plus Jakarta Sans`, `Geist`, `Roboto`.

- `ai_inferred` display fontu bu listeden seçilmez. Yerine Adım 1.5'teki `selected_options` tablosunun display önerilerini kullan.
- Listeden bir font yine de gerekiyorsa `_meta.font_rationale` alanına başka hiçbir fontun
  karşılayamayacağı gerekçeyi yaz. "Konuyla çağrışım" (ör. "wellness → serif") gerekçe sayılmaz.
- `font-family-body` rolünde bu liste **uygulanmaz**: `Inter`, sistem yığını ve diğer iş fontları serbesttir.

**Renk yasakları (her brief için):**
- Pure `#000000` → off-black kullan (örn. `#111111`, `zinc-950`)
- Pure `#ffffff` → off-white kullan (örn. `#fafafa`, `#f8f8f8`)
  - **İstisna — mobil uygulama** (`platform: app | both`): sistem zeminine eşlenen zemin token'ları
    (`color-bg-*` → iOS systemBackground / Android surface, bkz. Adım 2f) saf `#FFFFFF` / `#000000` olabilir.
    Metin ve diğer renklerde yasak sürer.
- Warm cream / bone zemin: `#f5f1ea`, `#fbf8f1`, `#faf7f1`, `#ece6db` ailesi — yapay zekânın
  "zevkli" varsayılan yüzeyi. Yerine nötr, soğuk veya brief'in kendi malzemesinden türetilmiş bir zemin.

**Renk yasakları (premium-consumer brief'lerde — cookware, wellness, artisan, luxury):**
- Accent: `#b08947`, `#b6553a`, `#9a2436`, `#9c6e2a` ailesi (brass/clay/oxblood)
- Yerine öner: cold luxury (silver-grey + chrome), forest (deep green + bone), cobalt + off-white

**AI-purple yasağı:**
- `#7c3aed`, `#8b5cf6`, `#a855f7` — brief açıkça mor istemedikçe yasak

Yasak değer düzeltildiyse `_meta`'ya logla:
`"ai_tells_corrected": ["display: Outfit → Cabinet Grotesk (kaçınma listesi)"]`

---

### 2d. Sayısal Değer Kuralı — 4 Katı Skalası

Spec'te aksi belirtilmedikçe aşağıdaki token kategorilerindeki tüm sayısal değerler
4'ün katı olmalı:

- **Spacing** (margin, padding, gap, inset — her boyut)
- **Border radius** (corner radius)
- **Icon / component boyutları** (width, height)

**Font size ve line height (px) — öneri:** varsayılan ölçeği 4'ün katlarından kur, ama tipografik oran
gerektiriyorsa (ör. 15px gövde, 13px etiket) farklı değer kullanabilirsin; o token'ın `_meta`'sına kısa
gerekçe yaz. Okunabilirlik alt sınırları (caption ≥ 12px, gövde ≥ 14px) zorunludur.

**Kabul edilen değerler:** 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96, 128 …

**İstisnalar — kullanıcı açıkça farklı bir değer/sistem belirtmişse:**
- `user_explicit` source'lu token'lar bu kuraldan muaf; değeri olduğu gibi koru
- Spec'te "8 bazlı grid", "5px grid", "kendi ölçeğimiz" gibi açık bir yön varsa onu uygula
- Brand guide'dan gelen (`reference_derived`) değerler yuvarlanmaz; spacing/radius'ta 4 katı dışında
  kalanları `_meta`'ya logla (tipografi zaten öneri kapsamında)

**Üretim sırasında kural ihlali tespit edilirse:**
Değeri sessizce 4 katına yuvarlama. Kullanıcıya göster:

> "Spacing ve radius değerlerini 4 katı skalasına (4, 8, 12, 16…) göre kuruyorum; yazı boyutlarında
> da 4 katını öneriyorum ama okunabilirlik gerektirirse ara değer kullanabilirim. Farklı bir grid
> sistemin varsa belirtebilirsin."

Mesaj bir kez gösterilir (ilk token setinde), sonraki üretimlerde tekrar sorulmaz.

---

### 2e. Değer Bütünlüğü Kontrolü — Undefined Yasağı

Token dosyasına yazmadan önce her token'ın `$value` alanını kontrol et:

- `$value` hiçbir zaman `undefined`, `null` veya boş string (`""`) olamaz
- Bu durumda olan her token dosyaya **yazılmaz** — Açık Sorular listesine eklenir
- Tüm koleksiyonlar tamamlandıktan sonra Açık Sorular listesi varsa kullanıcıya göster:

> "Aşağıdaki token'lar için değer üretemediم — bunları token dosyasına yazmadım:
> - [token adı] ([koleksiyon]): [neden üretilemedi]
>
> Bu token'ları şimdi birlikte doldurmak ister misiniz?"

Kullanıcı değer verirse token'ı `source: "user_explicit"` olarak ekle.
Kullanıcı ertelerse token'ı dosyadan dışarıda bırak — eksik `$value` ile asla yazma.

---

### 2f. Platform Rol Notu — yalnızca `platform: app | both`

Uygulama projelerinde Color koleksiyonundaki her semantik renk token'ına platform karşılığını
`$extensions.platform` olarak ekle. Token adları değişmez; eşleme **role** göre yapılır —
tablo: `.claude/references/mobile-platforms.md → 4. Renk rolleri ve tema`.

```json
"color-text-primary": {
  "$type": "color",
  "$value": "#111111",
  "$extensions": {
    "mode": { "dark": "#ededed" },
    "platform": { "ios": "label", "android": "onSurface" }
  },
  "source": "ai_inferred"
}
```

- Yalnızca `app_platforms`'ta olan platformu yaz (yalnızca iOS ise `android` anahtarı olmaz).
- Karşılığı olmayan token'lara (ör. marka illüstrasyon renkleri) not ekleme.
- Adım 4'teki sunumda eşleme tablosunu göster: `token → iOS rolü → Android rolü`.
- Yazı ölçeği bu adımdan etkilenmez — uygulamada da adStudio ölçeği (caption ≥ 12, 4 katı önerisi) geçerlidir.

---

### 3. Erişilebilirlik Kontrolü + Tasarım Yetkisi

Spec'te WCAG AA veya üstü gereksinim varsa tüm metin/arkaplan
kombinasyonlarını kontrol et.

`token_directives.color_scheme: both` ise kontrolü **her mod için ayrı ayrı** yap —
açık temada geçen bir çift koyu temada kalabilir. Sorunları mod adıyla listele:
`text-secondary / bg-default [dark]: 3.8:1`. Koyu mod değerlerinde saf `#000000`
zemin kullanma (off-black: `#111111`–`#141414` aralığı) — aşırı kontrast ve halo
etkisi yaratır.

**Sorun bulunduğunda:**

**`full` constraint profili** — değiştirme yetkisi yok, kullanıcıya sor:
> "[Token] WCAG AA başarısız (X:1, minimum 4.5:1).
> En yakın uyumlu değer [hex]. Güncelleyeyim mi?"

**`partial` / `directional` / `inspiration` — yeniden tasarlanan katmana düşüyorsa:**
Kullanıcıya sormadan düzelt, `_meta`'da belgele.

Birden fazla sorun varsa hepsini listele, tek soru olarak sun.

---

### 3.5. Zorunlu Kontrol — 6 Koleksiyonlu Yapı
Token dosyasını sunmadan önce kontrol et:
- [ ] `Primitives` (color rampası, font family/weight)
- [ ] `Layout` (space, radius, stroke)
- [ ] `Color` (semantic: background, text, border — Light/Dark modları)
- [ ] `Typography` (heading, body, label, caption skalası)
- [ ] `Component` (button, input, card, modal vb.)
- [ ] `Viewport` (responsive breakpoint'ler — aşağıdaki standart seti kullan)
- [ ] **Mode:** `token_directives.color_scheme: both` ise (veya spec'te ikisi de
  destekleniyor deniyorsa) her semantic token için `$value` (light) ve
  `$extensions.mode.dark` değeri bulunmalı — format `token-standards.md → Tema Modları`;
  kontrast her iki modda geçmeli (Adım 3)

**Viewport koleksiyonu — standart breakpoint seti:**

Spec'te farklı bir değer belirtilmedikçe aşağıdaki seti kullan (`source: "ai_inferred"`).
Kullanıcı farklı bir değer açıkça belirtmişse o değeri kullan (`source: "user_explicit"`).

| Token adı | Değer | Kapsadığı cihazlar |
|---|---|---|
| `viewport-mobile` | 375px | iPhone SE, küçük Android |
| `viewport-mobile-lg` | 430px | iPhone Pro Max, büyük Android |
| `viewport-tablet` | 768px | iPad mini, tablet |
| `viewport-desktop` | 1280px | laptop, küçük monitör |
| `viewport-desktop-lg` | 1440px | standart monitör |
| `viewport-wide` | 1920px | geniş ekran |

Bilgi yoksa `reconstructed` etiketiyle makul başlangıç skalası öner, atlama.

---

### 4. Token setini sun

**Dosya adı normalizasyonu:**
Token dosyasını kaydetmeden önce proje adını aşağıdaki kuralla normalize et:
- Türkçe harfleri dönüştür: ç→c, ğ→g, ı→i, İ→i, ö→o, ş→s, ü→u (büyük harfleri de)
- Tüm harfleri küçük yap
- Boşlukları tire (`-`) ile değiştir
- Tire ve alfanumerik dışındaki karakterleri kaldır

Örnekler: `Noma Wellness` → `noma-wellness-tokens.json` · `Örnek Bank` → `ornek-bank-tokens.json`
(dönüştürme yapılmazsa `ö` silinip `rnek-bank` çıkar)

Bu kural `ads-design-strategy`'nin dosyayı bulabilmesi için zorunludur — farklı bir
normalizasyon kullanılırsa design-strategy "token seti bulunamadı" hatası verir.

**Persistence guard:** Token setini yazmadan önce normalize edilmiş dosya adıyla
dosyanın zaten var olup olmadığını kontrol et. Mevcutsa kullanıcıya sor:

> "`[normalize-adı]-tokens.json` zaten mevcut. Üstüne yazmamı (tüm mevcut token'lar
> değişir) yoksa yeni bir dosya adıyla mı kaydedeyim?"

Kullanıcı onaylamadan mevcut dosyanın üstüne yazma.

`_meta` bölümünde belge: değer kaynakları, constraint profili, açık belirsizlikler.

Uygulama projesinde (`platform: app | both`) sunuma Adım 2f'deki platform rolü eşleme tablosunu ekle.

---

### 5. HTML Showcase sorusu (opsiyonel — HER SEFERİNDE SOR, otomatik yapma)
Token seti onaylandıktan sonra sor:
> "Bu tokenlarla bir HTML Component Showcase oluşturayım mı?"

Evet gelirse showcase üret. Aşağıdaki kural geçerlidir:

**Referans Görsel Kullanım Kuralı:**
Referans görseller (spec'teki ekran görüntüleri, müşteri görselleri vb.)
**ilham kaynağı** olarak kullanılır — içerik yapısı, bileşen türleri ve
genel akış referans alınabilir. Ancak görsel dil tokenlardan türetilmeli;
renk, tipografi, spacing, radius değerleri token sisteminden gelmeli.
Sonuç referansla **benzer ama özgün** olmalı: birebir kopya kabul
edilmez, hedef **maksimum %75 görsel benzerlik**tir.

Bu kural, proje sıfırdan tasarlanıyorsa ve kullanıcı "bu referansı
birebir uygula" gibi açık bir yönlendirme vermemişse geçerlidir.
Kullanıcı birebir uygulama isterse kural delinebilir.

---

### 6. Sıradaki adım

Showcase sorusu yanıtlandıktan (veya atlandıktan) sonra, mevcut duruma göre yönlendir:

**Mevcut projeye yeni özellik/ekran ekleniyor** (`screens/` veya `components/` klasörü zaten varsa):
> "Token seti hazır. Mevcut projeye yeni bir özellik ekliyorsunuz — devam etmek için `/ads-iterate` komutunu çalıştırın."

**Yeni proje — ilk kez tasarım üretiliyor:**
> "Token seti hazır. Tasarım pipeline'ını başlatmak için `/ads-design-strategy` komutunu çalıştırın. Bu skill hem Figma hem HTML/CSS çıktısı üretebilir — başlangıçta hangisini istediğinizi sorar."

---

## Çıktı Formatı
`[proje-adı]-tokens.json`, W3C DTCG formatı (`$type`/`$value`/`$description`),
Primitives/Layout/Color/Typography/Component/Viewport katmanlarıyla. `_meta` bloğu zorunlu.

Her token `"source"` alanı taşır:
```json
{
  "font-family-display": {
    "$type": "fontFamily",
    "$value": "Playfair Display",
    "$description": "Başlık / display fontu",
    "source": "user_explicit",
    "note": "Display kaçınma listesinde; kullanıcı açıkça istediği için korundu."
  },
  "font-family-body": {
    "$type": "fontFamily",
    "$value": "Inter",
    "$description": "Gövde / UI fontu",
    "source": "ai_inferred"
  },
  "color-accent": {
    "$type": "color",
    "$value": "#10b981",
    "$description": "Birincil accent rengi",
    "source": "ai_inferred"
  },
  "Viewport": {
    "viewport-mobile":    { "$type": "dimension", "$value": "375px", "source": "ai_inferred" },
    "viewport-mobile-lg": { "$type": "dimension", "$value": "430px", "source": "ai_inferred" },
    "viewport-tablet":    { "$type": "dimension", "$value": "768px", "source": "ai_inferred" },
    "viewport-desktop":   { "$type": "dimension", "$value": "1280px", "source": "ai_inferred" },
    "viewport-desktop-lg":{ "$type": "dimension", "$value": "1440px", "source": "ai_inferred" },
    "viewport-wide":      { "$type": "dimension", "$value": "1920px", "source": "ai_inferred" }
  }
}
```

`_meta` bloğuna ekle:
```json
"_meta": {
  "ai_tells_corrected": ["display: Outfit → Cabinet Grotesk (kaçınma listesi)"]
}
```

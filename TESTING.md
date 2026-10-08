# adStudio — Test Rehberi

## Ortam Gereksinimleri

| Gereksinim | Zorunlu mu | Notlar |
|------------|------------|--------|
| Claude Code (claude CLI) | Evet | |
| Git | Evet | |
| Figma desktop uygulaması | Hayır | Sadece Figma çıktısı için |
| Figma Claude Code eklentisi | Hayır | Figma → Plugins → Claude Code |
| Figma MCP sunucusu (Claude Code ayarları) | Hayır | Eklentiyle birlikte etkinleştirilir |

Figma kurulu değilse tüm senaryolar HTML/CSS çıktısıyla çalışır.

---

## Test Projesi Kurulumu

```bash
mkdir ads-test && cd ads-test
git clone https://github.com/mertozcelenk/adStudio.git .
claude .
```

---

## Senaryo 1 — Spec Intake (Temel)

**Amaç:** spec-intake'in soruları doğru sorduğunu ve spec.md ürettiğini doğrula.

**Adımlar:**
1. `/ads-spec-intake` çalıştır
2. Soruları yanıtla — en az şunlara cevap ver:
   - Proje adı
   - Platform (web)
   - Renk şeması (sadece açık tema)
   - Design system kaynağı (sıfırdan kurulacak)
   - S1-S5 estetik yön soruları
3. Referans girdi sormadan tamamla

**Başarı kriterleri:**
- [ ] `spec.md` proje kökünde oluştu
- [ ] `spec.md` içinde `<!-- BEGIN:token_directives -->` bloğu var
- [ ] `source_label` ve `trust_profile` alanları dolu veya boş ama blok mevcut
- [ ] S1, S2 ve S5 seçenekleri açıklama ve örnek ürünle gösterildi
- [ ] `token_directives` içinde `selected_options.motion`, `color_scheme` ve boş `dials` bloğu var
- [ ] "Devam etmek için `/token-generator` komutunu çalıştırın" mesajı gösterildi
- [ ] Açık Sorular bölümü yalnızca gerçekten sorulmuş ama cevaplanmamış alanları içeriyor

---

## Senaryo 2 — Spec Intake + Referans Girdi

**Amaç:** reference-ingest zincirinin çalıştığını ve 9 alanlı formatı ürettiğini doğrula.

**Adımlar:**
1. `/ads-spec-intake` çalıştır
2. Referans girdi sorusunda bir Figma linki veya görsel sağla
3. Tamamla

**Başarı kriterleri:**
- [ ] `spec.md` içinde Referans Girdiler bölümü 9 alanlı formatla dolu
  (`kaynak`, `tür`, `label`, `güven`, `içerik_özeti`, `tespit_edilen_değerler`, `bilinen_sorunlar`, `işleme_notu`, `ingest_durumu`)
- [ ] `ingest_durumu` değeri `tamamlandı`, `kısmi` veya `araç_erişim_hatası` — boş değil
- [ ] `inspiration_images_trust` alanı `token_directives` bloğunda yazılmış

---

## Senaryo 3 — Token Üretimi

**Amaç:** Spec.md'den token JSON üretildiğini doğrula.

**Ön koşul:** Senaryo 1 tamamlanmış, `spec.md` mevcut.

**Adımlar:**
1. `/ads-token-generator` çalıştır

**Başarı kriterleri:**
- [ ] `[proje-adı]-tokens.json` proje kökünde oluştu
- [ ] JSON içinde şu koleksiyonlar var: `Primitives`, `Layout`, `Color`, `Typography`, `Component`
- [ ] Her token'da `$type`, `$value`, `$description` alanları mevcut
- [ ] `_meta` bloğu var ve kaynak bilgisini içeriyor

---

## Senaryo 4 — Design Strategy (Quick Mod, HTML)

**Amaç:** Pipeline'ın quick modda HTML çıktısı ürettiğini doğrula.

**Ön koşul:** Senaryo 1 tamamlanmış, `spec.md` mevcut. Token JSON opsiyonel.

**Adımlar:**
1. `/ads-design-strategy` çalıştır
2. "Hızlı yap" veya "quick mod" de
3. Tek bir küçük component iste (örn. "sadece bir button yap")

**Başarı kriterleri:**
- [ ] ads-design-strategist brief döndürdü (Kapsam, Persona, Style Direction, Mod)
- [ ] ads-design-planner çalıştırılmadı (quick modda atlanır)
- [ ] `components/atoms/button.html` veya benzeri bir dosya oluştu
- [ ] HTML dosyası CSS custom properties kullanıyor (`--color-*`, `--spacing-*` vb.)
- [ ] Dosya tarayıcıda açılabiliyor
- [ ] Design Read satırında `VARIANCE n · MOTION n · DENSITY n` var; değiştirme fırsatı soruldu
- [ ] Onaydan sonra `spec.md → token_directives.dials` dolduruldu
- [ ] Builder özetinde `## Pre-flight` raporu var

---

## Senaryo 5 — Design Strategy (Deep Mod, HTML)

**Amaç:** Pipeline'ın deep modda planlama yapıp HTML ürettiğini doğrula.

**Ön koşul:** Senaryo 3 tamamlanmış, token JSON mevcut.

**Adımlar:**
1. `/ads-design-strategy` çalıştır
2. "Deep mod" de veya hiçbir şey söyleme (strategist karar versin)
3. 2-3 component içeren küçük bir kapsam belirt

**Başarı kriterleri:**
- [ ] ads-design-strategist brief döndürdü
- [ ] `project-state.md` builder'dan **önce** `cikti_formati` / `platform` / `token_dosyasi` ile yazıldı
- [ ] `design-plan.md` proje kökünde oluştu ve `<!-- ADS_PLAN run=… tasks=… -->` işareti taşıyor
- [ ] `design-plan.md` katman sırasına göre görev listesi içeriyor (TASK-001, TASK-002 ...)
- [ ] Her görevde `Çıktı hedefi` alanı dolu
- [ ] `ux-specs.md` aynı `run` kimliğiyle `UX_SPEC_STATUS: COMPLETE` taşıyor; `plan-gate.mjs --run …` 0 ile çıktı
- [ ] ads-design-builder belirtilen HTML dosyalarını üretti
- [ ] `run-all.mjs` çalıştı, `test-results.json` oluştu; reviewer raporunda "Otomatik testler" ve "Teslim engelleri" bölümleri var
- [ ] Teslim engeli varsa düzeltme döngüsü çalıştı (en fazla 2 tur), her turdan sonra yeniden kontrol yapıldı
- [ ] Özetin ilk satırı teslim durumu: açık engel varsa "Teslime hazır değil" ve engel listesi

**Ek varyantlar (bu sürümün kabul kanıtları):**
- Notion veya Jira kopyası seçildiğinde de `design-plan.md` oluşuyor; görev satırlarında dış kayıt bağlantısı var
- Önceki bir çalışmadan kalmış `ux-specs.md` varken yeni çalışma, kendi COMPLETE işareti yazılmadan builder'a geçmiyor
- Bilerek em-dash ve High bulgu bırakılmış bir projede: 1. denemede ikisi de düzeltilip yeniden kontrolde kapanıyor;
  düzeltilemeyecek bir kısıtla 2. denemede döngü 2 turda durup "teslime hazır değil" diyor
- `[Korunan]` olmayan bir bağlayıcı karar değiştirilmek istendiğinde builder duruyor; onayda kayıt
  `(güncellendi: …)` ile yenilenip yeni kararla, rette eski kararla devam ediliyor

---

## Senaryo 6 — Design Strategy (Figma Çıktısı)

**Ön koşul:** Figma desktop açık, Claude Code eklentisi kurulu ve MCP etkin.

**Adımlar:**
1. `/ads-design-strategy` çalıştır
2. "Figma'ya yaz" de
3. Tek bir component iste

**Başarı kriterleri:**
- [ ] ads-design-builder `use_figma` kullandı (Figma modunda çalıştı)
- [ ] Figma'da ilgili sayfa/frame oluştu
- [ ] Oluşturulan node ID'leri döndürüldü

---

## Senaryo 7 — Figma Kurulu Değilken Fallback

**Amaç:** use_figma olmadan HTML'e düştüğünü ve kurulum mesajı gösterdiğini doğrula.

**Ön koşul:** Figma eklentisi kurulu DEĞİL.

**Adımlar:**
1. `/ads-design-strategy` çalıştır
2. "Figma'ya yaz" de

**Başarı kriterleri:**
- [ ] Kurulum rehberi mesajı gösterildi ("Figma Claude Code eklentisinin kurulu olması gerekiyor...")
- [ ] Pipeline durmadı, HTML çıktısına geçti
- [ ] HTML dosyası üretildi

---

## Senaryo 8 — Dark Mode Çıktısı

**Amaç:** `color_scheme: both` iken token, HTML ve kontrast kontrolünün iki temayı kapsadığını doğrula.

**Adımlar:**
1. `/ads-spec-intake` — Renk şeması: "ikisi de"
2. `/ads-token-generator`
3. `/ads-design-strategy` → quick mod, HTML, tek bir ekran

**Başarı kriterleri:**
- [ ] Token JSON'da semantic renklerde `$value` + `$extensions.mode.dark` var
- [ ] Token-generator kontrast raporu iki mod için ayrı satırlar içeriyor
- [ ] HTML'de `:root`, `[data-theme="dark"]` ve `@media (prefers-color-scheme: dark)` blokları var
- [ ] `index.html` sidebar'ında tema anahtarı çalışıyor

---

## Senaryo 9 — Redesign Koruma

**Amaç:** Var olan bir projede korunan öğelerin kayda geçtiğini ve onaysız değişmediğini doğrula.

**Ön koşul:** `spec.md` olmayan, `screens/` altında nav ve form içeren bir HTML projesi.

**Adımlar:**
1. `/ads-import` → Senaryo 2 (dışarıdan HTML/CSS)
2. Çalışma modu sorusunda "Redesign – Koruyarak" seç, Korunacaklar listesini onayla
3. Akış bittikten sonra `/ads-iterate` → "Ana menüdeki [etiket] yazısını değiştir"

**Başarı kriterleri:**
- [ ] `context-scan.md` "Korunacaklar Envanteri" ve "Mevcut dial okuması" bölümlerini içeriyor
- [ ] Modernizasyon kapsamı soruldu
- [ ] `spec.md → Bağlayıcı Kararlar` altında `[Korunan]` satırları var
- [ ] `/ads-iterate` değişiklikten önce korunan öğe onayı istedi
- [ ] "Hayır" seçilince nav etiketi değişmedi

---

## Senaryo 10 — Check ve Inspect Tutarlılık Kuralları

**Amaç:** `/ads-check`'in sayfalar arası kilitleri ve korunan öğeleri, `/ads-inspect`'in element bazlı yeni kuralları raporladığını doğrula.

**Ön koşul:** `spec.md` (Bağlayıcı Kararlar'da en az bir `[Korunan]` nav etiketi) ve `screens/` altında iki sayfa:
- `home.html` — CTA `var(--color-accent)`, etiket "Bize ulaşın", nav korunan etiketle aynı
- `about.html` — CTA `#2563eb`, etiket "Konuşalım", korunan nav etiketi değiştirilmiş

**Adımlar:**
1. `/ads-check`
2. `/ads-inspect` → Butonlar

**Başarı kriterleri:**
- [ ] Check raporunda korunan nav etiketi **Kural** olarak var (etki Medium, teslimi engeller) ve "Teslim engelleri" listesinde
- [ ] Check raporunda accent (about.html) ve iletişim CTA etiketi için High var
- [ ] Check raporunda `major` / küçük harfli seviye yok
- [ ] Inspect raporunda iletişim niyeti için iki farklı etiket High olarak raporlandı
- [ ] Playwright varsa CTA satır kayması tells.mjs'ten alındı; yoksa "Kontrol edilmedi" bölümünde

---

## Senaryo 11 — Content Ekranı, Tez ve İmza Hareket Anı

**Amaç:** `content` ekran tipinin, strategist'in Tez / Kendi dünyası satırlarının, font rollerinin ve
tek imza hareket anı kuralının uçtan uca çalıştığını doğrula.

**Adımlar:**
1. `/ads-spec-intake` — S4: "Tek baskın renk", S5: "Belirgin"; renk şeması sorusuna "fark etmez" de
2. `/ads-token-generator`
3. `/ads-design-strategy` → quick mod, HTML, iki ekran: bir landing ve bir yardım makalesi

**Başarı kriterleri:**
- [ ] "Fark etmez" cevabından sonra sahne cümlesi soruldu ve `spec.md → scene_sentence` dolu
- [ ] Token JSON'da `font-family-display` ve `font-family-body` var; display fontu kaçınma listesinde değil (veya `_meta.font_rationale` gerekçeli)
- [ ] Brief'te `Tez:` ve `Kendi dünyası:` satırları var; landing `(marketing)`, makale `(content)` etiketli
- [ ] Makale dosyasında `<body data-page-kind="content">`, gövde ≤ ~75 karakter, 4+ ara başlıkta içindekiler var
- [ ] Hiçbir ekranda eyebrow yok; aynı giriş animasyonu ≤ 2 section
- [ ] `node tells.mjs` Blocker/High bulgusu vermiyor

---

## Senaryo 12 — Mobil Web (375px)

**Amaç:** Web projesinde mobil görünüm kurallarının (dokunma alanı, hover, güvenli alan, 100vh) builder'a ve `tells.mjs`'e yansıdığını doğrula.

**Adımlar:**
1. `/ads-spec-intake` — "Ne tasarlıyoruz?": Web; tablet: Hayır
2. `/ads-token-generator`
3. `/ads-design-strategy` → quick mod, HTML, ürün kartları ve alta sabit satın alma çubuğu olan bir landing

**Başarı kriterleri:**
- [ ] spec.md'de `platform: web`, `tablet: false`
- [ ] Ekranda `data-platform="web"`; CSS'te `100vh` yok (`svh`/`dvh`), sabit çubukta `env(safe-area-inset-bottom)` (viewport-fit=cover ise)
- [ ] Kart butonları hover olmadan da görünür; dokunulan öğeler ≥ 44×44px
- [ ] `node tells.mjs` çıktısında `@375` bulgularında High yok

---

## Senaryo 13 — iOS Uygulaması (Figma)

**Amaç:** Uygulama akışının platform sorularını sorduğunu ve Figma çıktısının iOS kurallarına uyduğunu doğrula.

**Adımlar:**
1. `/ads-spec-intake` — "Mobil uygulama" → "iOS"; tema sorusunda "yalnızca açık" seç; ikon seti verme
2. `/ads-token-generator`
3. `/ads-design-strategy` → Figma; bileşen kaynağı sorusunda "Platform biçiminde sıfırdan çiz"; quick mod, 3 ekran (ana sayfa, detay, ayarlar)

**Başarı kriterleri:**
- [ ] Tema sorusunda "ikisi" önerildi; "yalnızca açık" seçilince tek cümle uyarı geldi, karar kabul edildi
- [ ] İkon sorusu soruldu, `icon_source` spec'te
- [ ] Bileşen kaynağı sorusu soruldu, `component_source: drawn`
- [ ] Token JSON'da renklerde `$extensions.platform.ios` (ör. `label`, `systemBackground`); zemin token'ı saf beyaz olabilir
- [ ] Brief'te ekranlar `(product · ios)`; Kendi dünyası navigasyon/kontrol tarif etmiyor
- [ ] Frame'ler 390×844, durum çubuğu + home indicator katmanlı, description'da `platform: ios`
- [ ] Sekme çubuğu 2–5 öğe; ayarlar inset grouped list + `iOS/Switch` component'i; dokunma alanları ≥ 44

---

## Senaryo 14 — iOS + Android (HTML prototip)

**Amaç:** Ortak tasarım + platform farkları yaklaşımını ve uygulama kontrollerini doğrula.

**Adımlar:**
1. `/ads-spec-intake` — "Mobil uygulama" → "İkisi"; ikon: "Platformun kendi ikonları"
2. `/ads-token-generator`
3. `/ads-design-strategy` → HTML, quick mod, 2 ekran (liste + silme onayı)

**Başarı kriterleri:**
- [ ] Brief'te **Platform Farkları** tablosu var (tab bar / navigation bar, action sheet / Material dialog, FAB…)
- [ ] Ortak ekranlar bir kez, farklı parçalar iki versiyon (`data-platform="ios"` ve `"android"` dosyaları)
- [ ] Cihaz çerçevesi iOS 390×844 / Android 412×915, `--safe-top` / `--safe-bottom` tanımlı, yazılar `rem`
- [ ] iOS'ta FAB, Android'de action sheet yok
- [ ] `node tells.mjs` uygulama bulgularında High yok; %130 büyük yazıda kesilen metin yok

---

## Tasarım Testleri (Otomatik)

`scripts/test/` altında beş otomatik test ve bunları birlikte çalıştıran `run-all.mjs` bulunur.
ads-design-reviewer her çalışmada `run-all.mjs`'i tetikler. Kurulum README → Kurulum'da; elle çalıştırmak için:

```bash
cd scripts/test
npm install && npx playwright install chromium
npm run selftest   # çalıştırıcının kendi testi — "Tüm durumlar geçti." beklenir
npm run all        # tüm testler → tablo + <proje kökü>/test-results.json
```

Testler hangi kontrolün uygulanacağını **`project-state.md → cikti_formati`** alanından okur (orkestratör
pipeline başında yazar) ya da `--format html|figma` ile açıkça verilir. Dosya olmaması tek başına
"uygulanamaz" sayılmaz.

| Komut | Ne test eder |
|-------|-------------|
| `npm run visual` | Screenshot al, onaylı baseline ile piksel piksel karşılaştır, fark haritası üret (inceleme rolü; `--update --only` ile tek dosya kabulü) |
| `npm run a11y` | axe-core ile WCAG 2.1 AA + WCAG 2.2 AA ihlallerini raporlar (otomatik kapsam); WCAG 2.2 POUR'un manuel gerektiren kuralları ads-ux-reviewer tarafından ayrıca denetlenir |
| `npm run tokens` | Token'a bağlanması gereken özelliklerde (renk, font-size, font-family, radius, boşluk) sabit değer; CSS değişkenlerini alias'ları çözülmüş token değerleriyle açık/koyu tema ayrı karşılaştırır; koyu tema eksikliği |
| `npm run responsive` | Web ekranları 375 / 768 / 1280 px, uygulama ekranları cihaz ölçüsünde; yatay overflow. `index.html` varsa o da, ama ekranların yerine değil |
| `npm run tells` | 1280 px'te em/en-dash (kullanıcı metni hariç), CTA satır kayması, eyebrow, yasak görsel desenler (ışık halesi, ızgara/çizgili zemin, sahte imleç, nabız noktası), tekrarlı giriş animasyonu, JS hatası, görünmeyen içerik, metin örtüşmesi, kenara yapışık kart, başlık ritmi, görünmeyen görsel, tekrarlı metin; marketing ekranlarda nav; content ekranlarda satır genişliği ve gezinme |
| `npm run all` | `run-all.mjs`: hepsini çalıştırır, biri başarısız olsa / çökse / takılsa da devam eder; tablo + `test-results.json` |
| `npm run selftest` | `check-names` + `run-all.mjs`'in hata durumları (başarısız, çökme, zaman aşımı, karma sonuç, Figma, eksik `project-state.md`), görsel fark haritası, `plan-gate` senaryoları + tüm fixture beklentileri |
| `node plan-gate.mjs --run <kimlik>` | Builder öncesi geçiş kontrolü: bu çalışmanın planı (`ADS_PLAN`) ile UX spec'leri (`UX_SPEC_STATUS`) birebir tutuyor mu; önceki çalışmadan kalan işaret kabul edilmez |
| `npm run names` (`node check-names.mjs`) | Ad tutarlılığı: skill / agent `name:` = dosya adı, metinlerdeki her `ads-…` atfı var olan bir dosyaya çıkıyor, çift önek ve eski ad kalıntısı yok, `commands/` = `skills/` (selftest'in parçası) |
| `node check-run.mjs [--claimed "<teslim durumu>"]` | Çalışma sonrası denetim (model çağrısı yok): `project-state.md` alanları, çalışma kimliği / plan-gate, istisna biçimi, teslim üst sınırı — iddia edilen teslim durumu testlerin ve istisnaların izin verdiğini aşamaz |

**Visual:** karşılaştırma çözülmüş pikseller üzerinden yapılır (pixelmatch); `.diff.png` gerçek fark haritasıdır
(değişen pikseller kırmızı). İzin verilen fark `--max-diff` (yüzde, varsayılan 0.05).

**Visual baseline oluşturma (ilk çalıştırma):**
```bash
node visual.mjs --update  # Baseline oluşturur veya günceller; oluşturulan görüntüleri gözden geçirin
```

> **Not:** `node visual.mjs` (--update olmadan) baseline yoksa karşılaştırma yapamaz ve
> `[BASELINE YOK]` uyarısı verir. İlk baseline oluşturma her zaman `--update` ile ayrı bir
> açık adım olarak yapılmalıdır.

**Sonuçlar:** her test dört sonuçtan birini verir: `GEÇTİ`, `BAŞARISIZ` (teslimi engelleyen bulgu ya da çökme),
`ÇALIŞTIRILAMADI` (zorunlu ama girdi/bağımlılık eksik, zaman aşımı), `UYGULANAMAZ` (ör. Figma projesinde HTML testi).

**Çıkış kodları:**
- Tek test: `0` geçti / uygulanamaz, `1` başarısız, `2` çalıştırılamadı
- `run-all.mjs` (öncelik sırasıyla): `1` herhangi bir zorunlu test başarısız (aynı anda çalıştırılamayan olsa da),
  `2` başarısız yok ama zorunlu bir test çalıştırılamadı, `0` uygulanan zorunlu testler geçti
- `0` "teslime hazır" demek değildir; Figma projesinde HTML testleri uygulanamaz ve Figma doğrulaması ayrıca gerekir.
- `visual` **inceleme** rolündedir: her zaman çalışır, genel kodu değiştirmez. Baseline yoksa "karşılaştırma
  yapılamadı" notu, fark varsa `visual_review.pending_review` listesi çıkar. İncelenmemiş fark varken teslim
  kapısı "teslime hazır" demez; kasıtlı fark `visual.mjs --update --only <dosya>` ile kabul edilir.

Her test başka bir proje kökünde çalıştırılabilir: `node <test>.mjs --root <dizin> [--format html|figma]`.

**Fixture regresyonu:** her kural değişikliğinden sonra çalıştır:
```bash
npm run fixtures        # node check-fixtures.mjs — tüm fixture'lar
node check-fixtures.mjs tells-bad
```
Her fixture'ın `expected.json`'ı beklenen bulguları **kural + dosya + seçici + viewport + tema** bazında ve adetiyle
tutar; etki ve `teslimi engeller` alanları da karşılaştırılır. Toplam sayıya bakılmaz: bir bulgunun kaybolup yerine
başka bir yanlış alarmın gelmesi de yakalanır. Beklentiler çıktıdan kopyalanmaz — her bulgu fixture HTML'iyle
gözden geçirilir (bilerek konmamış ama gerçek bulgular `note` alanında açıklanır).

| Fixture | Ne kanıtlar |
|---|---|
| `tells-bad` | 31 tells bulgusu (web 1280 + `@375`, mobil web, iOS, Android) + 2 erişilebilirlik bulgusu |
| `tells-clean` | Bilinçli serbest bırakılan durumlar (kullanıcı metninde em-dash, izinli eyebrow, kayan şerit, organik clip-path, `data-live` nokta, açık modal arkasındaki inert içerik) bulgu üretmez |
| `tokens-bad` | Sabit renk (`user_explicit` dahil), boşluk, radius, font-size, font adı; bağlı CSS; `style=""`; token'dan sapan değişken; eksik koyu tema |
| `tokens-clean` | Alias'lı token'lar, iki koyu tema bloğu ve izinli istisnalar (`0`, `auto`, `100%`, `50%`, `currentColor`, `transparent`, `inherit`) bulgu üretmez |
| `responsive` | `index.html` varken ekranlar da test edilir; uygulama ekranı yalnızca cihaz ölçüsünde açılır |
| `tokens-app` | Sunum sahnesi istisnası yalnızca uygulama ekranındaki `.ads-stage` kuralında; `body` ve `.device` arka planı denetlenir; web'de istisna yok |
| `tablet-on` / `tablet-off` | `spec.md → tablet: true` olunca web ekranları 768'de de taranır (`@768` bulguları); `tablet: false` iken aynı sayfada 768 geçişi yapılmaz |

Tablet geçişi için `--tablet` ekle (veya proje `spec.md`'sinde `tablet: true`).

**Gereksinimler:** Node.js 18+, Playwright, `@axe-core/playwright`

---

## Bilinen Sınırlamalar

- **ads-design-reviewer HTML render:** Playwright kurulu değilse reviewer kaynak analizi yapar — görsel doğrulama yapamaz, bunu açıkça belirtir.
- **Figma token aktarımı:** Token JSON'dan Figma değişkenlerine aktarım `use_figma` ile yapılır; büyük token setlerinde birden fazla `use_figma` çağrısı gerekebilir.
- **Token JSON yokken design-strategy:** Pipeline devam eder ama ads-design-builder tahmini CSS değerleri kullanır ve bunları açık soru olarak işaretler.

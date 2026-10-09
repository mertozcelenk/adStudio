# adStudio

Claude Code skill ve agent kütüphanesi. Tasarımcıların sıfırdan veya mevcut
bir proje üzerinde tasarım sistemi kurmasını, token üretmesini ve bileşen
çıktısı almasını standartlaştırır. Çıktılar AI'dan çıkmış gibi görünmez —
anti-AI-tells sistemi ve tasarımcı onay döngüleri bunu engeller.

> adStudio, LDF'nin `bbd575d` sürümünden türetildi.

## Kurulum

```bash
# Yeni bir projeye adStudio ekle (skill/agent'lar + otomatik testler)
git clone --depth 1 https://github.com/mertozcelenk/adStudio.git /tmp/ads \
  && cp -r /tmp/ads/.claude . && cp -r .claude/skills/. .claude/commands/ \
  && mkdir -p scripts && cp -r /tmp/ads/scripts/test scripts/ \
  && rm -rf /tmp/ads

# Otomatik testlerin bağımlılıkları (Node 20.11+) ve kurulum doğrulaması
(cd scripts/test && npm install && npx playwright install chromium && npm run selftest)
```

Son komut `Tüm durumlar geçti.` ve `Tüm fixture beklentileri karşılandı.` satırlarını yazıp hatasız bitmelidir
(çalıştırıcının hata durumları + tarayıcıyla çalışan gerçek testler). Bitmiyorsa otomatik testler çalışmıyor demektir;
ads-design-reviewer bu durumda testleri `çalıştırılamadı` olarak raporlar ve çıktı "teslime hazır" sayılmaz.

> **Klasör yapısı hakkında:** `.claude/skills/` skill dokümantasyonunu barındırır.
> `.claude/commands/` ise Claude Code'un slash komutlarını (`/ads-*`) keşfettiği dizindir.
> Kurulum komutu skill'leri her ikisine de kopyalar — bu kasıtlıdır.

```bash
# Mevcut projedeki adStudio'yu güncelle
# Önce yerel değişikliklerinizi yedekleyin — güncelleme .claude/ içeriğini üstüne yazar
cp -r .claude ".claude.bak-$(date +%Y%m%d-%H%M)"   # her güncellemede ayrı yedek
git clone --depth 1 https://github.com/mertozcelenk/adStudio.git /tmp/ads \
  && cp -r /tmp/ads/.claude . && cp -r .claude/skills/. .claude/commands/ \
  && mkdir -p scripts && cp -r /tmp/ads/scripts/test scripts/ \
  && rm -rf /tmp/ads
(cd scripts/test && npm install && npx playwright install chromium && npm run selftest)
# Kendi özelleştirmeleriniz varsa en son .claude.bak-<tarih> klasöründen geri alın. Görsel baseline'lar (scripts/test/snapshots)
# ve .claude/ içine kendi eklediğiniz dosyalar korunur; adStudio'nun sildiği / yeniden adlandırdığı dosyalar ise geride kalır.
```

## Geliştirme

Yeni adım, skill veya agent eklemek için: [CONTRIBUTING.md](CONTRIBUTING.md). Repodaki talimatları kurulu projelere
dokunmadan denemek için geliştirme klasörü: `scripts/dev/sandbox.sh ~/Desktop/adstudio-gelistirme` (repoda değişiklikten sonra yeniden çalıştır). Komutlar ve agent'lar `ads-` önekli olduğundan
aynı bilgisayardaki başka kurulumlarla karışmaz.

## Hızlı Başlangıç

**Sıfırdan başlıyorsan:**
```
/ads-spec-intake          # Proje brief'ini topla
/ads-token-generator      # Design token seti üret
/ads-design-strategy      # Tasarım pipeline'ını başlat (quick veya deep mod)
```

**Hali hazırda bir projen varsa:**
```
/ads-import               # Projeyi otomatik tespit eder ve doğru akışı başlatır
```

**Figma çıktısı için:** Figma Desktop'ta Plugins → Claude Code eklentisini aç.
Kurulu değilse pipeline otomatik olarak HTML/CSS moduna geçer.

**Onaylanan bir sunumu gerçek projeye taşımak için:**
```
/ads-promote
```

**Format değiştirmek için (HTML/CSS ↔ Figma):**
```
/ads-migrate
```

**Mevcut projeyi geliştirmek için:**
```
/ads-iterate
```

## Pipeline

### Sıfırdan proje

```
/ads-spec-intake
  ├── S1-S5 estetik yön soruları (dil, yoğunluk, tipografi, renk, hareket)
  ├── Kullanıcı yolculuğu (happy path)
  └── reference-ingest (referans varsa)
        ↓
/ads-token-generator
  ├── Source assignment (user_explicit / reference_derived / ai_inferred)
  ├── AI tells filtresi (ai_inferred token'larda)
  └── Brand-guide modu (kurumsal kimlik kılavuzu varsa)
        ↓
/ads-design-strategy
  ├── project-state.md başlangıç kaydı (çıktı türü, platform, token dosyası, yapı)
  ├── quick mod → strategist → flow + template (kısa) → builder → hafif review + otomatik testler → teslim kapısı
  └── deep mod  → strategist → planner (flow + template, tam) → ads-ux-designer → plan-gate → builder
                → ads-design-reviewer ‖ ads-ux-reviewer → düzeltme döngüsü (en fazla 2 tur) → teslim kapısı
```

### Mevcut sisteme ekleme

```
/ads-context-scanner → /ads-impact-analysis → /ads-design-strategy
```

### Component library oluşturma

```
/ads-component-library
  ├── components/ varsa oradan alır
  ├── yoksa screens/'dan tekrar eden UI parçalarını çıkarır
  ├── HTML → components/ klasörüne referans dosyalar yazar
  └── Figma → figma-generate-library ile tam kütüphane kurar (variable binding, variant'lar)
```

### Onaylanan sunumu gerçek projeye taşıma

```
/ads-promote
  ├── HTML/CSS olarak devam → inline stiller temizlenir, token'lara bağlanır → hafif review → teslim kapısı
  └── Figma'ya aktar → token'lar değişkenlere, ekranlar frame'lere taşınır
```

### Format değiştirme

```
/ads-migrate
  ├── HTML/CSS → Figma
  └── Figma → HTML/CSS
```

### Mevcut projeyi geliştirme

```
/ads-iterate
  ├── Bağlayıcı kararla çelişen istek → "kararı güncelle / karar kalsın" sorusu
  ├── Küçük değişiklik → uygular → hafif review + otomatik testler → teslim kapısı
  └── Büyük özellik → planlar (design-plan.md Geliştirme Backlog'u) → ads-ux-designer → plan-gate → uygular
                    → tam review → düzeltme döngüsü → teslim kapısı
```

## Deep Mod Pipeline — Adım Adım

| Adım | Agent | Ne yapar |
|------|-------|----------|
| 1 | ads-design-strategist | Estetik çakışma tespiti, alternatif yönler, Design Read, kritik heuristic'ler |
| 2 | ads-design-planner | Component listesi, `flows.md` (akışlar, önkoşul / sonra) + `templates.md` (ekran tipleri), UX validation, tasarımcı onayı, görev çıktısı |
| 3 | ads-ux-designer | Her component için UX pattern seçimi ve spec üretimi (`ux-specs.md`'de bu çalışmanın bölümü) |
| — | plan-gate | Builder öncesi geçiş kontrolü: bu çalışmanın planı ile UX spec'leri birebir tutuyor mu (`scripts/test/plan-gate.mjs`) |
| 4 | ads-design-builder | Figma veya HTML/CSS üretir |
| 5 | ads-design-reviewer ‖ ads-ux-reviewer | Paralel: spec/token/a11y/AI tells mekanik kontrolü · Nielsen heuristic'leri, component binding, WCAG 2.2 POUR |
| 6 | ads-design-builder → reviewer'lar | Düzeltme döngüsü: teslim engelleri düzeltilir, yeniden kontrol edilir (en fazla 2 tur) |
| 7 | orkestratör | Teslim kapısı: "Teslime hazır" / "İstisna onayıyla teslim edilebilir" / "Teslime hazır değil" |

> **Deep mod süre beklentisi:** 20–30 task içeren bir projede toplam süre 15–40 dakika arasında
> değişebilir — bu normaldir.

## Öne Çıkan Özellikler

**Flow ve template**
Token'lar ürünün nasıl göründüğünü, iki proje dosyası nasıl kurulduğunu ve nasıl davrandığını tanımlar:
`templates.md` ekran tiplerini (liste, detay, form…: bölgeler, zorunlu durumlar, davranış), `flows.md` proje geneli
**Ortak Davranış**'ı ve kullanıcı akışlarını (adımlar, dallar, `Önkoşul` / `Sonra`) tutar. Builder her ekranı bir
template'ten ve bir akıştan üretir; boş durumlar kullanıcıyı sıradaki akışa götürür. Dosyalar kalıcıdır, yeni kapsam
eklenir; `/ads-iterate` bir template ya da akış değişince etkilenen ekranları buradan bulur. `structure` testi
ekranların bu dosyalarla tutarlılığını model çağırmadan denetler. Sözleşme: `references/structure-standards.md`.

**Teslim kapısı**
Her akış (quick, deep, iterate, promote) bir teslim durumuyla biter: **Teslime hazır**, **İstisna onayıyla
teslim edilebilir** veya **Teslime hazır değil**. "Teslime hazır" için dört koşul gerekir: açık teslim engeli yok,
zorunlu otomatik testler geçti, inceleme tamamlandı (deep: iki reviewer; quick / tek dosya: hafif review),
görsel farklar incelendi. Teslim engeli varsa düzeltme döngüsü en fazla iki tur sürer; tur sınırına ulaşmak
kabul anlamına gelmez. Teslim onaylanınca görsel baseline alınır. Ayrıntı: `ads-design-strategy.md → Adım 6`.

**Bulgu modeli: etki + teslimi engeller**
Her bulgu iki alan taşır: **etki** (Blocker / High / Medium / Nitpick — yalnızca kullanıcıya etkisi) ve
**teslimi engeller**. Blocker ve High teslimi engeller. Şirket ve proje kuralları (**Kural**: em-dash, adesso
metadata, sahte ürün UI, `[Korunan]` öğe, Bağlayıcı Karar) etkisi düşük olsa da teslimi her zaman engeller ve
raporda kendi etkisiyle görünür. Medium ve Nitpick gerekçeyle aşılabilen önerilerdir.

**Kapsam kararı**
Bir engeli kapatmak yeni bir özellik, ekran, veri toplama, ürün vaadi veya akış gerektiriyorsa builder bunu
kendi başına eklemez; tasarımcıya sorulur: **kapsama ekle** (önce plan ve UX, sonra uygulama),
**vaadi koruyan geçici çözüm** veya **istisna** (`project-state.md → ## Teslim İstisnaları`'na gerekçesiyle yazılır).

**Otomatik testler**
`scripts/test/` kurulumla gelir. `run-all.mjs` erişilebilirlik, token kullanımı, responsive, AI tells, yapı (flow / template) ve görsel
karşılaştırmayı çalıştırır; biri çökse de diğerleri sürer, sonuç `test-results.json`'a yazılır. Her test dört
sonuçtan birini verir: geçti / başarısız / çalıştırılamadı / uygulanamaz (ör. Figma projesinde HTML testi).
`check-run.mjs` bir çalışmanın bıraktığı dosyaları denetler: iddia edilen teslim durumu testlerin ve istisnaların
izin verdiğini aşamaz. Ayrıntı ve fixture'lar: `TESTING.md`; uçtan uca kayıt: `test-runs/`.

**Anti-AI-tells sistemi**
LLM'in varsayılan desenlerini (Inter font, beige+brass paleti, 3-eşit-kart layout,
em-dash, placeholder isimler) üç katmanda engeller: token üretiminde, builder'da
ve reviewer'larda.

**user_explicit override**
Kullanıcı yasaklı bir değeri (font adı, renk kodu) açıkça belirtirse
`source: "user_explicit"` olarak işaretlenir ve tüm filtrelerden muaf tutulur.

**Estetik yön soruları (S1-S5)**
spec-intake tasarımcıya 5 soru sorar: genel dil, görsel yoğunluk, tipografi karakteri,
renk yaklaşımı, hareket seviyesi. Her seçenek açıklama ve örnek ürünle sunulur.
Seçim veya serbest metin kabul edilir. Seçimler token üretimini yönlendirir.

**Dial'lar (VARIANCE / MOTION / DENSITY)**
Strategist S1, S2 ve S5 yanıtlarını 1-10 arası üç değere çevirir: layout cesareti,
hareket miktarı, bilgi yoğunluğu. Değerler Design Read'de gösterilir, tasarımcı düzeltebilir
ve `spec.md → token_directives.dials`'a yazılır. Builder layout ve animasyon kararlarını,
reviewer'lar uyumu bu değerlere göre verir. Kamu/regüle/güven odaklı brief'lerde
VARIANCE ≤ 4 ve MOTION ≤ 3 sınırı uygulanır.

**Ekran tipi (marketing / product / content)**
Strategist her ekranı etiketler. Landing'e özgü kurallar (hero, nav, layout çeşitliliği)
yalnızca marketing ekranlarında, okuma kuralları (satır genişliği, başlık ritmi, uzun sayfada
gezinme) yalnızca content ekranlarında (blog yazısı, doküman, yardım merkezi), tutarlılık kilitleri
(tek accent, tek radius sistemi, niyet başına tek CTA etiketi) her ekranda uygulanır.

**Tez ve Kendi dünyası**
Strategist'in Design Read'i iki satırla biter: `Tez:` (ekranın tek fikri ve reddettiği kategori
kalıbı) ve `Kendi dünyası:` (içerik silinse de tanınacak renk, tipografi ve görsel dili). Strategist
"bu tarif yalnızca kategoriden tahmin edilebilir mi?" testini kendi içinde yapar; builder
reddedilen kalıba kayamaz. Hareket MOTION ≥ 4'te tezle bağlı tek bir imza anda toplanır.

**Mobil web ve mobil uygulama**
spec-intake "Ne tasarlıyoruz? Web / Mobil uygulama / İkisi" diye sorar; uygulamada iOS / Android ve
isteğe bağlı tablet sorulur. Web ekranları 1280 ve 375px'te denetlenir (dokunma alanı, hover'a bağlı işlev,
güvenli alan, 100vh). Uygulama ekranlarında yapı platformun (iOS HIG / Material 3): navigasyon, kontroller,
geri ve modal davranışı native kalır, marka renk, display fontu, hareket ve içerikte ifade edilir.
Bileşen kaynağı (resmi kit / platform biçiminde çizim / kendi sistem) ve ikon seti tasarımcıya sorulur.
iOS + Android birlikte seçilirse ekranlar bir kez tasarlanır, farklı parçalar iki versiyon üretilir.
HTML prototipler cihaz çerçevesinde (390×844 / 412×915) üretilir; `tells.mjs` dokunma alanı (44pt / 48dp),
güvenli alan, sekme sayısı, giriş animasyonu ve %130 büyük yazıyı ölçer. Kurallar: `references/mobile-platforms.md`.

**Font rolleri**
Token'lar `font-family-display` ve `font-family-body` olarak iki rol üretir. Gövde/UI fontunda
Inter ve sistem fontları serbesttir; display fontunda yapay zekânın refleksle seçtiği fontlar
(Outfit, Playfair Display, Space Grotesk vb.) gerekçesiz kullanılmaz.

**Dark mode çıktısı**
`color_scheme: both` iken token'lar `$value` (açık) + `$extensions.mode.dark` (koyu) taşır;
builder HTML'de `[data-theme]` + `prefers-color-scheme` blokları, Figma'da Light/Dark variable
modları üretir. Kontrast her iki temada ayrı kontrol edilir.

**Redesign koruma**
Var olan bir sistemle çalışırken context-scanner "Korunacaklar Envanteri" çıkarır
(sayfa yolları, nav etiketleri, form alanları, logo, yasal metinler, analytics bağları).
Tasarımcının onayladığı maddeler `spec.md → Bağlayıcı Kararlar`'a `[Korunan]` olarak yazılır;
onaysız değişiklik **Kural** ihlalidir (teslimi engeller), `/ads-iterate` dokunmadan önce onay ister. "Koruyarak" redesign'da
modernizasyon en az riskliden ilerler: tipografi → boşluk → renk → hareket → hero → blok değişimi.

**Builder pre-flight**
ads-design-builder teslimden önce `references/preflight-checklist.md` ile kendi çıktısını kontrol eder,
`✗` maddeleri düzeltir ve raporu özetine ekler. Quick modda pre-flight'ın ardından hafif review ve teslim kapısı gelir.

**Tasarımcı onay döngüleri**
Strategist estetik çakışmaları tespit edip sorar. Planner user flow boşluklarını
bulup onaylatır. Tasarımcı yanıt vermeden pipeline ilerlemez.

**UX katmanı**
Her task tanımı interaction spec, copy (hata/boş state metinleri) ve
a11y annotation (ARIA, tab sırası, touch target) içerir.

**Görev yönetimi entegrasyonu**
Planner görev listesini her zaman `design-plan.md`'ye yazar (ana kayıt); istenirse Notion board veya Jira'ya kopyalar.

**Bağlayıcı Kararlar**
Konuşma sırasında verilen kalıcı tasarım kararları (`spec.md → Bağlayıcı Kararlar`) otomatik olarak kaydedilir.
Sonraki konuşmalarda tüm agent'lar bu kararları sert kısıtlama olarak uygular — ihlaller **Kural** olarak raporlanır.
Kararla çelişen bir istek geldiğinde builder kararı aşmaz; tasarımcıya "kararı güncelle / karar kalsın" sorulur ve
güncelleme `(güncellendi: tarih, önceki: …)` ekiyle kayda geçer.

**Designed by: adesso Turkey**
Her üretilen HTML dosyasının `<head>` bölümüne `<!-- Designed by: adesso Turkey -->` ve `<meta name="author" content="adesso Turkey">` eklenir.
Figma çıktısında her frame/component'ın `description` alanına `"Designed by: adesso Turkey"` yazılır.
Yapay zeka kökenini ima eden her türlü meta tag, yorum veya özellik tüm çıktılarda kesinlikle yasaktır.
Reviewer ve ads-check bu kuralı **Kural** olarak denetler (teslimi engeller).

**Token Standartları — Merkezi Referans**
Token'a dokunan tüm skill'ler (token-generator, promote, iterate, migrate, check) başlamadan önce
`.claude/references/token-standards.md` dosyasını okur. Geçerli source değerleri yalnızca üçtür:
`user_explicit`, `reference_derived`, `ai_inferred`. Bunlar dışında hiçbir source değeri yazılamaz.

**4 Katı Ölçek Sistemi**
Spec'te aksi belirtilmedikçe spacing, border-radius ve icon boyutları
otomatik olarak 4'ün katı değerlerde (4, 8, 12, 16, 20, 24…) üretilir.
`user_explicit` token'lar ve spec'te açıkça belirtilen grid sistemleri bu kuraldan muaftır.
Reviewer aynı kuralı denetler — ihlaller Medium bulgu olarak raporlanır.
Yazı boyutları ve satır yüksekliğinde 4 katı yalnızca öneridir: tipografik oran gerektiriyorsa
(ör. 15px gövde) ara değer gerekçesiyle kullanılabilir. Okunabilirlik alt sınırları zorunludur.

## Dosya Yapısı

```
.claude/
├── skills/
│   ├── ads-spec-intake.md
│   ├── ads-token-generator.md
│   ├── ads-design-strategy.md
│   ├── ads-promote.md
│   ├── ads-migrate.md
│   ├── ads-iterate.md
│   ├── ads-context-scanner.md
│   ├── ads-impact-analysis.md
│   ├── ads-reference-ingest.md
│   ├── ads-token-layer-builder.md
│   ├── ads-check.md
│   ├── ads-inspect.md
│   └── figma-*.md             # 12 Figma skill
├── agents/
│   ├── ads-design-strategist.md
│   ├── ads-design-planner.md
│   ├── ads-design-builder.md      # HTML: <!-- Designed by: adesso Turkey --> + meta author zorunlu
│   ├── ads-design-reviewer.md
│   ├── ads-ux-reviewer.md
│   ├── ads-ux-designer.md
│   ├── ads-token-generator-worker.md
│   ├── ads-context-scanner-worker.md
│   └── ads-pipeline-tester.md
└── references/
    ├── reviewer-checklist.md   # AI tells kataloğu + HTML/Figma kontrol listeleri + seviye ölçeği
    ├── preflight-checklist.md  # Builder'ın teslim öncesi öz-kontrolü
    ├── token-standards.md      # Geçerli source değerleri, $value kuralı, zorunlu koleksiyonlar, tema modları
    └── structure-standards.md  # flows.md + templates.md biçimi, temel ekran tipleri, HTML yapı işaretleri

scripts/test/                   # run-all (sonuç toplayıcı) + accessibility, tokens, responsive, tells, structure, visual

# Proje kökünde üretilen dosyalar
spec.md                         # spec-intake çıktısı
[proje-adı]-tokens.json         # token-generator çıktısı (Türkçe harf dönüşümü, küçük harf, boşluk→tire: "Örnek Bank" → ornek-bank-tokens.json)
project-state.md                # çıktı türü (orkestratör başta yazar) + proje durumu ve dosya listesi (ads-design-builder)
test-results.json               # run-all.mjs çıktısı — test başına sonuç ve bulgular
design-plan.md                  # ads-design-planner çıktısı — İlk Tasarım + Geliştirme Backlog'u
ux-specs.md                     # ads-ux-designer çıktısı — her çalışma kendi bölümünde (run kimliği), önceki bölümler korunur
flows.md                        # Ortak Davranış + kullanıcı akışları (önkoşul / sonra) — kalıcı, yeni kapsam eklenir
templates.md                    # Ekran tipleri: bölgeler, zorunlu durumlar, davranış — kalıcı, yeni kapsam eklenir
components/[katman]/[ad].html   # ads-design-builder HTML çıktısı
screens/[ad].html               # ads-design-builder ekran çıktısı
index.html                      # ads-design-builder navigasyon sayfası
```

## Skill'ler

| Skill | Komut | Açıklama |
|-------|-------|----------|
| `ads-spec-intake` | `/ads-spec-intake` | Yeni projeye başlarken yapılandırılmış design spec toplar |
| `ads-token-generator` | `/ads-token-generator` | spec.md'den W3C DTCG token seti üretir |
| `ads-design-strategy` | `/ads-design-strategy` | Tasarım pipeline'ını orkestre eder |
| `ads-promote` | `/ads-promote` | Onaylanan sunumu gerçek projeye taşır (HTML/CSS veya Figma) |
| `ads-migrate` | `/ads-migrate` | Çıktı formatını değiştirir (HTML/CSS ↔ Figma) |
| `ads-iterate` | `/ads-iterate` | Mevcut projeyi düzenler veya yeni özellik ekler |
| `ads-context-scanner` | `/ads-context-scanner` | Var olan bir sistemi (web/Figma) tarar |
| `ads-impact-analysis` | `/ads-impact-analysis` | Var olan sisteme ekleme senaryosunda etki analizi yapar |
| `ads-reference-ingest` | ads-spec-intake tarafından çağrılır | Referans girdileri 9 alanlı formatta çıktı üretir |
| `ads-import` | `/ads-import` | Mevcut projeyi pipeline'a dahil eder (adStudio / HTML/CSS / Figma) |
| `ads-check` | `/ads-check` | Çapraz sayfa tutarlılık kontrolü — nav, header, footer, token bağlantıları, accent/radius kilidi, CTA etiketleri, korunan öğeler, dark mode |
| `ads-inspect` | `/ads-inspect` | Element bazlı mekanik kontrol — buton, tipografi, form, nav, kart; varsa `tells.mjs` ölçümlerini kullanır |
| `ads-token-layer-builder` | `/ads-token-layer-builder` | Token katmanlarını adım adım inşa eder |
| `ads-component-library` | `/ads-component-library` | Component library oluşturur — HTML (referans) veya Figma (tam kütüphane) |

## Agent'lar

| Agent | Çağıran | Açıklama |
|-------|---------|----------|
| `ads-design-strategist` | design-strategy | Estetik çakışma, alternatif yönler, Design Read, tek cesur element ilkesi, heuristic uyarıları |
| `ads-design-planner` | design-strategy (deep) + iterate | `flows.md` / `templates.md`, flow genişletme, UX validation, görev listesi (`design-plan.md`; Notion/Jira kopyası isteğe bağlı) |
| `ads-ux-designer` | design-strategy (deep) + iterate | UX pattern seçimi, etkileşim spec, animasyon zamanlama, ikon disiplini, anti-generic kontrol |
| `ads-design-builder` | design-strategy | Figma veya HTML/CSS çıktısı üretir |
| `ads-design-reviewer` | design-strategy (deep) | Spec/token/a11y/AI tells kontrolü — teslim engelleri + etki (Blocker/High/Medium/Nitpick)/Ne iyi raporu |
| `ads-ux-reviewer` | design-strategy (deep) | Heuristic, binding, WCAG 2.2 POUR manuel kontrol |
| `ads-token-generator-worker` | token-generator | Figma'dan ham token verisi çeker |
| `ads-context-scanner-worker` | context-scanner | Web ve Figma kaynaklarını tarar |

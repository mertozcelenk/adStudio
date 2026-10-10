---
name: ads-design-strategy
description: spec.md'den Figma veya HTML/CSS çıktısına uzanan design pipeline'ını orkestre eder. "Tasarıma başlayalım", "bu spec'ten component üretelim", "Figma'ya atalım", "HTML prototype üretelim" gibi taleplerde tetiklenir. Yeni proje için kullanılır — mevcut projeye özellik eklemek için ads-iterate kullanın. spec-intake tamamlanmış ve spec.md mevcut olmalıdır.
---

# Design Strategy Pipeline

## Dosya Yolları Sözleşmesi

Tüm dosyalar proje kökünde aranır ve üretilir:

| Dosya | Açıklama |
|-------|----------|
| `spec.md` | spec-intake çıktısı — proje adı buradan okunur |
| `[proje-adı]-tokens.json` | token-generator çıktısı (`spec.md`'deki proje adından türetilir, boşluklar tire olur) |
| `project-state.md` | çıktı türü (bu skill başta yazar) + üretim durumu (ads-design-builder) |
| `design-brief.md` | Onaylı stratejist brief'i (Adım 1 sonunda) — kalıcı; önceki sürüm `design-brief.[tarih].md` olarak saklanır |
| `design-plan.md` | ads-design-planner çıktısı — görev listesinin ana kaydı (Notion/Jira yalnızca kopya) |
| `ux-specs.md` | ads-ux-designer çıktısı — her çalışma kendi bölümünde, önceki bölümler korunur |
| `flows.md` | Ortak Davranış + kullanıcı akışları (Adım 2b) — kalıcı, yeni kapsam eklenir |
| `templates.md` | Ekran tipleri: bölgeler, zorunlu durumlar, davranış (Adım 2b) — kalıcı, yeni kapsam eklenir |
| `components/[katman]/[ad].html` | ads-design-builder HTML çıktısı |
| `screens/[ad].html` | ads-design-builder HTML ekran çıktısı |

## Ön Koşul Kontrolü

`spec.md` dosyasını proje kökünde oku. Yoksa dur ve kullanıcıya söyle:
"Önce `/ads-spec-intake` çalıştırarak proje spec'ini oluşturmanız gerekiyor."

`spec.md` mevcutsa kullanıcıya sor:

> "Bu çıktı nasıl kullanılacak?
> `[ ] Sunum veya fikir paylaşımı — hız öncelikli`
> `[ ] Gerçek tasarım süreci — kalite ve tutarlılık öncelikli`"

**Sunum / fikir paylaşımı** seçildiyse: token dosyası olmadan devam et, quick mod öner.

**Gerçek tasarım süreci** seçildiyse: proje adını `spec.md`'den oku, aşağıdaki
kuralla normalize et ve token dosyasını ara:
- Türkçe harfleri dönüştür (ç→c, ğ→g, ı/İ→i, ö→o, ş→s, ü→u) → tüm harfleri küçük yap → boşlukları tire ile
  değiştir → tire ve alfanumerik dışı karakterleri kaldır (`Örnek Bank` → `ornek-bank-tokens.json`)
- Örnek: `Noma Wellness` → `noma-wellness-tokens.json`

Normalize edilmiş adla bulunamazsa `*-tokens.json` glob araması yap (proje kökünde).
Tek dosya bulunursa onu kullan ve kullanıcıya bildir:
> "`[bulunan-dosya]` token dosyası olarak kullanılıyor."

Hiç bulunamazsa dur:
> "Token seti bulunamadı. Önce `/ads-token-generator` çalıştırın, ardından bu komutu tekrar çalıştırın."

**Platform kontrolü:** `spec.md`'de `platform` alanını oku. Değer `mobile` ise (eski spec) veya alan yoksa
ama spec metni mobil bir ürünü tarif ediyorsa bir kez sor ve `token_directives` bloğuna yaz:
> "Bu proje telefonda düzgün görünen bir **web** mi, yoksa App Store / Google Play'e çıkacak bir **uygulama** mı?
> `[ ] Web` `[ ] Mobil uygulama` `[ ] İkisi de`"

Uygulama seçilirse `app_platforms` (iOS / Android / ikisi) ve `tablet` sorularını da `ads-spec-intake`'teki metinle sor.
Uygulama kuralları: `.claude/references/mobile-platforms.md`.

Her iki durumda da çıktı formatını sor:

> "Tasarım çıktısı nerede oluşturulsun?
> `[ ] Figma` — Figma Desktop açık olmalı
> `[ ] HTML/CSS` — proje klasörüne dosya olarak üretilir"

**Figma seçildiyse** ek bilgi sor:
> "Figma dosyasının linkini paylaşır mısınız?"

**Uygulama + Figma seçildiyse** (`platform: app | both`) bileşen kaynağını sor:
> "Uygulama ekranlarındaki hazır iOS/Android bileşenlerini (switch, alt panel, sekme çubuğu, uyarı penceresi…) nereden alalım?"
> - `[ ] Resmi kiti kullan` — Apple iOS UI Kit veya Google Material 3 Design Kit'i Figma dosyana kütüphane olarak eklersin; bileşenler oradan gelir ve marka renklerinle boyanır. Geliştirici her bileşeni platformdaki adıyla tanır. *(Kurulum: Figma Community'de kiti aç → "Add to library". Birkaç dakika sürer.)*
> - `[ ] Platform biçiminde sıfırdan çiz` — Kurulum gerekmez; adStudio bileşenleri iOS/Android ölçülerine ve davranışına uygun kendisi çizer. Bileşen adları platformunkilerle birebir eşleşmeyebilir.
> - `[ ] Kendi tasarım sistemimi kullan` — Dosyandaki mevcut kütüphanenin bileşenleri kullanılır; platform kuralları (dokunma alanı, geri hareketi, modal davranışı) yine kontrol edilir.

Cevabı `component_source` (`kit` | `drawn` | `own`) olarak `token_directives` bloğuna yaz.
HTML çıktısında bu soru sorulmaz — builder uygulama ekranlarını platform biçiminde çizer (`drawn`).

Bu seçimi ve Figma linkini not al — tüm pipeline boyunca builder'a iletilir.

### project-state.md başlangıç kaydı

Adım 1'e geçmeden önce `project-state.md`'nin başlık alanlarını yaz (dosya yoksa oluştur, varsa yalnızca
bu alanları güncelle). Alanların anlamı: `ads-design-builder.md` → "project-state.md".

```markdown
cikti_formati: [html | figma]
platform: [spec.md → platform]
token_dosyasi: [bulunan token dosyası | yok]   ← sunum modunda token'sız devam ediliyorsa "yok"
yapi: flows.md, templates.md
```

Otomatik testler hangi kontrolün uygulanacağını bu alanlardan okur; üretim yarıda kalsa da kayıt durmalıdır.
`yapi` alanı `structure` testini açar; dosyalar Adım 2b'de, builder'dan önce yazılır.

### Bağlayıcı kararlarla çelişki

`spec.md → ## Bağlayıcı Kararlar` bölümü doluysa (yeniden çalıştırılan bir proje) ve kullanıcının bu
konuşmadaki isteği bir kararla çelişiyorsa, devam etmeden önce `ads-iterate.md → Bağlayıcı karar değişikliği`
adımını uygula. Builder pipeline sırasında "karar güncelleme gerekli" diye dönerse de aynı adım çalışır;
karar netleşince builder kaldığı görevden devam eder.

## Adım 1 — ads-design-strategist'i çalıştır

`ads-design-strategist` agent'ını çalıştır. Şunları ilet:
- `spec.md` içeriği (tamamı)
- Kullanıcının bu konuşmadaki isteği (hangi ekran, hangi component, genel mi)
- `design-brief.md` içeriği (varsa) — projenin önceki onaylı yönü

Agent şunları döndürür:
- **Design Read** — tek satır estetik beyan + VARIANCE / MOTION / DENSITY değerleri
- **Dial'lar** — her değer için gerekçe
- **Estetik çakışmalar** — S1-S5 seçimleri arasında tutarsızlık varsa tasarımcıya soru
- **Alternatif yönler** — istenirse 2-3 farklı tasarım dili tarifi
- **Üst düzey kapsam** — hangi sayfalar / component grupları, her ekranın tipi (`marketing` / `product` / `content`)
- **Style direction** — çakışma çözüldükten ve alternatif seçildikten sonra
- **Önerilen mod** — `quick` veya `deep`
- **Açık sorular** — gerçekten belirsizse

Çakışma sorusu veya alternatif seçimi bekleniyorsa kullanıcının yanıtını al, ardından devam et.

### Dial'ları kaydet

Brief'i kullanıcıya gösterirken dial satırını açıkça vurgula:

> "Layout cesareti (VARIANCE) [n], hareket (MOTION) [n], yoğunluk (DENSITY) [n] olarak okudum.
> Değiştirmek istediğiniz bir değer var mı?"

Kullanıcı bir değeri değiştirirse strategist'in değerini güncelle, `source: user_explicit` yap.
Ardından `spec.md`'nin `token_directives` bloğundaki `dials` alanlarını güncelle
(sentinel'lar arasındaki YAML'ı düzenle, blokta başka bir şeye dokunma). `dials` alanı yoksa ekle.

Bu andan itibaren builder, ads-ux-designer ve her iki reviewer'a şunlar **her zaman** iletilir:
- Dial değerleri (VARIANCE / MOTION / DENSITY)
- Ekran tipi listesi (`marketing` / `product` / `content`)
- `color_scheme` (spec.md `token_directives`'ten — yoksa Ortak Bağlam'daki "Renk şeması" cevabından)
- Platform alanları: `platform`, `app_platforms`, `tablet`, `icon_source`, `component_source`
  (uygulama ekranlarında `references/mobile-platforms.md` kuralları geçerlidir)

### Brief'i kaydet

Çakışmalar çözülüp alternatif seçildikten ve dial'lar onaylandıktan sonra brief'i proje köküne `design-brief.md`
olarak yaz. Brief yalnızca konuşmada kalırsa sonraki `/ads-iterate` çalışmaları Tez'i, persona'yı ve seçilen yönü
göremez.

1. `design-brief.md` zaten varsa önce `design-brief.[YYYY-MM-DD].md` adıyla yeniden adlandır (eski dosyanın
   `onaylandi` tarihi; aynı adla dosya varsa sonuna `-HHMM` ekle). Arşiv dosyalarını hiçbir adım okumaz.
2. Yeni dosyayı yaz: stratejist çıktısının `## Design Read` ve sonrası, dial'lar onaylanan değerlerle
   (`spec.md → token_directives → dials` ile aynı). `## Estetik Çakışmalar` ve `## Alternatif Yönler` yazılmaz —
   sonuçları `## Seçilen Estetik Yön`'de özetlenir. Çözülmemiş açık soru yoksa `## Açık Sorular` da yazılmaz.

```markdown
# Design Brief — [proje adı]
onaylandi: [YYYY-MM-DD]
<!-- Bu dosyayı /ads-design-strategy yazar. Yönü değiştirmek için strateji adımını yeniden çalıştırın. -->

## Design Read
...
```

Bundan sonra bu skill'de ve `/ads-iterate`'te "stratejist brief'i" denen her yerde bu dosya iletilir.

## Adım 2 — Modu belirle

Öncelik sırası:
1. Kullanıcının bu konuşmada söylediği ("hızlı yap", "detaylı incele", "review atla")
2. Stratejistin önerisi

### Quick mod

`ads-design-planner` çalıştırılmaz. Önce **Adım 2b**'yi (kısa sürüm) uygula, ardından `ads-design-builder`
agent'ını doğrudan çalıştır:
- Stratejist brief'i
- `spec.md` içeriği
- `[proje-adı]-tokens.json` yolu (varsa — yoksa token üretilmemiş uyarısı ver, pipeline'ı durdurma)
- `flows.md` ve `templates.md` yolları
- Dial'lar, ekran tipleri, `color_scheme`, platform alanları

Quick modda reviewer agent'ları çalışmaz. Builder bitince **hafif review** ile teslim kapısı uygulanır —
`/ads-iterate`'in tek dosyalık değişiklikte kullandığı yolla aynı:

1. HTML'de `node scripts/test/run-all.mjs`; Figma'da frame'leri `get_screenshot` ile aç.
2. Builder'ın **Pre-flight** raporu + `ads-iterate.md → Review — Etki Bazlı → hafif review` maddeleri
   (token bağlama, AI tells / em-dash, tutarlılık kilitleri, `[Korunan]`, tipografi ve kontrast, yapı) — orkestratör yapar.
3. Bulguları `etki` / `teslimi engeller` ile sınıflandır; teslim engeli varsa Adım 6 döngüsü (yeniden kontrol =
   aynı hafif review + `run-all`).
4. Teslim durumunu Adım 6'ya göre yaz; quick modda koşul 3 ("inceleme tamamlandı") hafif review ile karşılanır.

Özette Pre-flight raporunu ve düzeltilemeyen (✗ kalan) maddeleri de göster.

### Deep mod

Adım 3'e geç. Adım 2b'yi (tam sürüm) planner yapar (Adım 3b).

## Adım 2b — Flow ve template

Ürünün nasıl kurulduğu ve nasıl davrandığı builder'dan önce, proje düzeyinde yazılır. Biçim ve kurallar:
`.claude/references/structure-standards.md` — oku ve birebir uygula.

1. **Var olanı oku.** `flows.md` / `templates.md` varsa üzerine yazma; yalnızca bu çalışmanın kapsamındaki yeni
   akışları, template'leri ve ekranları **ekle**. Var olan bir akışı değiştirmek gerekiyorsa bunu kullanıcıya ayrıca
   göster (o akışı `Önkoşul` gösteren akışlar da etkilenir).
2. **Yaz.**
   - Quick (kısa sürüm): orkestratör yazar. Kaynak: `spec.md → Bilgi Mimarisi ve Temel Akışlar` + kullanıcı
     yolculuğu, stratejist brief'inin kapsamı ve ekran tipleri, `spec.md → Başarı Kriterleri`.
   - Deep (tam sürüm): `ads-design-planner` yazar (Adım 3b) — genişletme sorularıyla bulunan dallar dahil.
   - Her ikisinde: `## Ortak Davranış`, her akış için `Önkoşul`, `Giriş`, `Adımlar` (ekran + `T-…`), `Dallar`,
     `Sonra`; her ekran bir template'e bağlanır; template'ler `structure-standards.md`'deki temel tiplerden uyarlanır
     (kullanılmayan tip eklenmez).
3. **Tek onay.** Kullanıcıya üçünü birlikte göster ve onay al:
   > "Akışlar: [F-01 Grup oluştur (önkoşul yok) → F-02 Harcama ekle (önkoşul F-01) …]
   > Ekran → template: [groups → T-LIST, group-create → T-FORM …]
   > Ortak davranış: [doğrulama, geri bildirim, yıkıcı işlem onayı …]
   > Değiştirmek istediğiniz bir şey var mı?"
   Düzeltme gelirse dosyaları güncelle ve tekrar göster.
4. `project-state.md → yapi: flows.md, templates.md` alanının yazılı olduğunu kontrol et.

Sunum / fikir paylaşımı modunda da kısa sürüm yazılır — tek sayfalık işte tek akış (`F-01`) ve tek template yeterlidir.

## Adım 3 — Görev çıktısı hedefini sor

Görev listesi her zaman `design-plan.md`'ye yazılır (pipeline'ın ana kaydı). Planner'ı çalıştırmadan önce
kullanıcıya bir kopyasının da dış bir araca yazılıp yazılmayacağını sor:

> "Görev listesi `design-plan.md` dosyasına yazılacak. Ayrıca bir kopyası nereye gitsin?
> `[ ] Hiçbir yere — yalnızca design-plan.md`
> `[ ] Notion board`
> `[ ] Jira`"

Kullanıcı yanıtını bekle.

**Notion seçildiyse** ek bilgi sor:
> "Notion database veya board linkini paylaşır mısınız?"

**Jira seçildiyse** ek bilgi sor:
> "Jira proje anahtarını paylaşır mısınız? (örn. `NOMA`, `KOC`)"

Bu bilgileri aldıktan sonra Adım 3b'ye geç — planner'a ilet.

### Çalışma kimliği

Adım 3b'den önce bu çalışma için bir kimlik üret: `date +%Y%m%d-%H%M` (örn. `20261002-1415`).
Planner ve ads-ux-designer'a aynı kimliği ilet. Geçiş kontrolü (Adım 3c → 4) bu kimlikle yapılır;
önceki bir çalışmadan kalan işaretler böylece yeni çalışmayı "tamamlandı" gösteremez.

## Adım 3b — ads-design-planner'ı çalıştır (sadece deep mod)

`ads-design-planner` agent'ını çalıştır. Şunları ilet:
- Stratejist brief'i (onaylanmış kapsam + style direction + persona + mod +
  çakışma çözümleri + seçilen alternatif yön)
- `spec.md` içeriği
- `[proje-adı]-tokens.json` yolu (varsa)
- Çıktı tipi (`figma` veya `html` — builder ile tutarlı olsun)
- **Çalışma kimliği** (yukarıda üretilen)
- **Kopya hedefi:** kullanıcının Adım 3'teki yanıtı (yok / Notion + link / Jira + proje anahtarı)
  — planner `design-plan.md`'yi her durumda yazar, kopyayı ayrıca oluşturur; seçimi tekrar sormaz

Agent şunları yapar:
- Component listesi + state'leri çıkarır
- **Adım 2b'yi (tam sürüm) uygular:** `flows.md` ve `templates.md`'yi yazar veya genişletir, ekran→template eşlemesini
  çıkarır; görevler `F-` / `T-` kimliği taşır
- Tasarımcıya onaylatır (akışlar + template eşlemesi + Ortak Davranış dahil) — yanıt beklenir
- Görev listesini `design-plan.md`'ye `<!-- ADS_PLAN run=… tasks=… -->` işaretiyle yazar,
  seçildiyse Notion/Jira'ya kopyalar

Planner hangi çıktı formatını seçtiyse not al — Adım 4'te builder'a iletilecek.

## Adım 3c — ads-ux-designer'ı çalıştır (sadece deep mod)

`ads-ux-designer` agent'ını çalıştır. Şunları ilet:
- `design-plan.md` yolu
- **Çalışma kimliği**
- `spec.md` içeriği
- `[proje-adı]-tokens.json` yolu (varsa)
- `flows.md` ve `templates.md` yolları

Agent her görev için en uygun UX pattern'i seçer, gerekçesini yazar ve UX spec'leri `ux-specs.md`'ye,
bu çalışmanın kendi bölümüne ekler (`design-plan.md`'ye yazmaz; önceki bölümleri silmez).
Yalnızca gerçekten belirsiz durumlarda kullanıcıya kısa soru sorar.

## Adım 3c → Adım 4 Geçiş Kontrolü

`ads-ux-designer` tamamlanmadan `ads-design-builder` başlatılmaz. Kontrolü betikle yap:

```bash
node scripts/test/plan-gate.mjs --run [çalışma kimliği]
```

Çıkış `0` ise Adım 4'e geç. `1` ise çıktıdaki maddeye göre davran (aşağıdaki kurallarla aynı). Betik yoksa
(`scripts/test/` kurulmamış) aynı kontrolü elle yap ve özette "plan-gate elle yapıldı" yaz. Kontrolün kuralları:

1. `design-plan.md`'de `<!-- ADS_PLAN run=[kimlik] tasks=… -->` satırını bul → **plan görevleri**.
   Yoksa planner bu çalışmanın görevlerini yazmamıştır — dur, planner'ı yeniden çalıştır.
2. `ux-specs.md`'de `<!-- UX_SPEC_STATUS: COMPLETE run=[kimlik] tasks=… -->` satırını bul → **spec görevleri**.
   - Satır yoksa ya da başka bir `run` değeri taşıyorsa (önceki çalışmadan kalmış) → bu çalışma için
     tamamlanmamıştır; ads-ux-designer'ın bitmesini bekle. Bittiği hâlde satır yoksa ads-ux-designer'ı yeniden çalıştır.
3. Plan görevleri ile spec görevleri birebir aynı olmalı ve her görev için bölümde
   `### UX Spec — TASK-XXX` başlığı bulunmalı.
   - Eksik görev varsa ads-ux-designer'ı **yalnızca eksik görevler** için yeniden çalıştır.
   - Spec'te planda olmayan görev varsa kullanıcıya bildir (plan ile spec ayrışmış).

Üçü de sağlanınca Adım 4'e geç.

## Adım 4 — ads-design-builder'i çalıştır (sadece deep mod)

`ads-design-builder` agent'ını çalıştır. Şunları ilet:
- `design-plan.md` yolu ve çalışma kimliği (görev listesi; Notion/Jira yalnızca kopyadır, builder okumaz)
- `ux-specs.md` yolu (bu çalışmanın bölümü — her task için builder buradan okur)
- `flows.md` ve `templates.md` yolları
- Stratejist brief'i
- `[proje-adı]-tokens.json` yolu
- Çıktı tipi (`figma` veya `html`)
- Platform alanları (`platform`, `app_platforms`, `tablet`, `icon_source`, `component_source`)

Agent her görevi sırayla işler ve tamamlananları bildirir.

## Adım 5 — ads-design-reviewer ve ads-ux-reviewer'ı paralel çalıştır (sadece deep mod)

İki agent'ı **aynı anda** başlat — birinin bitmesini beklemeden diğerini başlat.

**ads-design-reviewer'a ilet:**
- `design-plan.md` yolu
- Stratejist brief'i
- `spec.md` yolu
- `[proje-adı]-tokens.json` yolu
- `flows.md` ve `templates.md` yolları
- ads-design-builder'ın ürettiği çıktıların listesi

**ads-ux-reviewer'a ilet:**
- `spec.md` yolu
- `flows.md` ve `templates.md` yolları (akış dalları, Ortak Davranış, çıkmaz sokak kontrolü)
- Stratejist brief'i (ürün tipi, persona, style direction)
- `[proje-adı]-tokens.json` yolu
- ads-design-builder'ın ürettiği çıktıların listesi

Her ikisi de tamamlandığında bulgularını birleştir. Aynı sorunu ikisi de raporladıysa
düzeltme döngüsüne tek bulgu olarak geçir — duplicate düzeltme yapılmasın.

## Adım 6 — Düzeltme döngüsü ve teslim kapısı (sadece deep mod)

Bu adım adStudio'nun tek teslim kuralıdır; `/ads-iterate`'in review'ları da bunu uygular.

**Teslim engelleri** = reviewer raporlarındaki "Teslim engelleri" maddeleri (`B…`, `U…` — Blocker, High ve
**Kural**) + `test-results.json`'da `BAŞARISIZ` veya `ÇALIŞTIRILAMADI` olan zorunlu testler.
Seviye tanımları: `references/reviewer-checklist.md → Seviye Ölçeği`. Medium ve Nitpick teslim engeli değildir.

**Döngü — en fazla 2 tur:**

1. **Düzelt:** `ads-design-builder`'ı çalıştır. İlet:
   - Orijinal brief
   - Açık teslim engelleri (kimlikleriyle, tekilleştirilmiş)
   - Yalnızca 1. turda: Medium / Nitpick bulguları — öneri olarak, uygulaması isteğe bağlı
   - Reviewer'ların "Ne iyi" listeleri — bu kararlar korunur
2. **Yeniden kontrol:**
   - HTML: `node scripts/test/run-all.mjs` (yeni `test-results.json`)
   - `ads-design-reviewer` ve `ads-ux-reviewer`'ı **yeniden kontrol** modunda çalıştır: önceki teslim engeli listesini
     ver; her madde için `kapandı` / `açık` yazarlar ve düzeltmenin yol açtığı yeni teslim engelini ekler.
     Medium / Nitpick taraması tekrarlanmaz.
   - Yeniden kontrolde bir reviewer'ın teslim engeli olarak bildirdiği **her** madde listeye girer — ilk
     incelemede aynı konu Medium / Nitpick olarak geçmiş olsa bile. Orkestratör seviyeyi düşüremez, "tekrar"
     diye eleyemez; iki reviewer aynı konuya farklı seviye verirse yüksek olan geçerlidir.
3. Açık teslim engeli kalmadıysa döngü biter. Kaldıysa ve bu 1. tur ise 1'e dön; 2. turdan sonra döngü durur.

**Kapsam kararı.** Builder bir engel için "kapsam kararı gerekli" dönerse (kural: `ads-design-builder.md → Adım 1`)
o engel açık kalır, diğer düzeltmeler sürer. Döngü bitmeden kullanıcıya sor:

> "**[engel]** kapatılmak için kapsamda olmayan bir şey gerektiriyor: [ne eklenmesi gerekirdi].
> `[ ] Kapsama ekle` — yeni görev olarak planlanır ve uygulanır
> `[ ] Geçici çözüm: [vaadi koruyan çözüm önerisi]`
> `[ ] İstisna olarak kabul et — engel açık kalır, gerekçesi kaydedilir`"

- **Kapsama ekle:** önce plan ve UX tanımı güncellenir (`ads-design-planner` iterasyon modunda + `ads-ux-designer`, yeni
  çalışma kimliği, `plan-gate.mjs`), ardından builder uygular ve yeniden kontrol yapılır. Bu ek iş tur sayısına girmez.
- **Geçici çözüm:** yalnızca butonun / öğenin vaadini koruyan bir çözüm kabul edilir (ör. "Denemeyi başlat" →
  mevcut iletişim formu, etiket "Deneme için bize yazın"). İlgisiz sayfaya bağlamak veya yalnızca devre dışı
  bırakmak engeli kapatmaz. Geçici çözüm de yeniden kontrolden geçer.
- **İstisna:** bulgu çözülmüş sayılmaz. `project-state.md → ## Teslim İstisnaları` bölümüne yazılır:
  `- [Tarih] [engel kimliği] [engel] — gerekçe: [kullanıcının gerekçesi] — onay: kullanıcı`.

Builder'ın onaysız eklediği kapsam dışı içerik (yeni form, akış, vaat) onaylı kapsam sayılmaz; kullanıcının
kararına göre korunur (kapsama ekle) ya da geri alınır.

İlk incelemede hiç teslim engeli yoksa döngü çalışmaz (Medium / Nitpick önerileri için tek bir builder turu
kullanıcı isterse yapılır).

**Teslim durumu** (Adım 7 özetinin ilk satırı). Tur sınırına ulaşmak kabul anlamına gelmez:

- **Teslime hazır** — dördü birden:
  1. Açık teslim engeli yok (reviewer'ların son yeniden kontrolü)
  2. Zorunlu otomatik testler geçti: `test-results.json → exit_code: 0`. Figma çıktısında HTML testleri
     `UYGULANAMAZ`'dır; bu koşul Figma için reviewer'ların tamamlanmış incelemesiyle karşılanır.
  3. Çıktı türünün gerektirdiği inceleme tamamlandı — deep mod: ads-design-reviewer + ads-ux-reviewer; quick mod ve
     `/ads-iterate` tek dosyalık değişiklik: hafif review
  4. Görsel farklar çözüldü (HTML): `test-results.json → visual_review.pending_review` boş. Her fark
     `.diff.png` ile incelenir; kasıtlıysa kullanıcıya gösterilip kabul edilir ve yalnızca o dosyanın
     baseline'ı güncellenir (`node scripts/test/visual.mjs --update --only <dosya>`), beklenmedikse
     araştırılıp düzeltilir. Görsel fark tek başına teslimi otomatik engellemez ama incelenmeden geçilmez.
     Baseline yoksa (ilk üretim) özet "görsel karşılaştırma yapılamadı — ilk üretim" der; bu koşulu engellemez.
- **İstisna onayıyla teslim edilebilir** — açık kalan her teslim engeli `## Teslim İstisnaları`'nda kullanıcı
  onayıyla kayıtlı, diğer koşullar sağlanmış. Özet istisnaları gerekçeleriyle listeler; engeller "çözüldü" yazılmaz.
- **Teslime hazır değil** — aksi halde. Özet her açık engeli kimliği, etkisi ve neden kapanmadığıyla listeler;
  `ÇALIŞTIRILAMADI` testler nedeniyle birlikte (ör. "Playwright kurulu değil") yazılır.

**Baseline:** Kullanıcı "teslime hazır" çıktıyı onayladığında `node scripts/test/visual.mjs --update` ile
görsel baseline alınır. Sonraki `/ads-iterate` karşılaştırması bu onaylı hâle göre yapılır.

## Adım 7 — Özet

Kullanıcıya şunu bildir:
- **Teslim durumu:** "Teslime hazır", "İstisna onayıyla teslim edilebilir — [n] istisna" veya
  "Teslime hazır değil — [n] açık engel" (Adım 6) — ilk satır
- Düzeltme döngüsü: kaç tur yapıldı, hangi engeller kapandı
- Otomatik testler: `test-results.json` özeti (test başına sonuç, genel kod)
- Hangi component'lar / ekranlar üretildi
- Builder pre-flight sonucu (✗ kalan madde varsa)
- ads-design-reviewer ne buldu (token, spec, a11y, AI tells)
- ads-ux-reviewer ne buldu (heuristic'ler, component binding, manuel a11y)
- Ne düzeltildi (veya "her iki reviewer'dan da bulgu yoktu"); açık kalan Medium / Nitpick önerileri
- Figma çıktısı nerede

Özet sonunda şunu ekle:

> "Tasarımda değişiklik yapmak veya yeni özellik eklemek için `/ads-iterate` komutunu kullanın."

---

## Bağlayıcı Karar Kontrolü

Özet sonunda şunu sor:

> "Bu süreçte kalıcı bir tasarım kararı aldık mı? (örn. 'Bu yön kesin olarak seçildi', 'X artık kullanılmayacak')"

Kullanıcı evet derse veya konuşmada açıkça bağlayıcı bir karar geçtiyse:
- `spec.md`'nin `## Bağlayıcı Kararlar` bölümünü oku
- Bölüm yoksa oluştur
- Kararı şu formatta ekle:

```
- [Tarih] [Karar] — [bağlam]
```

---

**Not:** Sunum modunda token yoksa builder serbest değerler üretir — AI tells filtresi çalışmaz, bu normaldir.

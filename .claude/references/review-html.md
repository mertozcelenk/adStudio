# Kontrol — HTML çıktısı

Kuralların kendisi ve seviyeleri: `references/rules.md` (önce onu oku — Seviye Ölçeği, Kapsam Etiketleri,
Bağlam Girdileri). Bu dosya her kuralın **HTML'de nasıl kontrol edildiğini** anlatır; seviye yazmaz, kimliği anar.
Bulgu biçimi: `B1 · DM-3 · High — [ne, nerede]`.

Workflow ve rapor biçimi: `agents/ads-design-reviewer.md`. Figma çıktısı için bu dosya değil `review-figma.md` okunur.

---

## Otomatik Testler

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
| `GEÇTİ` | Teslimi engelleyen bulgu yok | Uyarıları (Medium/Nitpick) ilgili kuralda raporla |
| `BAŞARISIZ` | Teslimi engelleyen bulgu var ya da test çöktü | Her bulguyu kendi `etki` ve `teslimi engeller` alanıyla raporla |
| `ÇALIŞTIRILAMADI` | Test zorunlu ama girdi/bağımlılık eksik ya da zaman aşımı | **Doğrulama boşluğu** — nedeniyle birlikte "Teslim engelleri" listesine yaz |
| `UYGULANAMAZ` | Çıktı türü bu testi gerektirmiyor (`project-state.md → cikti_formati: figma`) | "Uygulanamaz" yaz; Figma projesinde `review-figma.md` uygulanır |

Genel çıkış kodu `0` yalnızca "uygulanan otomatik testler geçti" demektir; teslime hazır olmak için
yeterli değildir. `1` = başarısız test var, `2` = başarısız yok ama zorunlu bir doğrulama çalıştırılamadı.

`visual` **inceleme** rolündedir: genel kodu değiştirmez ama her zaman raporlanır. `visual_review.compared: false`
ise "görsel karşılaştırma yapılamadı" yaz (nedeniyle). `pending_review`'daki her dosya için `.diff.png`'ye bak,
farkı tarif et ve kasıtlı mı (brief / istekle uyumlu) beklenmedik mi yaz; beklenmedik farkı Medium bulgu
olarak raporla. Kabul kararı kullanıcınındır (`ads-design-strategy.md → Adım 6`, koşul 4).

`tells` em/en-dash, CTA satır kayması, nav yüksekliği, eyebrow, yasak görsel desenler, tekrarlı giriş animasyonu,
okuma genişliği ve kalite kontrollerini mekanik olarak ölçer; bulgularını aşağıdaki ilgili kuralda raporla.
Web ekranlarını 1280 **ve 375**'te (spec'te `tablet: true` ise 768'de de) açar; 375 bulguları `@375` etiketlidir (MW).
Uygulama ekranlarını cihaz ölçüsünde açar ve APP kurallarının mekanik kısmını ölçer.

`responsive` kırılma noktalarını ölçer; sonucu MB-1 altında raporla.

`structure` (`project-state.md → yapi` varsa) ekranları `flows.md` / `templates.md` ile karşılaştırır: işaretler,
zorunlu durumlar, bölgeler, çıkmaz sokak, akış bağımlılıkları; bulgularını ST kurallarında raporla. `yapi` yoksa
`UYGULANAMAZ` — eski proje, bulgu değildir.

`scripts/test/` yoksa veya `npm install` başarısız olursa kaynak analiziyle devam et, ama zorunlu testlerin
hepsini `ÇALIŞTIRILAMADI` olarak raporla ve "Teslim engelleri" listesine yaz. Kaynak analizi otomatik testin
yerine geçmez; bu durumda çıktı "teslime hazır" sayılmaz.

---

## Kurallar — HTML'de nasıl kontrol edilir

### SP — Spec uyumu
- **SP-1** — brief'in kapsam listesindeki her component / ekran için bir dosya var mı.
- **SP-2** — brief'te geçen durumların blokları ekranda var mı.

### TK — Token bağlama
- **TK-1** — CSS custom property değerleri token değerleriyle eşleşiyor mu; `var(--…)` yerine ham değer var mı (`tokens` testi).
- **TK-2** — spacing ve `border-radius` değerleri (`tokens` testi + kaynak).

### A11Y — Erişilebilirlik
- **A11Y-1** — `accessibility` testi (axe) + spec'teki ek gereksinimler.
- **A11Y-2** — token JSON varsa ön plan / arka plan token değerlerinden hesapla; yoksa CSS'ten oku.
- **A11Y-3** — computed `font-size`; `em` / `rem` ise 16px üzerinden px karşılığı.

### MD — Metadata ve işaretler
- **MD-1** — her HTML dosyasının `<head>`'inde yorum ve `meta author`.
- **MD-2** — `generator` / `ai` / `claude` içeren `<meta>`, `<!-- AI generated -->` tarzı yorum, `data-ai` / `data-generated` / `data-claude` özelliği.
- **MD-3** — ekran dosyalarında `<body data-page-kind="marketing|product|content">`.
- **MD-4** — `<body data-platform="web|ios|android">` (landing kuralları uygulanamaz — ekranı stratejist kapsamından eşleştirip devam et).
- **MD-5** — yalnızca Figma (HTML'de her ekran ayrı dosya, işaretler `data-*`).

### AT — Yasak desenler
Token JSON'dan `"source": "user_explicit"` token'ları oku — karşılık gelen değerler atlanır. Sayfanın tamamında
(başlık, eyebrow, pill, gövde, alıntı, atıf, caption, buton, `alt`, `aria-label`) kontrol et. Token JSON yoksa kaynak
analiziyle yap; yapılamayanları "Token JSON sağlanmadı, manuel doğrulama gerekiyor" diye işaretle.
- **AT-1** — `tells` + kaynak; `data-copy="user"` içindeki metin muaf.
- **AT-2** — div'lerden kurulmuş görev listesi / terminal / dashboard.
- **AT-3** — `--font-family-display` değeri ve `_meta.font_rationale`.
- **AT-4** — `tells` eyebrow ölçümü; istisna varsa yalnızca `data-eyebrow-allowed` kapsamında.
- **AT-5** — yan yana eşit genişlikte üç kart.
- **AT-6** — zemin / accent renkleri (`user_explicit` değilse).
- **AT-7** — metinlerde placeholder isim.
- **AT-8** — CSS'te `#000` / `#fff` ve eşdeğerleri.
- **AT-9** — katalogdaki her madde ayrı bulgu.
- **AT-10** — `tells` (radial-gradient hale, ızgara / şerit `linear-gradient`, blink imleç) + kaynak (emoji, elle SVG).
- **AT-11** — brief'teki "Reddettiği kalıp" ile sayfanın genel kurgusu.
- **AT-12** — katalogdaki diğer Layout / İçerik maddeleri.

### TL — Tutarlılık kilitleri
- **TL-1** — accent token'ının kullanıldığı yerler; bir bölümde beliren farklı accent (ör. gri-turuncu sitede mavi CTA).
- **TL-2** — `border-radius` değerlerinin dağılımı ve belgelenmiş kural.
- **TL-3** — tüm CTA etiketleri niyete göre gruplanır ("Bize ulaşın" + "Konuşalım" aynı niyet).
- **TL-4** — `tells` 1280 CTA satır sayısı.
- **TL-5** — CTA, input, placeholder, focus ring, helper ve hata metinleri bulundukları bölümün zeminine karşı.

### LY — Layout disiplini
- **LY-1** … **LY-9** — 1280 görünümünde ölçülür (`tells` nav yüksekliği ve hero satır sayısı; kalanı kaynak + ekran görüntüsü).
  - **LY-1** hero metin öğeleri, satır sayıları, CTA'nın ilk görünümde olması, üst padding.
  - **LY-2** CTA altındaki öğeler. **LY-3** hero hizası ve VARIANCE. **LY-4** logo bölümü ve logo türü.
  - **LY-5** nav satır sayısı ve yüksekliği. **LY-6** bölümlerin layout ailesi listesi. **LY-7** art arda split bölümler.
  - **LY-8** bento hücreleri. **LY-9** bölüm başlıkları.

### MB — Mobil düzen
- **MB-1** — her çok kolonlu bölümün 375 kuralı CSS'te açıkça yazılı mı; `responsive` sonucu.

### DM — Koyu tema
- **DM-1** — `[data-theme="dark"]` ve `@media (prefers-color-scheme: dark)` token blokları.
- **DM-2** — A11Y-2 ve TL-5 ölçümleri iki temada ayrı ayrı (`accessibility` testi iki temayı da açar).
- **DM-3** — koyu temada metin ve yüzey katmanlarının ayrışması (ekran görüntüsü).
- **DM-4** — koyu tema bloklarında ham renk değeri.
- **DM-5** — tek bölüme uygulanmış ters tema sınıfı / özelliği.

### RK — Koruma ve bağlayıcı kararlar
`[Korunan]` madde yoksa RK-1 ve RK-2'yi atla.
- **RK-1** — her `[Korunan]` maddeyi çıktıyla karşılaştır (slug, nav etiketleri, form alanları, logo, yasal metin, `data-*`).
- **RK-2** — focus stilleri, `alt` metinleri, klavye sırası önceki sürümle.
- **RK-3** — Bağlayıcı Kararlar'daki her madde çıktıyla.

### MO — Hareket
- **MO-1** — animasyon / geçiş özellikleri (`transform`, `opacity` dışı özellikler ve MOTION değeri).
- **MO-2** — hareket etmeyen öğelerdeki `transition` tanımları.
- **MO-3** — `@media (prefers-reduced-motion: reduce)` bloğu her animasyonu kapsıyor mu.
- **MO-4** — `window.addEventListener('scroll', …)`.
- **MO-5** — sayfadaki hareketin türü ve miktarı MOTION bandıyla.
- **MO-6** — imza anın yeri ve Tez'le bağı.
- **MO-7** — `tells` tekrarlı giriş animasyonu (aynı `animation-name` / reveal sınıfı).
- **MO-8** — animasyonlu durum noktalarının veri kaynağı.
- **MO-9** — her animasyonun amacı; sonsuz döngüler.

### OD — Okuma düzeni
- **OD-1** — `tells` okuma genişliği (gövde `max-width`).
- **OD-2** — ara başlık sayısı ve içindekiler / bağlantılar.
- **OD-3** — landing kalıplarının yerleşimi.

### QA — Kalite
`tells` kalite ölçümleri + ekran görüntüsü. QA-1 varsa önce onu düzelttir.
- **QA-1** — konsoldaki yakalanmamış hatalar. **QA-2** — yükleme ve reveal sonrası gizli kalan metin.
- **QA-3** — metin üstüne binen katmanlar. **QA-4** — kaydırılan listelerin ilk / son kartı.
- **QA-5** — başlıkların üst / alt boşlukları. **QA-6** — arka plan görselinin üstündeki katman opaklığı.
- **QA-7** — aynı kart içindeki tekrar eden metinler.

### MW — Mobil web
`tells` 375 geçişinin bulguları (`@375`) ve kaynak analizi:
- **MW-1** — tıklanabilir kutu (padding dahil).
- **MW-2** — yalnızca `:hover` ile görünür olan buton / link / menü.
- **MW-3** — `viewport-fit=cover` varken üst / alt sabit öğelerde `env(safe-area-inset-*)`.
- **MW-4** — tam ekran bölümde `100vh`.
- **MW-5** — 375'te CTA satır sayısı ve QA kurallarının 375 bulguları.

### APP — Uygulama ekranları
`tells` APP-2 … APP-5 ve APP-6'nın mekanik kısmını ölçer.
- **APP-1** — ekran kabı cihaz ölçüsünde, durum çubuğu ve home indicator / gezinme çubuğu öğeleri (`build-html.md → Uygulama Ekranı Çerçevesi`).
- **APP-2** — sabit üst / alt öğeler güvenli alan içinde.
- **APP-3** — etkileşimli öğe kutuları ve aralıkları.
- **APP-4** — sekme çubuğu öğe sayısı.
- **APP-5** — kaydırınca belirme / giriş animasyonu.
- **APP-6** — kök yazı %130'da taşma / kesilme / örtüşme.
- **APP-7** — div'den kurulmuş platform kontrolleri, özel global menü.
- **APP-8** — ekranlar arası geçiş animasyonları.
- **APP-9** — kontrollerin platformu (iOS switch / Android switch, FAB).
- **APP-10** — ikon kümesi `icon_source` ile.
- **APP-11** — Platform Farkları tablosundaki parçaların iki sürümü.
- **APP-12** — Tez'in navigasyon / kontrol yapısına etkisi.
- **APP-13** — `tablet: true` ise 768 görünümünün düzeni.

### ST — Yapı
`structure.mjs` (run-all) işaretleri ve bağımlılıkları ölçer; aşağıdakilerin **anlamını** reviewer denetler.
- **ST-1** — zorunlu durum blokları (`data-state`) ve içerikleri.
- **ST-2** — boş durum eyleminin hedefi (`data-flow-start`).
- **ST-3** — `Dallar`'daki her dalın ekrandaki karşılığı.
- **ST-4** — son adımın bağlantısı `Sonra` hedefiyle.
- **ST-5** — doğrulama zamanı, geri bildirim, geri alma, yıkıcı işlem onayı.
- **ST-6** — `data-region` bölgeleri ve template'in `Davranış` / `Pattern` maddeleri; aynı template'li ekranlar.
- **ST-7** — akışta / template'te olmayan işlev ya da dal.
- **ST-8** — `structure` testinin işaret bulguları (`data-template`, `data-flow`, `data-region`, `data-state`, `data-flow-start`).

### CP — Çapraz sayfa tutarlılığı
Tüm `.html` ekranları birlikte okunur. Ortak öğe: `<nav>` / `role="navigation"`, `<header>` / `role="banner"`,
`<footer>` / `role="contentinfo"`, `role="complementary"` / `sidebar` sınıfı; yalnızca tek sayfada görünen öğe karşılaştırılmaz.
- **CP-1** — ortak öğenin alt öğe sayısı, sırası ve sınıf adları.
- **CP-2** — ortak öğenin CSS değerleri: bir sayfada `var(--…)`, ötekinde ham değer.
- **CP-3** — ham değer kullanan yerlerde aynı rengin / boyutun farklı yazımı.
- **CP-4** — nav link metinleri, `href`'leri, ikon / görsel referansları.
- **CP-5** — aynı hiyerarşideki ikonların stili (filled / outline), ikon ailesi, PNG ikon.
- **CP-6** — koyu tema bloklarında (`[data-theme="dark"]`, `prefers-color-scheme`) değişken listesi ve değerleri.
- **CP-7** — `data-copy="user"` metinlerinin sayfalar arasında karşılaştırılması.
- **CP-8** — `data-platform` değeri `app_platforms` ile; sekme / navigation bar öğeleri; `.device` ölçüsü ve `--safe-*` değerleri.
- **CP-9** — h1–h3 / hero başlığı `var(--font-family-display)`, gövde / buton / form / nav `var(--font-family-body)`.

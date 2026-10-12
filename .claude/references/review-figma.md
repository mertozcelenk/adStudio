# Kontrol — Figma çıktısı

Kuralların kendisi ve seviyeleri: `references/rules.md` (önce onu oku — Seviye Ölçeği, Kapsam Etiketleri,
Bağlam Girdileri). Bu dosya her kuralın **Figma'da nasıl kontrol edildiğini** anlatır; seviye yazmaz, kimliği anar.
Bulgu biçimi: `B1 · DM-3 · High — [ne, nerede]`.

Workflow ve rapor biçimi: `agents/ads-design-reviewer.md`. HTML çıktısı için bu dosya değil `review-html.md` okunur.

---

## Okuma

Figma'yı betik taramaz; otomatik testler (`run-all`) Figma'da `UYGULANAMAZ`'dır — her kontrol elle yapılır.

- `get_design_context` ve `get_screenshot` ile her ekran frame'ini incele. Önce link tabanlı araçları kullan
  (`mcp__plugin_figma_figma__*`; `fileKey` ve `nodeId` Figma linkinden — `project-state.md → figma_linki`);
  erişilemezse masaüstü araçlarını (`mcp__figma-desktop__*`) dene. Masaüstü araçları düzenlemeden sonra dosyanın
  eski hâlini gösterebilir — tutarsızlıkta link tabanlı sonucu esas al.
- Ekran bilgisi `adStudio` annotation'ındadır: `get_design_context` çıktısında `data-adstudio-annotations`
  (`flow`, `template`, `states`, `regions`, `page_kind`, `platform`, `not:`; durum frame'lerinde `state:`).
  Biçim: `build-figma.md → Ekran annotation'ı`.
- Ölçüler (dokunma alanı, genişlik, boşluk) `get_design_context` / `get_metadata` çıktısındaki katman boyutlarından okunur.
- Annotation'daki `not:` satırları ve builder özetindeki "Figma'da elle yapılacak" listesi bilinen eklenti sınırlarıdır
  (yazı tipi yedeği, tabular rakam, ikon yer tutucusu); bunları ayrıca bulgu olarak raporlama.

---

## Kurallar — Figma'da nasıl kontrol edilir

### SP — Spec uyumu
- **SP-1** — kapsam listesindeki her ekran için bir ekran frame'i, her component için bir component.
- **SP-2** — brief'te geçen durumlar için durum frame'leri (`state:` annotation'ı).

### TK — Token bağlama
- **TK-1** — fill, metin stili, boşluk ve radius'un variable / stile bağlı olması; serbest değer.
- **TK-2** — auto-layout boşlukları, padding ve corner radius değerleri.

### A11Y — Erişilebilirlik
- **A11Y-1** — spec'teki gereksinimler frame'ler üzerinden.
- **A11Y-2** — `get_design_context` fill renklerinden; token JSON varsa değerleri oradan hesapla.
- **A11Y-3** — text layer font size (Figma px birimi).

### MD — Metadata ve işaretler
- **MD-1** — yalnızca HTML (Figma'da imza satırı yazılmaz — kullanıcı kararı 2026-10-11).
- **MD-2** — component `description`'ları ve annotation metinleri.
- **MD-3** — ekran annotation'ında `page_kind:` satırı.
- **MD-4** — ekran annotation'ında `platform:` satırı.
- **MD-5** — ekranların türü `FRAME` (component / component set değil) ve her ekranda `adStudio` kategorili annotation.

### AT — Yasak desenler
Token JSON'dan `"source": "user_explicit"` token'ları oku — karşılık gelen değerler atlanır.
`get_design_context` ve `get_screenshot` çıktısı üzerinden; spec'te kullanıcı metni olarak geçen metin muaf.
- **AT-1** — text layer'lardaki `—` / ayraç `–`.
- **AT-2** — dikdörtgenlerden kurulmuş görev listesi / dashboard / terminal.
- **AT-3** — display metin stilinin font ailesi.
- **AT-4** — başlık üstündeki küçük, harf aralıklı etiket katmanı.
- **AT-5** — yan yana eşit genişlikte üç kart.
- **AT-6** — zemin / accent fill'leri.
- **AT-7** — text layer'larda placeholder isim.
- **AT-8** — `#000000` / `#FFFFFF` fill'ler (uygulamada zemin variable'ları muaf).
- **AT-9** — katalogdaki süs ve meta metinler.
- **AT-10** — hale / ızgara / çizgili desen katmanları, emoji, elle çizilmiş ikon.
- **AT-11** — brief'teki "Reddettiği kalıp" ile ekranların genel kurgusu.
- **AT-12** — katalogdaki diğer Layout / İçerik maddeleri.

### TL — Tutarlılık kilitleri
- **TL-1** — accent variable'ının kullanıldığı katmanlar; farklı accent fill'i.
- **TL-2** — corner radius değerlerinin dağılımı.
- **TL-3** — buton text layer'ları niyete göre.
- **TL-4** — 1280 genişlikteki frame'de buton metni tek satır mı.
- **TL-5** — buton, input, helper ve hata metinlerinin fill'i bulundukları zemine karşı.

### LY — Layout disiplini
1280 (ya da en yakın desktop) genişlikteki ekran frame'leri üzerinden.
- **LY-1** hero text layer'ları, satır sayıları, ilk görünüm (frame'in üst ~800px'i), üst padding.
- **LY-2** CTA altındaki katmanlar. **LY-3** hero hizası ve VARIANCE. **LY-4** logo bölümü ve logo türü.
- **LY-5** nav yüksekliği ve satır sayısı. **LY-6** bölümlerin layout ailesi. **LY-7** art arda split bölümler.
- **LY-8** bento hücreleri. **LY-9** bölüm başlıkları.

### MB — Mobil düzen
- **MB-1** — kapsamdaki her ekranın 375 frame'i ya da auto-layout'la mobilde nasıl yığıldığının tanımı.

### DM — Koyu tema
- **DM-1** — `Color` variable koleksiyonunda `Light` / `Dark` modları.
- **DM-2** — kontrast her iki modda (frame'in modunu değiştirerek).
- **DM-3** — Dark modda metin ve yüzey katmanlarının ayrışması (ekran görüntüsü).
- **DM-4** — fill'lerin variable'a bağlı olması (mod değişince renk değişiyor mu).
- **DM-5** — tek bölüme farklı mod atanmış frame.

### RK — Koruma ve bağlayıcı kararlar
`[Korunan]` madde yoksa RK-1 ve RK-2'yi atla.
- **RK-1** — nav etiketleri, form alanları, logo ve yasal metinler text layer'lardan.
- **RK-2** — önceki sürümdeki erişilebilirlik notları / odak durumları korunmuş mu.
- **RK-3** — Bağlayıcı Kararlar'daki her madde frame'lerle.

### MO — Hareket
adStudio Figma'da hareket (prototip geçişi, animasyon) üretmez. Figma'da hareket üretilmeye başlanınca yazılacak
(kullanıcı kararı 2026-10-12).
- **MO-1** — Figma'da henüz yok.
- **MO-2** — Figma'da henüz yok.
- **MO-3** — Figma'da henüz yok.
- **MO-4** — yalnızca HTML.
- **MO-5** — Figma'da henüz yok.
- **MO-6** — Figma'da henüz yok.
- **MO-7** — Figma'da henüz yok.
- **MO-8** — Figma'da henüz yok.
- **MO-9** — Figma'da henüz yok.

### OD — Okuma düzeni
- **OD-1** — gövde text layer genişliği (1280 frame'de).
- **OD-2** — ara başlık sayısı ve içindekiler / bağlantı katmanları.
- **OD-3** — landing kalıplarının yerleşimi.

### QA — Kalite
- **QA-1** — yalnızca HTML.
- **QA-2** — yalnızca HTML.
- **QA-3** — text layer'ların üstüne binen katmanlar (ekran görüntüsü + katman sınırları).
- **QA-4** — kaydırılan listelerin ilk / son kartı.
- **QA-5** — başlıkların üst / alt boşlukları (auto-layout değerleri).
- **QA-6** — yalnızca HTML.
- **QA-7** — aynı kart içindeki tekrar eden metinler.

### MW — Mobil web
375 genişlikteki web ekran frame'leri üzerinden.
- **MW-1** — etkileşimli katmanın (ya da hit alanı katmanının) kutusu; paragraf içi linkler muaf.
- **MW-2** — yalnızca hover variant'ında ya da "While hovering" prototip etkileşiminde görünen eylem; varsayılan
  durumda erişilemeyen buton / menü.
- **MW-3** — yalnızca HTML.
- **MW-4** — yalnızca HTML.
- **MW-5** — 375 frame'inde CTA satır sayısı; QA-3, QA-4, QA-5 375 frame'inde de.

### APP — Uygulama ekranları
Kurallar: `references/mobile-platforms.md`.
- **APP-1** — frame ölçüsü ve durum çubuğu / home indicator / gezinme çubuğu katmanları.
- **APP-2** — içerik veya kontrolün bu katmanların altına taşması.
- **APP-3** — etkileşimli katmanların (ya da hit alanı katmanının) boyutu ve aralıkları.
- **APP-4** — sekme çubuğu öğe sayısı.
- **APP-5** — Figma'da henüz yok (hareket).
- **APP-6** — Figma'da henüz yok (büyük yazı simülasyonu yok; component açıklamasındaki Dynamic Type kuralı okunabilir).
- **APP-7** — `component_source`: `kit` ise kit instance'ları, `drawn` ise platform adlı component'ler (`iOS/Switch`),
  `own` ise mevcut kütüphane; yeniden icat edilmiş kontrol.
- **APP-8** — Figma'da henüz yok (prototip geçişi üretilmiyor).
- **APP-9** — component adları ve görünümleri platformla.
- **APP-10** — ikon katmanları `icon_source` ile.
- **APP-11** — Platform Farkları tablosundaki parçaların iOS ve Android sürümleri.
- **APP-12** — Tez'in navigasyon / kontrol yapısına etkisi.
- **APP-13** — tablet frame'inin düzeni.

### ST — Yapı
İşaretler frame adı (`T-… · Ekran`) ve ekran annotation'ından (`flow:`, `template:`, `states:`, `regions:`) okunur;
durumlar ayrı frame olarak aranır (`state:` annotation'ı). Betik çalışmaz — hepsi elle.
- **ST-1** — template'in zorunlu durumları için durum frame'leri ve içerikleri.
- **ST-2** — boş durum frame'indeki eylemin hedefi.
- **ST-3** — `Dallar`'daki her dalın frame'lerdeki karşılığı.
- **ST-4** — son adımın hedefi `Sonra` ile.
- **ST-5** — doğrulama zamanı, geri bildirim, geri alma, yıkıcı işlem onayı (frame'ler ve annotation `not:` satırları).
- **ST-6** — `regions:` satırı ve template'in `Davranış` / `Pattern` maddeleri; aynı template'li ekranlar.
- **ST-7** — akışta / template'te olmayan işlev ya da dal.
- **ST-8** — frame adı ve annotation satırları `flows.md` / `templates.md` ile; `flows.md`'deki ekran linkleri önce
  `node-id` ile, bulunamazsa adla aranır, ad / numara uyuşmazlığı bulgudur
  (`structure-standards.md → Figma çıktısında ekran atfı`).

### CP — Çapraz sayfa tutarlılığı
Tüm ekran frame'leri birlikte okunur (link tabanlı araçlarla, `get_metadata` + `get_design_context`). Ortak öğe: iki ya da
daha fazla ekranda bulunan aynı component'in instance'ları (nav, header, footer, sekme / navigation bar).
- **CP-1** — ortak öğenin her ekranda aynı ana component'in instance'ı olması; **koparılmış (detached) instance** ya da
  elle değiştirilmiş alt katmanlar; aynı ekran tipinde farklı variant.
- **CP-2** — ortak öğenin fill / metin stili / boşluklarının her ekranda aynı variable'lara bağlı olması.
- **CP-3** — yalnızca HTML (Figma'da değerler variable'dan gelir; sabit değer CP-2 / TK-1).
- **CP-4** — gezinme text layer'ları ve ikonları; prototip bağlantıları varsa hedefleri.
- **CP-5** — ikon component'lerinin stili ve ailesi; raster (görsel fill) ikon.
- **CP-6** — yalnızca HTML (Figma'da tek `Color` koleksiyonu ve modları tüm ekranlarda ortaktır; DM-4 ile kontrol edilir).
- **CP-7** — spec'te kullanıcı metni olarak geçen text layer'ların ekranlar arasında karşılaştırılması.
- **CP-8** — aynı platform ekranlarında sekme / navigation bar instance'larının variant'ı ve öğeleri; frame ölçüleri ve
  durum çubuğu / home indicator katmanları.
- **CP-9** — başlık katmanlarının display metin stiline, gövde / buton / form katmanlarının gövde metin stiline bağlı olması.
- Ayrıca: ekran annotation'larının birbirleriyle tutarlılığı (aynı akış aynı adla) ST-8 altında raporlanır.

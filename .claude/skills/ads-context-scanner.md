---
name: ads-context-scanner
description: Var olan bir design system'e/ürüne yeni bir çalışma eklerken, mevcut sistemi tarayıp bir "mevcut durum" envanteri çıkarmak için kullanılır. `impact-analysis`'ten (var olan sisteme ekleme senaryosunun spec-intake karşılığı) ÖNCE çalışır. "Var olan sisteme ekleme yapacağız", "bu projeye yeni bir modül/ekran ekleyeceğiz" gibi taleplerde tetiklenir.
---

# Context Scanner

## Durum Yönetimi

Bu skill `references/skill-state-pattern.md` kalıbını uygular.

Başlamadan önce mevcut state dosyasını kontrol et:
```bash
ls /tmp/ads-context-scanner-*.json 2>/dev/null
```
Dosya varsa kullanıcıya "kaldığım yerden devam et / yeni başlat" sor.
Her sayfa taraması tamamlandığında `/tmp/ads-context-scanner-{RUN_ID}.json` dosyasını güncelle.
Başarıyla tamamlanınca dosyayı sil.

---

## Doğrulama İlkesi — Hiçbir Şeyi Varsayma
Bu skill boyunca geçerli temel kural: **bir şeyi doğrulamadan doğruymuş
gibi sunma.** "Muhtemelen", "pattern'e göre böyle olmalı", "büyük
ihtimalle" gibi ifadelerle bir bulguyu rapora/token'a yazmak yerine —
doğrulaması mümkünse (bir sorgu daha, bir sayfa daha, bir screenshot
daha) doğrula. Doğrulaması gerçekten mümkün değilse (limit, erişim
sorunu vb.), bunu **açıkça "doğrulanmadı" diye işaretle**, sessizce
varsayılan bir değerle doldurma veya kesinmiş gibi sunma. Emin
olmadığın her nokta ya doğrulanır ya da doğrulanmadığı açıkça belirtilir
— üçüncü bir seçenek (belirsizce varsayıp geçmek) yok.

## Amaç
Yeni çalışma başlamadan önce, üzerine inşa edilecek mevcut sistemi
otomatik olarak tarayıp bir envanter çıkarmak. Sıfırdan tasarımın aksine
kullanıcıya "referans var mı" diye sormayız — sistem zaten aktif ve
bilinen, bu yüzden tarama kullanıcı beklemeden başlar.

## Model Optimizasyonu — `ads-context-scanner-worker` Subagent'ı
Aşağıdaki akıştaki **mekanik** adımlar (sayfaya gitme, JS ile stil
çekme, Figma variable/layer okuma, gerektiğinde screenshot) `context-
scanner-worker` subagent'ına (`model: haiku`) devredilir — token
tüketimini optimize etmek için. Şunlar **ana akışta** (ana konuşmanın
modeli) kalır: kaynak tipi belirleme, hangi sayfaların taranacağına
karar verme (kullanıcıya sorma), Temel Yeterlilik Kontrolü
değerlendirmesi, tutarsızlık tespiti, raporun sentezlenmesi.

Pratikte: her sayfa/node için worker'ı çağır, ham veriyi al, checklist'i
ve limitleri ana akışta değerlendirmeye devam et.

## 0. Kaynak Tipini Belirle
Mevcut sistem hangi formda erişilebilir? Kullanıcıya sor (veya bağlamdan
bilgi varsa doğrudan kullan):

- **Tanımlı Figma (A)** — Figma dosyası, token'lar düzgün tanımlı: Token Studio/Figma
  variables ile isimlendirilmiş, yapılandırılmış
- **Tutarsız Figma (B)** — Figma dosyası var ama token'lar tanımsız/eksik/tutarsız:
  component'lar var ama renk/font/spacing değerleri doğrudan layer'lara
  hardcode edilmiş, isimlendirilmiş variable yok veya kısmi
- **Canlı Website (C)** — Figma yok, sadece canlı bir website/uygulama linki var
- **Ekran Görüntüsü (D)** — Figma yok, website yok, sadece ekran görüntüleri var

Birden fazlası olabilir (örn. hem eski bir Figma hem canlı site) — bu
durumda hepsini tara, çelişki varsa **canlı siteyi/uygulamayı** öncelikli
kaynak say (en güncel gerçek budur).

## Akış (kaynak tipine göre dallan)

### Tanımlı Figma (A) — Temiz Figma taraması
`get_variable_defs` ile component sayfalarını tek tek tara (Buttons,
Inputs, Cards vb.). Token'ları olduğu gibi çek.
→ **confidence: `verified`**

### Tutarsız Figma (B) — Figma var, token tanımsız/bozuk
Named variable yoksa `get_design_context` / `get_metadata` ile
component'ların ham stil değerlerini (fill rengi, font, spacing, radius)
doğrudan layer özelliklerinden oku. Benzer değerleri grupla (örn. birden
fazla yerde kullanılan aynı mavi tonu tek bir token adayı olur) ve
mantıklı isimlerle bir token seti **yeniden inşa et**. Kullanıcıya bunun
orijinal isimlendirme olmadığını, senin çıkarımın olduğunu belirt.

**Alt-durum — çakışan isimlendirme sistemleri:** Bazen token'lar
isimlendirilmiş VE tanımlıdır, ama **birden fazla çakışan sistem** bir
arada bulunur (örn. temiz bir `Colors/Brand/*` sistemi ile eski/artık
bir `d--colors/*`/`t--colors/*` sistemi aynı dosyada). Bunu tespit etmek
için: aynı component tipinin birden fazla instance'ını (örn. farklı
buton varyantlarını) ayrı ayrı `get_variable_defs` ile sorgula — **aynı
görsel değer** (örn. aynı 8px radius) farklı token isimleriyle
geliyorsa, bu bir tutarsızlık kanıtıdır. Raporda hangi component'lerin
hangi sistemi kullandığını somut örneklerle belirt ve hangi sistemin
"hedef/temiz" olduğunu öner (genelde daha anlamlı/okunaklı isimlendirme
taşıyan taraf), ama karar kullanıcıya bırakılır.
→ **confidence: `reconstructed`**

**Tam kapsam kuralı:** Bir örüntü birkaç örnekten netleşmiş gibi
görünse bile, kalan örnekleri doğrulamak ucuzsa (birkaç ek sorgu),
"pattern'e göre muhtemelen böyle" diye varsayımla bırakma — hepsini
kontrol et. Ucuz bir doğrulamayı atlayıp raporda "doğrulanmadı" notu
bırakmak, gereksiz bir belirsizlik kalıntısıdır.

### Canlı Website (C) — Website linki
**Önce CSS kaynak dosyalarını dene — DOM taramasından önce.** Sayfadaki
`<link rel="stylesheet">` etiketlerini listele (üçüncü parti/widget
CSS'lerini hariç tut), sitenin **kendi** CSS dosyasını bul ve doğrudan
oku (sayfaya `navigate` edip `get_page_text` ile — `web_fetch` bu URL'i
"görülmedi" diye reddedebilir, tarayıcı üzerinden okumak güvenilir).
Bu tek adım genelde onlarca DOM `computed style` sorgusundan daha
**ucuz** ve daha **kapsamlı** sonuç verir: gerçek spacing skalası
(utility class'lardan), tam renk paleti, component-özel radius/font
değerleri genelde doğrudan CSS'te görülür.
→ Bulunan değerler **confidence: `verified`** sayılır (DOM'dan tahmin
değil, kaynak koddan doğrudan okuma).

Dosya çok büyükse (100K+ karakter), baştan belirli bir bölüm okumak
yerine önce genel yapıyı gör (`utility class`'lar mı, component-özel
class'lar mı, CSS custom properties/`:root` var mı), sonra checklist
maddelerine karşılık gelen bölümlere odaklan.

**Kritik sınırlama — specificity/cascade:** Regex ile metin arama,
birden fazla kural **aynı görünen class'ı** hedeflediğinde hangisinin
gerçekten uygulandığını (CSS specificity/cascade) hesaplamaz — sadece
metni bulur. Örnek: `.foo.bar{color:#ccc}` ve `a.foo.bar{color:#000}`
aynı elementi hedefleyebilir, ama `<a>` elementinde ikincisi (daha
yüksek specificity) kazanır; regex arama ilk bulduğunu (yanlış olanı)
`verified` diye işaretleyebilir. Bunu önlemek için: bir class için
**birden fazla farklı kural** bulunursa (özellikle biri salt class
seçici, diğeri element+class gibi), bunu **kesin `verified` sayma** —
ya DOM'da gerçek bir elementte `getComputedStyle` ile doğrula (cascade'i
tarayıcı çözer, bu yöntem specificity'den etkilenmez) ya da bulguyu
"çelişkili kural, DOM doğrulaması önerilir" notuyla işaretle.

CSS dosyası minify edilmiş/anlamsız class isimleriyle (örn. Tailwind
gibi tek harfli utility'ler) ise veya hiç bulunamıyorsa, aşağıdaki DOM
tabanlı yönteme geç:

Siteyi incele (sayfa içeriği + görsel), renk/font/spacing değerlerini
CSS'ten veya görsel olarak çıkar. **Tek sayfa yeterli olmayabilir** —
"Temel Yeterlilik Kontrolü" listesi doluncaya kadar veya tarama limitine
ulaşana kadar ek sayfalara (nav linklerinden) geç (bkz. aşağıdaki iki
bölüm). Çerez bandını en gizlilik-dostu seçenekle kapat.

**Sayfa Seçimi — taramaya başlamadan önce sor.** Ana sayfa taraması
bitip ek sayfa gerektiği anlaşılınca (checklist eksikleri belli
olduğunda), hangi sayfaların taranacağına dalıp gitmeden önce kullanıcıya
sor: "Hangi sayfaları taramamı istersin?" Kullanıcı seçimi sana
bırakırsa, şu kritere göre öner ve seçimini kısaca gerekçelendir:
**checklist'teki hangi madde hâlâ eksikse, o maddeyi en olası
karşılayacak sayfa türünü seç** — örn. input/form eksikse İletişim/Arama
sayfası, kart+buton eksikse bir ürün listesi/kategori sayfası, segmented
control/tab eksikse filtre içeren bir liste sayfası. Aynı bilgiyi
tekrarlayacak sayfaları (iki benzer kategori sayfası gibi) önerme.

**Üçüncü parti widget filtresi:** Çerez onayı, canlı destek/chat widget'ı,
reklam/analytics banner'ı gibi elemanlar sitenin **kendi** marka sistemine
ait değildir — bunları palet/component çıkarımından hariç tut (id/class'ında
`cookie`, `consent`, `onetrust`, `chat`, `widget`, `banner-ad` gibi
kalıplar varsa o elemanı ve alt ağacını atla).
→ **confidence: `reconstructed`**

### Ekran Görüntüsü (D) — Sadece ekran görüntüleri
Sıfırdan tasarımın `inspiration` modundaki görsel analiz tekniğiyle aynı
yöntem kullanılır — ama etiket **`inspiration` değil `constraint`**
kalır, çünkü bu aspirational bir referans değil, sistemin şu anki
gerçek hali.

**Zorunlu — gözle tahmin etme, piksel örnekle.** Görsel dosya olarak
yüklendiyse (bash ile `/mnt/user-data/uploads/` altında erişilebiliyorsa),
renkleri **asla gözle tahmin etme** — Python/PIL (`Image.open` +
`Counter(im.getdata())` ile renk frekans histogramı, veya belirli bir
bölgeyi `crop` edip dominant rengi ölçme) ile **gerçek piksel
değerlerini ölç**. Bu, gözle tahminden köklü şekilde farklı sonuç
verebilir (bir testte gözle tahmin `#e8ff5c` iken ölçüm `#ffff99`
çıktı — tamamen farklı bir ton). Ölçülen değerler `confidence:
measured` (görsel tahminden daha yüksek, ama hâlâ CSS/DOM/Figma
`verified` seviyesinde değil — resim sıkıştırma/anti-aliasing payı var).
Sadece dosyaya erişilemiyorsa (yalnızca konuşma içinde gösterilen,
diske kaydedilmemiş bir görsel) `confidence: reconstructed` ile gözle
tahmine geri düşülür, ve bu açıkça belirtilir.
→ **confidence: `measured` (piksel örneklendiyse) veya `reconstructed`
(sadece gözle tahmin edildiyse)**, ve düşük örneklem varsa (örn. tek
bir ekran görüntüsü) bunu açıkça belirt.

## Temel Yeterlilik Kontrolü (C ve D için)
Tarama, aşağıdaki liste dolana kadar **veya** tarama limitine ulaşana
kadar (hangisi önce gelirse) devam eder. Liste:
- [ ] En az 1 dolgulu/birincil buton (bg + text + radius + padding)
- [ ] En az 1 input alanı (border + radius + placeholder rengi) — yoksa
  neden bulunamadığı not edilir (örn. sitede form yok)
- [ ] En az 1 tekrarlayan içerik bloğu (kart/liste öğesi)
- [ ] Spacing skalası için en az 3 farklı örnek ölçüm (padding/gap)
- [ ] Radius skalası için en az 2 farklı değer
- [ ] Renk paleti frekans analiziyle doğrulanmış (en az 2 sayfa/ekrandan)
- [ ] Tipografi: en az 2 heading boyutu + 1 body boyutu

Liste limit dolmadan tamamlanırsa tarama orada durur — gereksiz sayfa
gezmeye devam edilmez.

## Tarama Limitleri (kaynak israfını önlemek için)
- **Maksimum sayfa sayısı:** 3 (ana sayfa dahil)
- **Sayfa başına araç çağrısı:** en fazla 3 (1 navigate+screenshot birleşik
  + en fazla 2 hedefe yönelik JS extraction) — keşif amaçlı gezinme değil,
  doğrudan hedefe yönelik sorgu
- **Screenshot:** sadece görsel doğrulama gerektiğinde (örn. yeni bir
  component tipi tespit edilirken); her sayfada zorunlu değil, JS
  extraction genelde daha ucuz ve daha kesin
- **Sayfa başına durdurma kuralı:** sayfa checklist'e yeni bir şey
  katmıyorsa hemen bırak, aynı component tipini tekrar tekrar ölçme
- Limit dolduğunda liste tamamlanmamış olsa bile tarama durur; rapora
  **hangi maddelerin eksik kaldığı ve neden** (limit / sitede o
  component'in bulunmaması) açıkça yazılır — sessizce eksik bırakılmaz

**Limit doldu ama ilerlemek gerekiyorsa — kullanıcıya sor, sessizce
durma.** Rapor yazıp geçmek yerine, devam etmeden önce kullanıcıya durumu
bildir ve seçenek sun:
- Eğer hedeflenen component/sayfa **bulunamadığı** için ilerlenemiyorsa
  (örn. kart component'i site içinde denenen sayfalarda yoktu): kullanıcıya
  "Bu component'i [X] sayfalarında aradım ama bulamadım — bunun bulunduğu
  bir sayfanın linkini verebilir misin?" diye sor
- Eğer sadece **limit dolduğu** için durulduysa (component muhtemelen var
  ama bütçe bitti): "Şu ana kadar [Y] tamamlandı, [Z] hâlâ eksik — bir
  tarama turu daha yapmamı ister misin, yoksa bu haliyle devam mı edelim?"
  diye sor
- Eğer eksik olan şey **link veya taramayla erişilemeyecek bir durumsa**
  (örn. `:hover`/`:focus`/`:active` gibi bir etkileşim state'i, bir
  dropdown/modal açıkken görünen bir görünüm, ya da CSS'i parçalı/
  hash'li olduğu için hover kuralı bulunamayan bir site): kullanıcıya bu
  durumun ekran görüntüsünü göndermesini öner — "Bu component'in hover
  durumuna JS ile erişemiyorum, CSS'te de bulamadım. Elinle o duruma
  gelip (fareyle üzerine gelip) bir ekran görüntüsü paylaşabilir misin?"
  Bu, sıfırdan tasarımın `Ekran Görüntüsü (D)` kaynak tipiyle aynı
  mantıkla işlenir (görsel analiz, `reconstructed` confidence).
Kullanıcının cevabına göre ya ek bir tur (limitler sıfırlanarak) başlar,
ya verilen linkle hedefe gidilir, ya da eksik `TBD` bırakılıp devam edilir.

## Etiketleme — İki Boyutlu
Var olan sisteme ekleme senaryosunda üretilen her token iki etiket taşır:
- **Mode:** her zaman `constraint` (sistem zaten var, tercih değil)
- **Confidence:** `verified` (isimlendirilmiş variable'dan) veya
  `reconstructed` (görsel/kod incelemesinden çıkarım)

Bu ayrım sonraki adımlara taşınır: `token-generator`'ın erişilebilirlik
düzeltme önerisi sunarken, `reconstructed` token'lar için öneri daha
rahat sunulabilir (zaten kesin değil), `verified` token'lar için öneri
daha temkinli sunulmalı (bilinçli bir tasarım kararını değiştirebilir).

## Mimari Boşluk (context-scanner ile token-layer-builder arasındaki bağlantı)
Bazen eksik olan tek bir component/değer değil, **sistematik bir katman**
— tüm taranan component'lerde tutarlı şekilde aynı boşluk görülür (örn.
hiçbirinde isimlendirilmiş bir component token'ı yok, hepsi doğrudan
semantic'e bağlı). Bu, "taranamadı" veya "component sitede/dosyada yok"
kategorilerinden farklı — **kaynağın kendisi eksik/tamamlanmamış**.

Bunu tespit edince raporda ayrı bir bölüm olarak işaretle: **"Mimari
Boşluk"** — hangi katmanın sistematik olarak eksik olduğunu belirt, bunu
kendi başına doldurmaya kalkışma (sahte bir katman uydurma). Kullanıcıya
sor: **"Bu eksik [X] katmanını oluşturmamı ister misin?"** Evet gelirse
`token-layer-builder` skill'ini devreye sok.

## Çıktı
Bir "Mevcut Durum" raporu (`context-scan.md`):
- Kaynak tipi (A/B/C/D) ve hangi dosya/link/görsellerin tarandığı
- (C/D için) Temel Yeterlilik Kontrolü — hangi maddeler tamamlandı,
  hangileri eksik kaldı ve neden (limit mi, sitede yok mu)
- Çıkarılan token seti (mode: constraint, her token'da confidence etiketi)
- Component envanteri (hangi component'lar tespit edildi)
- Tutarsızlık notları (varsa — örn. aynı amaç için birden fazla mavi ton
  kullanılmış gibi bulgular)
- **Korunacaklar Envanteri** (aşağıda) — redesign veya ekleme sırasında
  onaysız değişmemesi gereken öğelerin listesi
- **Mevcut dial okuması** — sistemin bugünkü VARIANCE / MOTION / DENSITY
  tahmini (1-10, her biri tek satır gerekçeyle). Redesign'da başlangıç noktası budur.

### Korunacaklar Envanteri

Tarama sırasında aşağıdaki öğeleri **olduğu gibi** (yazımına dokunmadan) kaydet.
Bu liste kararı vermez — yalnızca envanter çıkarır; neyin korunacağını
`ads-impact-analysis` / `ads-import` tasarımcıya onaylatır.

| Tür | Ne kaydedilir | Kaynak tipi |
|---|---|---|
| URL / slug | Taranan sayfaların yolları (`/bireysel/krediler`) veya HTML dosya adları | C, HTML |
| Nav etiketleri | Ana menü ve footer menüsündeki etiketler, sırasıyla | A, B, C, D, HTML |
| Form alanları | Her formun alan `name`/etiketleri ve sırası | C, HTML (A/B/D'de yalnızca etiketler) |
| Logo / wordmark | Logo dosyası/node'u, kullanım biçimi | Hepsi |
| Yasal metinler | KVKK, çerez, aydınlatma, sözleşme metinleri ve linkleri | C, HTML, D |
| Analytics bağları | `id`, `data-track*`, `data-gtm*`, `data-analytics*` gibi özellikler | C, HTML |
| A11y kazanımları | Mevcut focus stilleri, alt metinler, skip-link, ARIA yapısı | C, HTML |

Toplanamayan türleri "taranamadı — [neden]" olarak işaretle; boş bırakıp
"yok" anlamına gelecek şekilde raporlama.

## Doğrulama (opsiyonel — yapmadan önce sor)
Çıkarılan token'ların doğruluğunu artırmak için iki yöntem birleştirilebilir:
1. **Çapraz doğrulama:** Aynı değer birden fazla bağımsız yöntemle
   (CSS kaynak dosyası + DOM computed-style) teyit edildiyse bunu
   raporda belirt — bu zaten C akışının normal bir parçası, ayrı bir
   adım gerektirmez.
2. **Standart Showcase Sheet:** Çıkarılan token'larla, her projede
   **aynı sabit şablonu** kullanan bağımsız bir HTML doğrulama sayfası
   üretmek — canlı siteye overlay inject etmek yerine.

**Neden overlay değil, sabit şablon:** Canlı sayfaya mockup inject edip
yan yana karşılaştırma denendi (Kalekim, Sartorius testleri) — sorunlu
çıktı: gerçek sayfada aynı component'in birden fazla varyantı olabiliyor
(örn. header'daki arama kutusu ile bir form alanı görsel olarak farklı
ama ikisi de "input"), overlay hangi varyantla karşılaştırıldığını
belirsiz bırakıyor ve yanlış eşleşmeye yol açabiliyor. Sabit bir şablon
bu belirsizliği ortadan kaldırıyor: her zaman aynı temel component
seti ve aynı renk düzeni gösteriliyor, karşılaştırma canlı sayfaya değil
**tutarlılığa ve iç mantığa** (renkler birbiriyle uyumlu mu, kontrast
yeterli mi, component'lar birbiriyle tutarlı mı) bakılarak yapılıyor.

**Şablon (her projede aynı bölümler, sadece token değerleri değişir):**
- Renk Paleti (bulunan tüm primitive/semantic renkler, isim + hex ile)
- Tipografi (heading + body örnekleri)
- Button (varsa bulunan varyantlar: primary/secondary/CTA) — **hover/
  focus/disabled gibi interaction state'ler bulunduysa gerçek CSS
  `:hover`/`:focus` olarak showcase'e eklenir** (statik renk bilgisi
  olarak değil, kullanıcı fareyle üzerine gelince canlı görebilsin diye)
- Input (varsa — hangi context'ten geldiği not edilir, örn. "form
  input, header search değil"; focus state'i varsa dahil edilir)
- Card/Tile (varsa)
- Bulunamayan/eksik component'ler için boş bir "not found" notu (görsel
  boşluk değil, açık metin)

**Interaction state arama:** Token toplarken (ads-context-scanner-worker),
sadece default state değil, CSS'te aynı sınıfın `:hover`, `:focus`,
`:disabled`, `:active` varyantlarını da ara. Bulunursa token dosyasına
ayrı bir `hover`/`focus` alt-alanı olarak eklenir ve showcase'e gerçek
CSS pseudo-class olarak yansıtılır. Bulunamazsa sessizce atlanmaz —
"interaction state bulunamadı/aranmadı" notu düşülür.

Bu, token seti çıktıktan sonra kullanıcıya sorularak üretilir: "Token'lar
için standart bir showcase sheet oluşturayım mı?" Otomatik yapılmaz.

Bu rapor tamamlandıktan sonra `impact-analysis`'in etki analizi sorularına
geçilir (etki analizi: yeni çalışma sisteme nasıl uyuyor, hangi
ekranları etkiliyor, tutarlılık kısıtları).

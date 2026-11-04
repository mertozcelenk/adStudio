# Rapor Bölümleri

Kullanıcı aksini söylemedikçe aşağıdaki 15 bölüm bu sırayla yer alır. Konuya özel bir başlık gerekiyorsa ilgili yere eklenir (ör. "Fiyatlandırma", "Ödeme altyapısı", "Erişilebilirlik"). Bölüm numaraları eyebrow olarak yazılır (`1 · Pazar görünümü`); yönetici özeti ve kaynaklar numarasızdır.

Her bölümde: veriler numaralı kaynak etiketi taşır, doğrulanamayan veriler etiketlenir, şablondaki bileşenler kullanılır (bkz. `market-report-template.html`).

---

## Başlık alanı
- Eyebrow: "Pazar araştırması · <iş modeli>"
- `<h1>`: rapor adı, 2–4 kelime (ör. "Akaryakıt Sadakat Pazar Raporu")
- Tek cümlelik amaç; çıkarılan hedef kitleyi de içerir (ör. "… için, [hedef kitle] odağında")
- Meta: tarih · yöntem (masa başı araştırma) · "Numaralı etiketler sayfa sonundaki kaynaklara gider"
- İçindekiler: bölümlere anchor linkler

## Yönetici özeti
5–7 madde. Her madde kalın bir tespitle başlar, ardından 1–2 cümle açıklama ve kaynak. Şu iki madde zorunludur:
- **Hedef kitle:** analizden çıkarılan birincil kitle ve tek cümlelik gerekçe (bölüm 6).
- **Neden biz:** kullanıcının ürünü rakiplere karşı neden tercih edeceği, tek cümlede (bölüm 8).

Son madde önerilen tasarım/ton yönünü tek cümlede verir.

## 1 · Pazar görünümü
- **Rakam şeridi** (`.pump` bileşeni): 3–4 anahtar gösterge (pazar büyüklüğü, oyuncu/şube sayısı, kullanıcı tabanı, büyüyen alt segment). Her biri birim + açıklama + kaynak.
- **Pazar payı çubuk grafiği** (`.bars`): lider vurgu rengiyle, ölçek etiketli. Veri yoksa bu bileşeni atla.
- **Tasarım için önemli veriler**: kullanıcı tabanının yapısı, büyüme yönleri.

## 2 · Mevzuat ve kısıtlar
- `.rule` bloğu: yürürlük tarihi, izin verilenler, yasaklar.
- "Tasarıma etkisi" paragrafı: kural → arayüz/metin sonucu.
- Haber kaynaklıysa "Teyit" notu: resmi metin hukuk ekibiyle okunmalı.
- İlgili mevzuat bulunamazsa bunu açıkça yaz; bölümü silme.

## 3 · Rakip analizi
### 3a. Özellik varlık matrisi
- Üstte sayım özeti şeridi: "8 markadan 6'sında araçta ödeme var" gibi 3–4 ifade.
- Tablo: satırlar 10–14 özellik, sütunlar rakipler. Hücre değerleri: `✓` (var, kaynaklı), `–` (yok, kaynaklı), `?` (doğrulanamadı). Her ✓ / – için kaynak numarası hücrede veya satır sonunda.
- Özellikler konuya göre seçilir; kullanıcının rakip notlarında geçen konular mutlaka satır olur.

### 3b. Marka kartları (her rakip için standart)
| Alan | İçerik |
|---|---|
| Ölçek | Pazar payı / şube / kullanıcı sayısı |
| Program / ürün | Adı |
| Temel mekanik | Ör. puan kazanma oranı ve değeri |
| Kanallar | iOS / Android / web |
| Ödeme ve tanıma | Ör. QR, plaka, araçta ödeme |
| Ekosistem | Ortaklıklar |
| Hedef kitle | Rakibin kimi hedeflediği: kampanya dili, mesajlar, hedef segment, yorum yapanların profili. Kaynaklı; çıkarımsa `Hipotez` |
| Mağaza puanı | Doğrulanabildiyse, değerlendirme sayısıyla |
| Odak | Yalnızca kullanıcı not verdiyse: notun konusu ve bulgular |

"Eklendi" rakiplerin kartı kısa tutulur ve etiketlenir.

### 3c. Kullanıcı yorumlarından artı / eksi
Her yerel rakip için 2–3 artı, 2–3 eksi. Kaynak: mağaza yorumları, şikâyet platformları, forumlar. Kategori genelinde tekrar eden şikâyetler ayrıca listelenir.

## 4 · Uygulamalar
Tablo: Marka · Uygulama adı · Mağaza linki (App Store / Google Play) · Not (puan, işlev). Doğrulanamayan linkler "Teyit" etiketli; bulunamayanlar not satırında belirtilir.

## 5 · Global örnekler
- `.grid2` kartları: etiket (bölge · ölçek) → başlık → 2–3 cümle → kaynak.
- "Sektör verileri" listesi (üyelik oranları, davranış istatistikleri); ikincil kaynaksa belirt.

## 6 · Hedef kitle ve kullanıcılar
Hedef kitle kullanıcıya sorulmaz; rakip analizinden ve pazar verisinden çıkarılır.

### 6a. Hedef kitle
- **Rakiplerin hedeflediği kitleler:** tablo: Rakip · Hedeflediği kitle · Dayanak (kaynaklı; marka kartlarındaki "Hedef kitle" satırından).
- **Boşta kalan / şikâyetçi segment:** rakiplerin hizmet etmediği ya da yorumlarda memnuniyetsiz görünen kitle; yorum ve pazar verisine bağlı.
- **Önerilen hedef kitle:** birincil ve ikincil kitle + tek paragraf gerekçe (hangi bulgulardan çıktığı, kaynaklı). `Hipotez` etiketi taşır.

### 6b. Personalar
"Hipotez" etiketiyle 3–4 persona kartı: etiket (hacim · sıklık) → ad → motivasyon, ihtiyaç, kaybettiren şey. Personalar önerilen hedef kitleye bağlanır; birincil kitle en az bir persona ile temsil edilir.

## 7 · Fırsatlar
- Tablo: Fırsat · Neden (bulguya ve kaynağa bağlı).
- Konuya özgü mekanik önerisi (ör. puan değeri, kazanım oranı, son kullanma) madde listesi.

## 8 · Konumlandırma ("Neden biz")
Bu bölüm "Kullanıcı bu ürünü rakiplere karşı neden tercih etsin, rakiplerden neyi daha iyi yapabiliriz?" sorusuna cevap verir. Kullanıcıdan şirket avantajları istenmez; her gerekçe araştırma bulgularına (rakip boşluğu, tekrar eden şikâyet, matristeki eksik) dayanır. Kaynaksız gerekçe yazılmaz.
- **Neden bizi tercih etsinler:** 3–5 gerekçe kartı (`.grid2`): kalın gerekçe → dayandığı rakip boşluğu veya şikâyet → kaynak numarası.
- **Rakiplerden daha iyi yapabileceklerimiz:** tablo: Rakip zayıflığı / şikâyet (kaynaklı) · Rakiplerde bugünkü durum · Bizim cevabımız · Kopyalanabilirlik (Kolay / Orta / Zor). Kopyalanması kolay avantajlar ayrıştırıcı sayılmaz; bu satırlarda nedeni kısaca belirtilir.
- **Masada olması gerekenler:** rakiplerin çoğunda standart olan özellikler; eksik olursa ürün tercih edilmez. Matristen sayıyla yaz ("8 markadan 7'sinde QR ile ödeme var").
- **Konumlandırma cümlesi** (`.pos` bileşeni): "[Hedef kitle] için, [ihtiyaç] isteyenlere [ürün] [fayda] sağlar; [ana rakip]'ten farklı olarak [ayrıştırıcı]." `Hipotez` etiketi taşır.
- Not: "Gerekçeler masa başı araştırmadan çıkarıldı; kurum içi varlıklarla (marka, şube ağı, kullanıcı tabanı, teknoloji) ve kullanıcı görüşmeleriyle doğrulanmalı."

## 9 · Tasarım dili
- Not: Uygulama mevcut bir markaya aitse renk/logo/yazı tipi kurumsal kimlikten gelir; bölüm bunun dijitale nasıl taşınacağını önerir.
- **Rakip ekran gözlemleri:** 4–6 kart (ekranlar `ads-research-worker` ile toplanır), her biri kaynak etiketi ve linkle.
- **Tasarım ilkeleri:** 4–6 madde, her biri kalın bir ilke + kısa açıklama.
- **Görsel dil tablosu:** Renk · Tipografi · İkonografi · Görsel · Hareket · Yerel biçimler (para, tarih, ölçü birimleri, konuya özel yerel bileşen).
- **Ana ekran anatomisi:** sıralı tablo (Sıra · Bölüm · İçerik) + sekme çubuğu önerisi.

## 10 · Tone of voice
- **Rakiplerin dili:** 3–4 gözlem, gerçek ifade örnekleri ve kaynaklarıyla.
- **Önerilen ses:** bir adı olan ses ("Hesabı açık yol arkadaşı") + 4 özellik (`.voice` bileşeni).
- **Ton ayarı:** 4 skala (`.dial`): Resmî–Samimi, Ciddi–Eğlenceli, Sade–Coşkulu, Genel–Kesin. Altında anlara göre tonun nasıl değiştiği.
- **Anlara göre örnek metinler:** 6–8 satır, "Böyle yaz / Böyle yazma" (`.say` bileşeni). Anlar konuya göre: bakiye, kampanya, bekleyen işlem, hata, son kullanma, seviye/başarı, ödül kullanma.
- **Kelime listesi:** Kullan · Kullanma · Neden.
- "Hipotez" notu: markanın mevcut diliyle hizalanmalı, kullanıcı testinde alternatiflerle karşılaştırılmalı.

## 11 · MVP
- `.pri` üç kart: Must (ilk sürüm) · Should (kısa vade) · Could (sonraki sürümler).
- "Kaçınılacak UX hataları" listesi (şikâyet ve yorum bulgularından).

## 12 · Bulgu → karar
Tablo: Bulgu (kaynaklı) · Karar · Etkilenen bölüm (hedef kitle / konumlandırma / MVP / tasarım dili / ton / mekanik). Raporun her önemli önerisi burada bir bulguya bağlanır.

## 13 · Sonraki adımlar
Sıralı tablo: Adım · Ne yapılır · Çıktı. Varsayılan sıra:
1. Eksik verileri tamamlama (Teyit etiketliler)
2. Rakip uygulamaları kurup akışları ekran ekran inceleme ("Görsel yok" olan rakipler önce)
3. Kullanıcı görüşmeleri: hedef kitlenin ve "neden biz" gerekçelerinin doğrulanması
4. Marka atölyesi: ses ve ton
5. Moodboard ve görsel dil denemeleri
6. Tasarım token'ları ve temel bileşenler
7. Ana akışların wireframe / prototipi
8. Kullanılabilirlik testi
Çalışmayan bağlantılar (ör. Mobbin) burada not edilir.

## Kaynaklar
`<ol>` listeleri gruplu (Pazar ve mevzuat · Rakipler · Global ve sektör · Uygulama mağazaları · Ekran örnekleri · Diğer). Numaralar gruplar arasında kesintisiz devam eder (`<ol start="9">`). Her `<li>` `id="kN"` taşır; metindeki etiketler bu id'ye gider.

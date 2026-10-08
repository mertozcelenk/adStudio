---
name: ads-impact-analysis
description: `context-scanner`'ın "mevcut durum" raporu (context-scan.md) tamamlandıktan SONRA çalışır. Var olan bir sisteme eklenecek yeni component/ekran/modül için etki analizi sorularını sorar ve bir extension-spec üretir. "Var olan sisteme X ekleyelim", "bu sayfaya Y component'i çalışalım" gibi taleplerde, context-scan bittikten sonra tetiklenir. context-scan henüz yoksa önce context-scanner çalıştırılmalı.
---

# Impact Analysis (Var Olan Sisteme Ekleme — spec-intake karşılığı)

## Doğrulama İlkesi — Hiçbir Şeyi Varsayma
Yeni component'in mevcut sistemle ilişkisini (varyant mı/yeni tip mi,
hangi token'lar geçerli) varsayarak spec'e yazma — context-scan'de net
değilse kullanıcıya sor veya "doğrulanmadı" diye işaretle.

## Amaç
`context-scanner`'ın çıkardığı "mevcut durum" envanterini temel alarak,
yeni eklenecek çalışmanın var olan sisteme **nasıl uyacağını** netleştirmek
ve bir `extension-spec.md` üretmek. Sıfırdan tasarımın `spec-intake`'inden farkı:
burada "sıfırdan mı kurulacak" diye sorulmaz — sistem zaten var, soru
"yenisi buna nasıl uyacak".

## Ön Koşul
Bir `context-scan.md` (veya en azından bir kaynak tipi + temel bir token/
component envanteri) mevcut olmalı. Yoksa önce `context-scanner`'ı çalıştır.

## Sorular (küçük gruplar halinde sor, tek seferde boğma)

### 0. Çalışma Modu

Önce çalışmanın tipini belirle. Kullanıcının isteğinden net anlaşılıyorsa sorma, beyan et;
belirsizse **tek soru** sor:

> "Bu çalışma hangisi?
> `[ ] Ekleme` — mevcut sisteme yeni bir parça ekliyoruz, var olan görünüm değişmiyor
> `[ ] Redesign – Koruyarak` — mevcut markayı koruyup kademeli modernleştiriyoruz
> `[ ] Redesign – Baştan` — görsel dil yenileniyor, içerik ve sayfa yapısı korunuyor"

**Korunacaklar onayı (her üç modda):** context-scan'deki "Korunacaklar Envanteri"ni
kullanıcıya göster:

> "Mevcut sistemde şunları tespit ettim. Bunlar onayınız olmadan değişmeyecek:
> - Nav etiketleri: [liste]
> - Sayfa yolları: [liste]
> - Form alanları: [form → alanlar]
> - Logo, yasal metinler, analytics bağları: [özet]
>
> Listeden çıkarmak veya eklemek istediğiniz bir şey var mı?"

Onaylanan listeyi:
- `spec.md` varsa → `## Bağlayıcı Kararlar` bölümüne her madde için
  `- [Tarih] [Korunan] [tür]: [değer] — [neden]` satırı olarak ekle
- `spec.md` yoksa → extension-spec'in `## Korunacaklar` bölümüne yaz; spec.md
  oluşturulduğunda (`ads-spec-intake` / `ads-import`) Bağlayıcı Kararlar'a taşınır

**Redesign – Koruyarak modunda modernizasyon kapsamı** — şu sırayla ilerlenir, istek
karşılandığında durulur. Kullanıcıya hangi adıma kadar gidileceğini sor:

> "Modernizasyon en az riskliden başlayarak ilerler. Hangi adıma kadar gidelim?
> 1. Tipografi  2. Boşluk ve ritim  3. Renk ayarı (marka accent'i korunur)
> 4. Hareket / mikro etkileşimler  5. Hero ve ana section'ların yeniden kurgusu
> 6. Kurtarılamayan blokların tamamen değiştirilmesi"

Cevabı extension-spec'e `Modernizasyon kapsamı: 1-[n]` olarak yaz.

**Redesign – Baştan modunda** görsel katman serbesttir; içerik, bilgi mimarisi ve
Korunacaklar listesi yine korunur.

### 1. Yeni Çalışmanın Tanımı
- Ne ekleniyor (component/ekran/modül) — kısa tanım
- Amacı ne, hangi ihtiyacı karşılıyor

### 2. Yerleşim
- Var olan bilgi mimarisinde **nereye** ekleniyor (hangi sayfa/section)
- Sayfadaki diğer element'lere göre konumu (üstte/altta/yanında vb.)

### 3. Mevcut Sistemle İlişki
- Bu, var olan bir component tipinin **varyantı mı** yoksa **tamamen yeni
  bir tip mi**? (örn. "kart component'inin bir türü" vs "hiç olmayan bir
  şey")
- context-scan'deki hangi component'lere görsel/yapısal olarak benziyor
  (varsa)

### 4. Tutarlılık Kısıtları
- context-scan'deki `constraint` etiketli token'lardan hangileri bu yeni
  component için **zorunlu** (renk, tipografi, radius, spacing) —
  varsayılan: hepsi zorunlu, sapma varsa kullanıcı açıkça belirtmeli
- **Bunu soru olarak sorma** — "constraint'lerden sapmak ister misin?"
  gibi bir soru yöneltme. Varsayılan olarak tüm constraint'lerin
  uygulanacağını kabul edip devam et. Kullanıcı kendiliğinden bir sapma
  isterse (örn. "bu component'te farklı bir radius kullanalım") o zaman
  ele alınır — ama bu seçenek proaktif olarak sunulmaz.
- Yeni bir token/değer gerekiyorsa (context-scan'de karşılığı yoksa) bunu
  ayrı bir "Yeni İhtiyaçlar" listesine ekle, mevcut sistemi genişletmiş ol

### 5. İçerik/Veri
- Component'in göstereceği içerik tipi ve kaynağı (statik metin mi,
  dinamik veri mi, kaç öğe gösterilecek vb.)

### 6. Başarı Kriteri
- Bu ekleme ne zaman "bitti" sayılır

## Cevaplanmayan Alanlar
`spec-intake`'teki kuralla aynı: atlanan bir alanı hemen ısrarla sorma,
bir sonraki soru grubuyla birlikte nazikçe hatırlat; yine cevap gelmezse
`TBD` işaretleyip devam et.

**"Açık Sorular / TBD" bölümüne sahte madde ekleme.** Bu bölüm sadece
kullanıcıya **gerçekten sorulmuş ama cevaplanmamış** alanları içerir.
Spec'i derlerken aklına yeni bir soru gelirse (örn. "manuel kaydırma
olacak mı" gibi bir detay hiç sorulmamış), bunu sessizce TBD listesine
ekleyip geçme — **o an kullanıcıya gerçekten sor**, cevabı bekle, spec'i
ondan sonra tamamla. TBD, "sorulmuş gibi görünen ama sorulmamış" bir
madde için kullanılmaz.

## Çıktı Formatı

```markdown
# [Proje] — Extension Spec: [Yeni Çalışmanın Adı]

## Kaynak Context Scan
[context-scan.md'ye referans / özet]

## Çalışma Modu
Ekleme | Redesign – Koruyarak | Redesign – Baştan
Modernizasyon kapsamı: 1-[n]   ← yalnızca Redesign – Koruyarak

## Korunacaklar
[Yalnızca spec.md yoksa — onaylanmış [Korunan] maddeler. spec.md varsa
"Bağlayıcı Kararlar'a yazıldı" notu yeterli.]

## Yeni Çalışmanın Tanımı
...

## Yerleşim
...

## Mevcut Sistemle İlişki
- Varyant mı / yeni tip mi: ...
- Benzer component'ler: ...

## Tutarlılık Kısıtları (constraint, context-scan'den)
- [token listesi]

## Yeni İhtiyaçlar (context-scan'de karşılığı olmayan)
...

## İçerik/Veri
...

## Başarı Kriteri
...

## Açık Sorular / TBD
...
```

Bu spec tamamlandıktan sonra `token-generator`'a (constraint modunda,
context-scan'deki token'larla) veya doğrudan component üretimine geçilir.

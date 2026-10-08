---
name: ads-token-layer-builder
description: Bir design system'de eksik/kurulmamış bir token katmanı tespit edildiğinde (örn. component katmanı hiç yok, hiç token tanımlanmamış, veya var olan katmanlarda kısmi boşluklar var) bu katmanı öneri/taslak olarak inşa etmek için kullanılır. context-scanner veya token-generator "Mimari Boşluk" tespit ettiğinde tetiklenir. ASLA otomatik çalışmaz — önce kullanıcıya bu katmanı oluşturmak isteyip istemediği sorulur.
---

# Token Layer Builder

## Amaç
Bir design system'in eksik/tamamlanmamış token mimarisini (component
katmanı yok, hiç token yok, veya kısmi boşluklar var) **öneri/taslak**
olarak tamamlamak. Bu skill **asla var olan tasarım sistemine (Figma'ya)
otomatik yazmaz** — çıktısı her zaman inceleme/onay için bir taslak
dokümandır, gerçek sisteme işlenmesi ayrı ve manuel bir adımdır.

## Doğrulama İlkesi — Hiçbir Şeyi Varsayma
Bir component grubunda gözlemlenen bir örüntüyü (örn. "tüm hover
state'leri aynı davranıyor") geri kalanları tek tek kontrol etmeden
kesinmiş gibi öneriye yazma. Doğrulaması mümkünse (ek `get_variable_defs`
sorgusu, screenshot karşılaştırması) doğrula; mümkün değilse açıkça
"doğrulanmadı" diye işaretle.

## Ne zaman tetiklenir
`context-scanner` veya `token-generator` bir "Mimari Boşluk" tespit
ettiğinde (beklenen bir katman/yapı taranan tüm component'lerde tutarlı
şekilde eksik). Bu skill kendiliğinden başlamaz.

## 0. Önce sor — asla otomatik başlama
Boşluk tespit edildiğinde kullanıcıya doğrudan sor: **"Bu eksik [X]
katmanını oluşturmamı ister misin?"** Hayır cevabı gelirse boşluk
sadece raporda bir not olarak kalır, bu skill devreye girmez.

## 1. Boşluk Tipini Belirle
- **Component Katmanı Eksik** — semantic katman var, component'ler
  ona doğrudan bağlı, isimlendirilmiş bir component token seti yok
  (GSK 2.0 örneği)
- **Hiç Token Yok** — ne primitive ne semantic tanımlı, sadece ham
  style değerleri var
- **Kısmi Boşluk** — bazı katmanlar/bölümler var ama eksik parçalar
  içeriyor (örn. semantic'te error state'leri var ama success yok)

**Hiç Token Yok durumunda bu skill'i kendi mantığınla yeniden yazma** —
`context-scanner`'ın **B modunu** (Figma var, token tanımsız/bozuk)
çağır/uygula; o zaten style'ları component'lerle eşleştirip bir token
seti kuruyor. Bu skill sonrasında sadece **component katmanını** (varsa
hâlâ eksikse) üzerine ekler.

## 2. Kapsam — Sadece Fundamental Component'lerle Başla
Tüm component'leri taramaya kalkma. Önce **fundamental/temel**
component'lerle sınırlı tut (Button, Input, Tab, Navigation gibi en
sık kullanılan, en temel yapı taşları — 🚧/WIP işaretli olanları
dahil etme). Bunlar tamamlandıktan sonra kullanıcıya sor: **"Fundamental
component'ler için taslak hazır. Kalan component'leri de aynı şekilde
işleyeyim mi?"** Evet gelirse bir sonraki grup component'e geç, aynı
soru-cevap döngüsüyle ilerle — tüm sistemi tek seferde taramaya kalkma.

## 2b. Component Envanteri — İşe Başlamadan Önce Çıkar
Herhangi bir component'e girmeden önce, `get_metadata` ile dosyanın
**tüm sayfa/component listesini** çıkar ve bir envanter dosyası
(`[proje]-component-envanteri.md`) oluştur: her component için ✅
Tamamlandı / ⏳ Bekliyor / 🚧 WIP (dahil edilmeyecek) durumu. Bu dosya
**oturumlar arası ilerleme takibi** için — her component işlendiğinde
bu dosya güncellenir, böylece "hangisini yaptık hangisi kaldı" her
zaman tek bakışta görülür. Kullanıcıya envanteri gösterip hangi
sırayla ilerlemek istediğini sorabilirsin, ama varsayılan sıralama
önerisi: en temel/en çok kullanılan component'ler önce.

## 3. Component Katmanı İnşası (Component Katmanı Eksik durumu)
**Yöntem notu:** `get_design_context` Code Connect bağlı değilse
çalışmayabilir. Bu durumda component'in **her state'ini (Selected,
Hover, Pressed, Disabled vb.) ayrı ayrı** `get_variable_defs` ile
sorgula — bu, tüm component sayfasını tek seferde taramaktan daha
kesin sonuç verir, çünkü her sorgu sadece o spesifik state'in
kullandığı değişkenleri döndürür, state'ler birbirine karışmaz.

Her fundamental component için:
- Component'in kullandığı semantic token'ları tespit et (`get_variable_defs`
  ile zaten yapılıyor)
- Bu bağlantıyı **isimlendirilmiş bir component token'ına** dönüştür:
  örn. Tab component'i `Surface/Accent/Surface-accent-100`'ü seçili
  durumda arkaplan için kullanıyorsa → öner:
  `Component/Tab/background-selected` → `{Surface.Accent.Surface-accent-100}`
- **İsimlendirme kaynağı sistemin kendisi olmalı** — hedef sistemin
  (`GSK`, `Surface/Text/Icon/Stroke`) isimlendirme kuralına uy, referans
  token dosyamızın (`design-tokens.json`) isimlendirmesini KOPYALAMA.
  Referans dosya sadece **mimari şablon** (katmanlama mantığı, hangi
  component'lerin hangi alt-token tiplerine ihtiyaç duyabileceği) için
  kullanılır, isim/değer için değil.
- Her state için (default, hover, selected, disabled — varsa) ayrı
  token öner

## 4. Hiç Token Yoktan İnşa (Hiç Token Yok durumu — context-scanner Tutarsız Figma moduna devret)
Bu skill kendi başına çalışmaz; `context-scanner`'ın B modu (stil→token
yeniden inşası) tamamlandıktan sonra, ortaya çıkan semantic katmanın
üzerine gerekirse 3. adımdaki component katmanı mantığı eklenir.

## 5. Kısmi Boşluk Doldurma (Kısmi Boşluk durumu)
Sadece eksik olan bölümleri hedefle — var olan token'ları yeniden
üretme/değiştirme. Eksik bölümü, sistemin kendi isimlendirme ve değer
mantığına (örn. var olan bir renk skalasının aynı adım aralığı) uyarak
doldur; yeni bir primitive değer gerekiyorsa (örn. yeni bir semantic
renk için karşılık gelen primitive yoksa) bunu açıkça belirt ve öner,
sessizce uydurma.

## Doğrulama (önerilir — her component grubu sonunda)
Component'in Figma'daki gerçek render'ını `get_screenshot` ile çek
(mümkünse tüm state'leri gösteren bir frame/instance seç) ve önerilen
token eşlemesiyle **state state** karşılaştır: görüntüde her state için
gözlenen değer, öneride o state'e atanan token'la tutarlı mı? Bu
karşılaştırmayı öneri dokümanına bir tablo olarak ekle. Bu, özellikle
`get_design_context` çalışmadığı durumlarda (Code Connect bağlı değilken)
state-bazlı `get_variable_defs` sorgularının doğruluğunu teyit etmenin
ucuz ve güvenilir bir yolu.

## Çıktı Formatı
`[proje]-token-layer-proposal.md`:
```markdown
# [Proje] — Eksik Token Katmanı Önerisi

## Tespit Edilen Boşluk
[a/b/c, hangi katman, hangi component'lerde gözlemlendi]

## Kapsam (bu turda işlenen component'ler)
[fundamental component listesi]

## Önerilen Yeni Token'lar
| Token Adı (hedef sistem kuralına göre) | Referans Verdiği Semantic/Primitive | Kullanıldığı Component | Not |
|---|---|---|---|
...

## Yeni Primitive/Semantic İhtiyacı (varsa)
[eğer mevcut katmanlarda karşılığı olmayan bir değer gerekiyorsa]

## Uygulama Notu
Bu bir ÖNERİDİR — Figma'ya otomatik yazılmadı. Onaylanırsa tasarım
ekibi tarafından Variables'a manuel/ayrı bir süreçle işlenmeli.

## Sıradaki Component Grubu
[kullanıcıya sorulacak: devam edilsin mi]
```

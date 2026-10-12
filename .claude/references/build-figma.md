# Üretim — Figma çıktısı

`ads-design-builder` yalnızca **Figma** işinde bu dosyayı okur (HTML işinde `build-html.md`). Kuralların kendisi ve
seviyeleri `references/rules.md`'dedir; bu dosya Figma'da nasıl uygulanacağını anlatır. Plugin API ayrıntısı:
`figma-use` skill'i (`use_figma` çağrısından önce yüklenir).

---

## Bağlantı kontrolü (Adım 0)

**Figma seçildiyse — önce çizim aracının varlığını kontrol et:**

Kullanabildiğin araçlar arasında `mcp__plugin_figma_figma__use_figma` var mı? Yoksa okuma testine geçme ve HTML'e
kendiliğinden düşme — dur ve şunu döndür:

> "Figma çizim aracı (`mcp__plugin_figma_figma__use_figma`) bu oturumda yok. Olası nedenler:
> - Figma eklentisi kurulu değil ya da giriş yapılmamış (Claude Code'da `/mcp` → figma → Authenticate)
> - Eklenti güncellendi ve bağlantının adı değişti — agent'ın `tools:` satırı yeni adla güncellenmeli
>
> `[ ] Düzelttim, tekrar dene`
> `[ ] HTML/CSS olarak devam et`"

Okuma aracı çalışsa da çizim aracı yoksa Figma'ya hiçbir şey yazılamaz; bu kontrol bu yüzden okuma testinden önce gelir.

**Sonra bağlantıyı test et:**

`mcp__figma-desktop__get_metadata` ile iletilen Figma dosya linkini kullanarak okuma denemesi yap.

- **Başarılıysa:** Figma Desktop ve eklenti çalışıyor. `use_figma` ile yazmaya geç.
- **Başarısızsa:** Dur ve kullanıcıya sor:

> "Figma dosyasına ulaşılamadı. Olası nedenler:
> - Figma Desktop açık değil
> - Claude Code eklentisi kurulu değil (`Plugins → Claude Code`)
> - Claude Code ayarlarında Figma MCP sunucusu etkin değil
>
> `[ ] Figma hazır, tekrar dene`
> `[ ] HTML/CSS olarak devam et`"

Tekrar dene seçilirse `mcp__figma-desktop__get_metadata` ile bir kez daha dene.
Yine başarısızsa kullanıcıya şunu sun:

> "İki denemede de Figma'ya ulaşılamadı. Şunları kontrol edebilirsiniz:
> 1. Figma Desktop'u kapatıp yeniden açın
> 2. Figma'da `Plugins → Claude Code` eklentisini çalıştırın
> 3. Claude Code ayarlarında Figma MCP sunucusunun etkin olduğunu doğrulayın
>
> `[ ] Sorun çözüldü, tekrar dene`
> `[ ] HTML/CSS olarak devam et`"

Kullanıcı istediği kadar deneyebilir — her "tekrar dene" seçiminde `mcp__figma-desktop__get_metadata` ile bir deneme daha yap.
HTML seçilirse devam et.

---

## Bileşen kaynağı (uygulama ekranları)

- `component_source: kit` → bileşenleri `search_design_system` ile dosyaya eklenmiş iOS UI Kit / Material 3 Kit'te
  bul, instance olarak yerleştir, marka token'larıyla temala. Kit bulunamazsa dur ve kullanıcıya hatırlat — sessizce çizime geçme.
- `component_source: own` → mevcut kütüphaneyi kullan; ölçü ve davranış kuralları yine geçerli.
- `component_source: drawn` → bileşenleri platform ölçü ve davranışına uygun çiz, component adını platform adıyla ver
  (`iOS/Switch`, `M3/FilledButton`).

## Platform ikonları (uygulama ekranları)

SF Symbols / Material Symbols eklenti ortamında çizilemez (SF Pro ile aynı neden). `spec.md → icon_figma`:
- `library` → ikonları dosyadaki kütüphaneden (`search_design_system` ya da dosyadaki component'ler) instance olarak kullan.
  Kütüphanede bulunamayan ikon için aşağıdaki yer tutucu kuralı geçerli.
- `placeholder` (ya da boş) → ikonun yerine şekli belli, boyutu doğru bir yer tutucu çiz. Katman adı
  `Yer tutucu · SF Symbol/<ad>` (Android: `Yer tutucu · Material Symbol/<ad>`). Ekran annotation'ına
  `not: ikonlar yer tutucu (<ad>, <ad>…)` satırını ekle ve özetin **Figma'da elle yapılacak** listesine yaz:
  `[ikon adları] → gerçek SF Symbols / Material Symbols ile değiştir`. Bu üç işaret varsa yer tutucu AT-10 / APP-10
  ihlali sayılmaz; biri eksikse sayılır.

## Ekranlar arası annotation tutarlılığı

Bir ekranın ana frame'i ve durum frame'leri aynı şeyi söyler (ST-8): varsayılan durum, akış adı, davranış notları
çelişmez. Brief bir bilgiyi vermiyorsa (ör. ekranın ilk açılışta hangi durumda olduğu) kendin seçme — Açık Sorular'a yaz
ve annotation'da `not: varsayılan durum belirsiz (açık soru)` de.

## Mobil web (web ekranları, 375 frame) — MW

- Etkileşimli her katmanın (buton, ikon, link) kutusu en az **44×44** (MW-1); küçük görsel öğede saydam hit alanı
  katmanı kullan. Paragraf içi linkler muaf.
- Hiçbir eylem yalnızca hover variant'ında ya da "While hovering" etkileşiminde görünmez (MW-2); varsayılan durumda erişilebilir.

---

## Üretim

`mcp__plugin_figma_figma__use_figma` ile Figma Plugin API'sini kullanarak Figma dosyasına yaz.

### Kurallara uy

- Renk değerleri 0–1 aralığında (`{r: 1, g: 0, b: 0}` = kırmızı — 0-255 değil)
- Her `use_figma` çağrısında max 10 mantıksal işlem — daha fazlası için böl
- Her çağrıdan oluşturulan/değiştirilen tüm node ID'lerini döndür
- `figma.notify()` kullanma — çıktı için `return` kullan
- `figma.currentPage = page` çalışmaz — `await figma.setCurrentPageAsync(page)` kullan
- Font kullanmadan önce `await figma.loadFontAsync({family, style})` çağır
- Auto-layout container için `figma.createAutoLayout()` kullan, mutlak koordinat değil
- Token değerlerini birebir uygula — yaklaştırma yapma
- Yapı (`yapi` varsa): ekran frame adı `T-… · [Ekran adı]`; template'in zorunlu durumları ayrı frame olarak üretilir;
  akış / template / durum bilgisi ekran annotation'ına yazılır (aşağıda; işaretlerin anlamı `structure-standards.md → HTML işaretleri`)
- **Plugin API'nin yapamadıkları — elle yapılacak listesi:** OpenType ayarları (ör. tabular rakam) Plugin API'den
  değiştirilemez. Brief bunu istiyorsa (tutar, saat, tablo sütunu) deneme yapma; ilgili ekran annotation'ına
  `not: tutarlarda tabular rakam (font-variant-numeric: tabular-nums)` satırını ekle ve özetin
  **Figma'da elle yapılacak** listesine yaz: `[frame / metin katmanları] — Type details → Numbers → Tabular`.
- **Yüklenemeyen yazı tipi:** Token'daki yazı tipi Figma'da yüklenemiyorsa (`listAvailableFontsAsync`'te yok ya da
  `loadFontAsync` hata veriyor — ör. SF Pro, lisanslı marka yazı tipi) en yakın yedeği kullan: iOS → Inter,
  Android → Roboto, web → token'daki yedek aile (yoksa Inter). Token dosyasını değiştirme; yedeği yalnızca Figma
  değişkenine yaz. Ekran annotation'ına `not: yazı tipi yedek (Inter ← SF Pro)` satırını ekle ve özetin
  **Figma'da elle yapılacak** listesine yaz: `Typography → font-family-… değerini [asıl yazı tipi] yap (kurulunca)`.

### Adım adım süreç

**1. Dosyayı incele (her şeyden önce)**
```js
// Mevcut sayfaları, component'ları ve değişkenleri keşfet
const pages = figma.root.children.map(p => ({ id: p.id, name: p.name }));
return pages;
```

**2. Token'ları Figma değişkenlerine aktar (varsa)**
Token JSON'dan renk, tipografi ve boşluk değerlerini Figma değişkeni olarak oluştur.
Zaten varsa üstüne yazma — önce kontrol et.

`color_scheme: both` ise `Color` koleksiyonunda `Light` ve `Dark` adlı iki mod oluştur,
her semantic değişkene `Light` = `$value`, `Dark` = `$extensions.mode.dark` ata. Ekranları koyu tema için kopyalama —
fill'leri variable'a bağla, kontrol için frame'in mode'unu değiştir.
`color_scheme: dark` ise tek `Dark` modu yeterli.

**3. Her görevi sırayla işle**
- Bölümü `placeholder = true` ile başlat
- Component / frame'i oluştur
- Token değerlerini bağla
- Ekranlar **frame** olarak kurulur (component değil — Assets paneline karışmaz). Ekran bilgisi frame'in **annotation**'ına
  yazılır (aşağıda "Ekran annotation'ı"). Component'lerin `description` alanına yalnızca amaç / kullanım yazılır;
  yapay zeka kökenini ima eden ifade (AI, Claude, generated) hiçbir yere yazılmaz
- Uygulama ekranı frame'leri cihaz ölçüsünde (iOS 390×844, Android 412×915) ve durum çubuğu + home indicator /
  gezinme çubuğu katmanlarıyla oluşturulur; içerik güvenli alanın içinde kalır (`mobile-platforms.md → 3`)
- Tamamlandığında `placeholder = false` yap
- `await frame.screenshot()` ile doğrula

### Ekran annotation'ı

Makinenin (reviewer, `/ads-iterate`) ve tasarımcının kullandığı ekran bilgisi Dev Mode annotation'ı olarak yazılır —
tasarım modunda ve Dev Mode'da görünür, okuma araçları (`get_design_context`) `data-adstudio-annotations` olarak getirir.

- Kategori: `adStudio` (`teal`). Dosyada yoksa bir kez oluştur:
  `figma.annotations.addAnnotationCategoryAsync({ label: 'adStudio', color: 'teal' })`; varsa onu kullan.
- Metin `label` alanına **düz metin** yazılır — `labelMarkdown` kullanma (kalın işaretleri okuma aracında bozuluyor).
- Yalnızca makinenin ya da tasarımcının kullandığı satırlar; satır sınırı yok. Ana ekran frame'i:
  ```
  flow: F-01 · Kitap ilerlemesini güncelle
  template: T-DETAIL
  states: loading, error, success
  regions: header, progress, actions, notes
  page_kind: product
  platform: ios
  ```
  `yapi` yoksa `flow` / `template` / `states` / `regions` satırları yazılmaz. Gerekirse `not: …` satırı (ör. tabular rakam).
- Durum frame'i: `state: error (sayfa sayısı aralık dışı)` (+ ana frame'in `flow` ve `template` satırları).
- Annotation `flows.md` / `templates.md`'nin kısa kopyasıdır; asıl kaynak dosyalardır. Ekran değişince annotation'ı da güncelle.
- Yazım: `frame.annotations = [{ label: '…', categoryId: kategori.id }]` — tasarımcının aynı node'daki başka
  kategorilerdeki notlarını silme (önce mevcutları oku, yalnızca `adStudio` kategorisindekini değiştir).

### flows.md ekran linkleri (`yapi` varsa)

Ekranlar çizildikten sonra `flows.md`'de `Adımlar` ve `Sonra` satırlarındaki her `Figma: <Ekran adı>` atfını o ekranın
ana frame linkiyle değiştir: `Figma: [Kitap detayı](<figma_linki dosyası>?node-id=9-177)`
(`structure-standards.md → Figma çıktısında ekran atfı`). Yalnızca bu atıfları değiştir — akışın metnine, dallarına,
önkoşuluna dokunma. Bir ekranı yeniden çizdiğinde (ör. `/ads-iterate`) yeni numarayla linki güncelle.

**4. Her görev sonrası doğrula**
Görsel ve yapısal sorunları erken yakala — bir sonraki göreye bozuk temelle devam etme.

### Her görev için bildir
```
TASK-001 ✓ — Button/Primary (Figma: Components/Atoms | node: 123:456)
TASK-002 ✓ — Input/Default  (Figma: Components/Atoms | node: 124:789)
```

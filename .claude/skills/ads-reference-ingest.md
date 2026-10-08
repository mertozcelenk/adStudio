---
name: ads-reference-ingest
description: Spec-intake akışı içinde, kullanıcının sağladığı referans girdileri (design token library, ekran görüntüleri, component showcase, icon set) inceleyip yapılandırılmış 9 alanlı formatta çıktı üretir. Doğrudan kullanıcı tarafından tetiklenmez — spec-intake tarafından çağrılır.
---

# Reference Ingest

## Durum Yönetimi

Bu skill `references/skill-state-pattern.md` kalıbını uygular.

Başlamadan önce mevcut state dosyasını kontrol et:
```bash
ls /tmp/ads-reference-ingest-*.json 2>/dev/null
```
Dosya varsa kullanıcıya "kaldığım yerden devam et / yeni başlat" sor.
Her adım tamamlandığında `/tmp/ads-reference-ingest-{RUN_ID}.json` dosyasını güncelle.
Başarıyla tamamlanınca dosyayı sil.

---

## Amaç

Kullanıcının sağladığı referans girdileri mekanik olarak inceleyip yorumlamak ve
spec.md'ye eklenecek yapılandırılmış veriyi üretmek. Mimari karar vermez, token
üretmez, tasarım sorusu sormaz — yalnızca toplar ve raporlar. Kullanıcıyla tek temas erişim sorunlarıdır
(Chrome kurulumu, ekran görüntüsü isteme).

## Doğrulama İlkesi

Doğrulanmamış değerleri doğrulanmış gibi yazma. Gerçekten incelenemediyse
`güven: tahmini` veya `güven: doğrulanamadı` olarak işaretle.

## Girdi Türleri ve İşleme Yöntemi

Her girdi türü için aşağıdaki öncelik sırasını uygula:

### A — Design Token Library (dosya / Figma linki / web sitesi URL'i)

**Web sitesi URL'i ise (http:// veya https:// ile başlıyorsa):**

Token kaynağı olarak bir web sitesi URL'i verildiğinde şu akışı uygula:

**Ön kontrol — Chrome bağlantısı**
`navigate` aracını çağırmadan önce Chrome eklentisinin bağlı olup olmadığını kontrol et.
Bağlı değilse kullanıcıya şu yönlendirmeyi yap:

> "Bu URL'den token çekebilmem için Chrome eklentisinin kurulu ve bağlı olması gerekiyor.
> Kurulum adımları: Claude Code eklentisini Chrome Web Store'dan yükleyin, ardından
> sağ üstteki eklenti simgesine tıklayıp bu siteye izin verin.
> Kurulum istemiyorsanız devam edin — alternatif yöntemle ilerleyeceğim."

Kullanıcı kurulum istemiyorsa veya eklenti hâlâ bağlanamıyorsa → **Adım W**'ye geç.

---

**Adım W — Chrome olmadan CSS çek (WebFetch / curl)**
`WebFetch` veya `curl` ile sayfanın HTML'ini indir.
`<link rel="stylesheet">` etiketlerini ayrıştır; üçüncü parti URL'leri (cdn, fonts.googleapis, widget vb.) hariç tut.
Sitenin kendi CSS dosyasını `WebFetch` ile çek.
`:root` custom properties, renk değerleri, font tanımları, spacing skalasını çıkar.

Başarılı → `güven: reconstructed`

Başarısız (login gerektiriyor, CSS erişilemez vb.) → **Adım S**'e geç.

---

**Adım S — Ekran görüntüsü iste**
Kullanıcıya şunu söyle:

> "Bu URL'e doğrudan erişemiyorum. Sayfanın bir ekran görüntüsünü paylaşırsanız
> renk, tipografi ve boşluk bilgilerini oradan çıkarabilirim."

Kullanıcı görüntü paylaşırsa → görsel analiz yap, `güven: tahmini`
Paylaşmazsa → `ingest_durumu: atlandı` olarak işaretle, pipeline devam eder.

---

**Adım 1 — Chrome bağlıysa: CSS kaynak dosyasını dene (öncelikli)**
Sayfaya navigate et, `<link rel="stylesheet">` etiketlerini listele.
Üçüncü parti CSS'leri (cdn, fonts.googleapis, widget vb.) hariç tut.
Sitenin kendi CSS dosyasını tarayıcı üzerinden oku (`get_page_text` ile).
`:root` custom properties, renk değerleri, font tanımları, spacing skalasını çıkar.

CSS okunabilirse → `güven: verified`

**Adım 2 — CSS bulunamazsa veya minify edilmişse: DOM sorgusu**
Şu elementleri hedefle ve `getComputedStyle` ile değerleri ölç:
- Dolu/birincil buton → `background-color`, `color`, `border-radius`, `padding`, `font-family`, `font-size`
- Input alanı → `border-color`, `border-radius`, `background-color`
- Body / paragraf metni → `font-family`, `font-size`, `line-height`, `color`
- Başlık (h1/h2) → `font-family`, `font-size`, `font-weight`
- Tekrarlayan kart/liste elemanı → `background-color`, `border-radius`, `padding`

→ `güven: reconstructed`

**Adım 3 — DOM da yetersizse: görsel analiz**
`get_screenshot` al, renk ve tipografiyi görsel olarak belgele.
→ `güven: tahmini`

**Çıkarılan token'ları yapılandır:**
```
tespit_edilen_değerler:
  renkler:
    - name: "primary"      value: "#..."   kaynak: "button background / :root --color-primary"
    - name: "text-default" value: "#..."   kaynak: "body color"
    - name: "bg-default"   value: "#..."   kaynak: "body background"
  tipografi:
    - family: "..."   weight: "..."   size: "..."   kaynak: "h1 / body"
  boşluk: [...]     kaynak: "button padding, card padding"
  radius: [...]     kaynak: "button border-radius, card border-radius"
```

**Üçüncü parti widget filtresi:** `cookie`, `consent`, `onetrust`, `chat`, `widget`,
`banner-ad` id/class'ı içeren elementleri token çıkarımına dahil etme.

---

**Figma linki ise:**
1. `get_variable_defs` ile değişken tanımlarını çek
2. Başarısız olursa `get_design_context` ile CSS örüntülerini ayıkla
3. İkisi de başarısız olursa `get_screenshot` ile görsel analiz yap
4. Araç erişimi tamamen başarısız olursa `ingest_durumu: araç_erişim_hatası` döndür

**Yerel dosya ise:**
1. Dosyayı doğrudan oku (JSON, YAML, CSS değişkenleri kabul edilir)
2. Token yapısını — koleksiyon adları, değer tipleri, isimlendirme kuralı — belgele
3. Mimari sorunları `bilinen_sorunlar` alanına yaz

### B — Ekran Görüntüleri

1. Görseli incele; renk paletini, tipografi yönünü ve boşluk örüntülerini belgele
2. Birebir değer çıkarma — piksel ölçümü veya CSS değeri olmadan sayısal değer yazma
3. Kullanıcı "müşteri sağladı" veya "AI üretimi" dediyse → `inspiration_images_trust: reference_only`
4. Herhangi bir nitelendirme yapılmadıysa → `inspiration_images_trust: reference_only` (varsayılan)
5. Kullanıcı "bu birebir uygulanacak" dediyse → `inspiration_images_trust: faithful`

### C — Component Showcase (link / görsel)

1. Link ise sayfayı tara; component listesini, kullanılan renk ve tipografi değerlerini çıkar
2. Görsel ise bileşen envanterini belgele; sayısal değerleri tahmin olarak işaretle
3. Üçüncü taraf widget'ları ("cookie", "chat", "consent" içerenleri) filtrele

### D — Icon Set

| Kaynak türü | İşleme yöntemi |
|-------------|----------------|
| Yerel dosya/klasör (SVG, icon font) | Dosyayı doğrudan incele; icon sayısını ve adlandırma kuralını belgele |
| Figma dosyası (icon library sayfası) | `get_metadata` / `get_variable_defs` ile tara |
| Website / paket (Lucide, Heroicons vb.) | Kütüphanenin adını, paket adını ve versiyonunu not al — içeriği tarama |

**Zamanlama notu:** Icon set burada spec'e kaydedilir. `Primitives.icon` token'ı
token-generator'ın component aşamasında, ilk icon kullanan component işlenirken üretilir.

## Çıktı — 9 Alanlı Format

Her referans girdi için aşağıdaki alanları doldur:

```
| Alan               | Açıklama                                                                 |
|--------------------|--------------------------------------------------------------------------|
| kaynak             | Dosya yolu, URL veya "kullanıcı tarafından yüklendi"                     |
| tür                | token-library / screenshot / showcase / icon-set                         |
| label              | constraint / inspiration                                                 |
| güven              | verified / reconstructed / tahmini / doğrulanamadı                       |
| içerik_özeti       | Ne bulundu — kısa, madde madde                                           |
| tespit_edilen_değerler | Renkler, tipografi, boşluk, border-radius (sayısal değer varsa)      |
| bilinen_sorunlar   | Mimari tutarsızlıklar, eksik koleksiyonlar, çakışan isimler              |
| işleme_notu        | Hangi araç/yöntem kullanıldı, geri dönüş zincirinde hangi adıma düşüldü |
| ingest_durumu      | tamamlandı / kısmi / başarısız / araç_erişim_hatası / atlandı             |
```

### Örnek çıktı bloğu

```
kaynak: https://figma.com/file/abc123
tür: token-library
label: constraint
güven: verified
içerik_özeti:
  - 3 koleksiyon: Primitives, Color, Typography
  - 142 değişken tanımı
  - Token Studio formatında DTCG yapısı
tespit_edilen_değerler:
  renkler: ["#1A1A2E", "#E94560", "#F5F5F5"]
  tipografi: ["Inter 14/20", "Inter 24/32"]
  boşluk: [4, 8, 16, 24, 32]
bilinen_sorunlar:
  - Color koleksiyonunda semantic ve primitive tokenlar iç içe geçmiş
  - "spacing-lg" tanımlı ama hiçbir component'ta referans edilmiyor
işleme_notu: get_variable_defs başarılı — geri dönüş gerekmedi
ingest_durumu: tamamlandı
```

## Çıktının Spec'e Eklenmesi

Her girdi için üretilen 9 alanlı bloğu spec.md'nin ilgili alt bölümüne yaz:

- Design Token Library → `## Referans Girdiler / ### Design Token Library`
- Ekran Görüntüleri → `## Referans Girdiler / ### Örnek Ekran Görüntüleri`
- Component Showcase → `## Referans Girdiler / ### Component Showcase`
- Icon Set → `## Referans Girdiler / ### Icon Set`

`inspiration_images_trust` değerini ayrıca `token_directives` bloğuna da yaz.

## Kısıtlamalar

- Mimari karar vermez
- Token üretmez
- Erişilebilirlik kontrolü yapmaz
- Tasarım sorusu sormaz — belirsiz durumları `güven: tahmini` olarak işaretler (erişim isteği hariç)
- Araç erişimi başarısız olursa `ingest_durumu: araç_erişim_hatası` döndürür,
  akışı durdurmaz; spec-intake ana akışa devam eder

---
name: ads-spec-intake
description: Sıfırdan bir tasarım/design system projesine başlarken yapılandırılmış bir design spec toplamak için kullanılır. "Yeni bir proje başlıyoruz", "sıfırdan tasarım", "yeni design system kuracağız" gibi taleplerde tetiklenir. Var olan bir design system'e yeni bir çalışma eklemek için KULLANILMAZ — o ayrı bir context-scanner + impact-analysis akışıyla (var olan sisteme ekleme senaryosu) ele alınır.
---

# Spec Intake — Sıfırdan Tasarım

## Doğrulama İlkesi — Hiçbir Şeyi Varsayma
Kullanıcının söylemediği bir şeyi (referans dosyanın içeriği, bir
görselin rengi vb.) varsayarak spec'e yazma — gerçekten incelenip
doğrulanmadıysa "doğrulanmadı"/"tahmini" diye işaretle.

## Amaç
Tasarım/kodlama çalışması başlamadan önce, projeyi net bir şekilde tanımlayan
yapılandırılmış bir spec dokümanı üretmek. Bu spec, sonraki adımda design token
üretimi, IA/akış tasarımı ve component planlamasının referans noktası olur.

**v2 değişikliği:** Spec artık `token_directives` meta bloğu içeriyor. Bu blok,
token-generator'ın kaynak güven değerlendirmesini spec aşamasında çözüp
doğrudan üretime geçmesini sağlayan makine-okunabilir direktifler içerir.

## Ne zaman tetiklenir
- Kullanıcı yeni bir proje/ürün/design system'e sıfırdan başladığını belirtiyor
- Henüz var olan bir Figma dosyası/component seti referans alınmıyor (varsa bile
  sadece **ilham** amaçlı — bkz. Referans Girdiler)

## Akış

Soruları tek tek veya küçük gruplar halinde sor; kullanıcıyı tek seferde uzun bir
formla boğma. Cevap "bilmiyorum" veya "sonra kararlaştırırız" ise alanı `TBD` olarak
işaretleyip devam et — spec'in tamamlanmamış olması akışı durdurmamalı.

**Cevaplanmayan alanlar:** Kullanıcı bir grup soruya cevap verirken bazı alanları
atlarsa, o alanı hemen tekrar sorma — akışı bölmemek için önce devam et. Bir
sonraki turda yeni soruyla birlikte nazikçe hatırlat. Yine cevap gelmezse `TBD`
olarak işaretle.

**"Açık Sorular / TBD" bölümüne sahte madde ekleme.** Bu bölüm sadece
gerçekten sorulmuş ama cevaplanmamış alanları içerir.

### 1. Ortak Bağlam
- Proje adı / kısa tanım
- Amaç ve hedef kullanıcı kim
- **Platform** — üç parça halinde sor (kurallar bu cevaba göre seçilir, bkz. `references/mobile-platforms.md`):
  > "Ne tasarlıyoruz?"
  > - `[ ] Web` — site veya web uygulaması (masaüstü + mobil görünüm)
  > - `[ ] Mobil uygulama` — App Store / Google Play'e çıkacak uygulama
  > - `[ ] İkisi de`

  Mobil uygulama veya ikisi seçildiyse:
  > "Hangi platform?" `[ ] iOS` `[ ] Android` `[ ] İkisi`

  Her durumda, isteğe bağlı:
  > "Tablet de kapsamda mı?" `[ ] Hayır` `[ ] Evet`

  Cevapları `platform` (`web` | `app` | `both`), `app_platforms` ve `tablet` alanlarına yaz.
- Teknik altyapı (Figma + Token Studio + Code Connect zinciri kullanılacak mı)
- **Renk şeması desteği**: sadece açık tema mı, sadece koyu tema mı, yoksa
  ikisi de mi? Bu, token mimarisini doğrudan etkiliyor — atlanmaması gereken
  temel bir soru
  - **Mobil uygulama** seçildiyse "ikisi"ni önerilen seçenek olarak işaretle. Kullanıcı tek tema seçerse
    bir kez sor: *"Telefon koyu temadayken uygulama açık kalacak. Emin misin?"* — cevabı ne olursa olsun kabul et.
  - **Kullanıcı kararsızsa** ("fark etmez", "siz seçin") temayı kendin seçme — sahne
    cümlesini sor:
    > "Bu ürünü kim, nerede, hangi ışıkta kullanıyor? Tek cümleyle anlatır mısın?
    > Örn. *'Gece vardiyasındaki hemşire, loş koridorda, telefondan hızlıca bakıyor.'*"
  - Cevabı `scene_sentence` alanına yaz ve temayı bu sahneden türet (loş ortam / uzun
    gece kullanımı → koyu; gün ışığı / basılı belge hissi / uzun okuma → açık). Türettiğin
    temayı gerekçesiyle kullanıcıya bir cümleyle onaylat.
  - Kullanıcı temayı kendisi söylediyse sahne cümlesini **sorma**.
- Başarı kriterleri — bu iş "bitti" ne zaman sayılır
- Erişilebilirlik gereksinimi (varsayılan: WCAG AA, aksi belirtilmedikçe)

### 2. Sıfırdan Tasarıma Özel Alanlar

**Estetik Yön Soruları**

Bu beş soruyu sırayla sor. Her soru için seçenekleri listele ama serbest yanıta
da açık olduğunu belirt. Kullanıcı font adı, hex kodu veya stil kelimesi verirse
`aesthetic_directives.user_explicit`'e kaydet — bu değerler filtrelerden muaf tutulur.
Seçenek seçilirse `ai_inferred` olarak işaretlenir.

Seçenekleri açıklamalarıyla birlikte göster — tasarımcı neyi seçtiğini ve
bunun neyi etkilediğini bilmeli. S1, S2 ve S5 yanıtları ads-design-strategist
tarafından layout cesareti (VARIANCE), yoğunluk (DENSITY) ve hareket (MOTION)
değerlerine çevrilir; tasarımcı bu değerleri Design Read'de görüp düzeltebilir.

**S1 — Genel dil**
> "Tasarımın genel karakteri nasıl olsun? Bu cevap layout'un ne kadar
> simetrik/öngörülebilir ya da cesur/asimetrik olacağını belirler."
> - `[ ] Teknik / fonksiyonel` — net grid, simetrik düzen, az süs, içerik ve veri öncelikli *(ör. Linear, GitHub, kamu servis siteleri)*
> - `[ ] Minimal / editorial` — bol boşluk, güçlü tipografi, hafif asimetri, dergi hissi *(ör. Stripe Press, Medium)*
> - `[ ] Sıcak / organik` — yumuşak formlar, doğal tonlar, rahat ve samimi akış *(ör. Airbnb, Headspace)*
> - `[ ] Cesur / deneysel` — asimetrik layout, büyük tipografi, beklenmedik kompozisyon *(ör. ajans/portfolyo siteleri, Awwwards)*
> *Ya da direkt yaz: "japandi", "brutalist", "y2k" vb.*

**S2 — Görsel yoğunluk**
> "Bir ekranda ne kadar bilgi olsun? Bu cevap boşluk miktarını ve ekran başına
> düşen eleman sayısını belirler."
> - `[ ] Ferah (low density)` — ekran başına tek ana mesaj, çok boşluk *(ör. Apple ürün sayfası, landing page'ler)*
> - `[ ] Dengeli` — içerik ve boşluk dengeli, kart/liste ağırlıklı *(ör. Notion, çoğu SaaS uygulaması)*
> - `[ ] Bilgi yoğun (high density)` — tablolar, paneller, çok veri bir arada *(ör. analitik dashboard, admin paneli, trading ekranı)*

**S3 — Tipografi karakteri**
> "Font kişiliği nasıl olsun?"
> `[ ] Geometrik sans-serif` `[ ] Humanist sans-serif` `[ ] Serif / editorial` `[ ] Monospace / teknik`
> *Ya da direkt font adı yaz: "Söhne", "Canela", "GT Alpina" vb.*
> Font adı verilirse → `aesthetic_directives.user_explicit.fonts`'a kaydet.

**S4 — Renk yaklaşımı**
> "Renk nasıl kullanılsın?"
> - `[ ] Nötr + tek güçlü accent` — gri/nötr zemin, renk yalnızca buton ve vurgularda *(ör. Linear, Stripe dashboard)*
> - `[ ] Tek baskın renk` — marka rengi hero ve section zeminleri gibi geniş alanları kaplar *(ör. Spotify yeşili, Klarna pembesi)*
> - `[ ] Sınırlı palet (2-3 renk)` — her rengin belirli bir görevi var *(ör. Notion, Airtable)*
> - `[ ] Zengin / çok renkli` — 3-4 adlandırılmış renk rolü *(ör. Google, Mailchimp)*
> - `[ ] Renge boyanmış yüzey` — zeminin kendisi renk, gri/beyaz zemin yok *(ör. kampanya ve festival siteleri)*
> *Ya da direkt değer yaz: "#1a1a2e", "warm cream tones", "deep forest green" vb.*
> Renk değeri verilirse → `aesthetic_directives.user_explicit.colors`'a kaydet.

**S5 — Hareket seviyesi**
> "Arayüzde ne kadar animasyon/hareket olsun?"
> - `[ ] Statik` — yalnızca durum geçişleri (hover, focus, açılır menü) *(ör. kamu siteleri, form ağırlıklı uygulamalar)*
> - `[ ] Ölçülü` — yumuşak hover'lar, içeriğin hafifçe belirmesi *(ör. Linear, Notion)*
> - `[ ] Belirgin` — scroll ile açılan bölümler, kademeli giriş animasyonları *(ör. ürün tanıtım sayfaları)*
> - `[ ] Sinematik` — scroll'a bağlı anlatım, sabitlenen bölümler, yatay kaydırma *(ör. Apple ürün lansmanları, ajans siteleri)*
> *Ya da serbest yaz: "neredeyse hiç", "sadece mikro etkileşimler" vb.*
> Hangi seviye seçilirse seçilsin, `prefers-reduced-motion` desteği her zaman zorunludur.

Tüm yanıtlar (seçilen seçenekler + serbest metinler) `aesthetic_directives`'e yazılır.
Kullanıcı herhangi bir soruya "bilmiyorum" veya cevap vermezse `TBD` bırak — tahmin yapma.

- Marka/ton yönü — yukarıdaki beş soruya ek olarak, kullanıcının verdiği yanıtta
  **stil kelimesi** geçiyorsa `aesthetic_directives.user_explicit.styles`'a kaydet.
  Örnekler: "brutalist stil", "mor accent", "çok renkli olsun".
- Kullanıcı yolculuğu — şu soruyu sor:
  > "Kullanıcı uygulamada nasıl bir yolculuk yapıyor? Baştan sona ana adımları yazın."
  > *Örnek: "Giriş yap → Dashboard → Proje oluştur → Fatura gönder"*
  > *Tüm durumları yazmanıza gerek yok — genel akış yeterli.*

  Gelen yanıtı olduğu gibi spec'e yaz. Edge case'leri, hata state'lerini veya
  eksik adımları burada sorma — bunlar ads-design-planner aşamasında tespit edilip
  tasarımcıya onaylatılacak.
- Design system'in kaynağı:
  - **Sıfırdan Kurulacak** — tamamen yeni, mevcut hiçbir sisteme dayanmıyor
  - **Kurumsal Kimlik Kılavuzu Var** — marka renkleri ve fontları kılavuzdan gelecek,
    spacing/component/semantic yapı sıfırdan kurulacak
  - **Foundation'dan Türetilecek** — var olan bir foundation/kütüphaneden türetilecek
- İlk kapsam: hangi ekranlar/component'lar MVP'de var

**Etiketleme kuralı:**
- Kaynak **Sıfırdan Kurulacaksa** → tüm referans girdiler `inspiration`
- Kaynak **Kurumsal Kimlik Kılavuzu** ise:
  - Kılavuz → `constraint` (marka renkleri ve fontları için)
  - Estetik görseller → `inspiration`
  - `trust_profile`: `partial` — korunan katmanlar: `colors`, `typography`
  - token-generator'a `brand-guide` modu olarak iletilir (bkz. Adım 2.5b)
- Kaynak **Foundation'dan Türetilecekse** → foundation'a ait girdiler `constraint`,
  ayrıca eklenen estetik görseller `inspiration`
- Belirsizse kullanıcıya sor: "Bu referans birebir mi kullanılacak (constraint),
  yoksa sadece ilham mı (inspiration)?"

### 2.5a. Kurumsal Kimlik Kılavuzu (seçilirse zorunlu)

Kaynak **Kurumsal Kimlik Kılavuzu** seçildiyse şunu sor:

> "Kılavuzu paylaşabilir misiniz? PDF, link veya değerleri liste olarak verebilirsiniz."

Kılavuz sağlanırsa `reference-ingest` skill'ini çalıştır. Çıkarılacaklar:
- Marka renkleri (hex / RGB) → `reference_derived`, korunan katman
- Marka fontları (font adı) → `reference_derived`, korunan katman
- Ton ve ses yönü → spec'in "Marka / Ton" bölümüne yaz
- Fotoğraf / illüstrasyon yönü → `inspiration_images_trust: reference_only`

Ardından kullanıcıya göster:

> "Kılavuzdan şu değerleri çıkardım: [liste]. Bunların tamamı token'lara
> binding şekilde geçsin mi, yoksa bazıları sadece yön olarak kullanılsın mı?"

| Kullanıcı yanıtı | Davranış |
|---|---|
| Tamamı binding | Renk + font → `user_explicit`'e taşı |
| Kısmen binding | Hangilerinin binding olduğunu netleştir, geri kalanı `reference_derived` kalır |
| Sadece yön | Tüm değerler `reference_derived` + `confidence: "directional"` |

`token_directives`'e ekle:
```yaml
brand_guide_mode: true
brand_guide_source: "[dosya adı veya link]"
preserved_layers: ["colors", "typography"]
```

### 2.5b. Kaynak Güvenilirliği (constraint etiketinde zorunlu)

Design Token Library etiketi `constraint` ise şunu sor:

> "Bu kaynağa ne kadar güveniyorsunuz? Başka bir ekip mi hazırladı,
> bilinen sorunlar var mı?"

Cevaba göre `token_directives.trust_profile` belirle:

| Kullanıcı ne söyledi | `trust_profile` |
|---------------------|-----------------|
| Tam güven, birebir kullanalım | `full` |
| X'i koru, Y'yi yeniden yap | `partial` |
| Sadece genel yönü al | `directional` |
| Cevap yok | `full` (token-generator adım 0'da tekrar sorar) |

`partial` seçilirse korunan ve yeniden tasarlanacak katmanları netleştir;
`redesign_notes` alanına sebebini kaydet (örn. bilinen mimari sorunlar,
tutarsızlıklar, güvensizlik nedenleri).

**Referans ekran görüntüleri için kaynak notu:**
Kullanıcı görselleri "müşteri sağladı" veya "AI ile üretildi" olarak
nitelendirirse bunu `inspiration_images_trust: reference_only` olarak işaretle.
Kullanıcı herhangi bir nitelendirme yapmadan görsel sağlarsa varsayılan
`reference_only` olarak işaretle — boş bırakma. Kullanıcı "bu birebir
uygulanacak" derse `faithful` kullan.
Bu, token-generator'a ve showcase üretimine yön verir: görseller fikir için
kullanılır, birebir kopyalanmaz.

### 3. Referans Girdiler (opsiyonel — checklist gibi sor)
Kullanıcıya şu dördünü sor, hiçbiri zorunlu değil:
- [ ] Design token library (dosya / Figma linki / web sitesi URL'i)
  URL verilirse `reference-ingest` web sitesi modunda çalışır: CSS kaynak dosyasını okur,
  renk/font/spacing değerlerini çıkarır ve `reference_derived` olarak spec'e yazar.
- [ ] Örnek tasarım ekran görüntüleri
- [ ] Component Showcase linki/görseli
- [ ] **Icon set** — kullanılması istenen belirli bir icon seti var mı?
  Kaynağı üç şekilde olabilir: yerel bir klasör/dosya (SVG/icon font),
  bir Figma dosyası (icon library sayfası), veya bir website (örn.
  Lucide, Heroicons, Font Awesome gibi bir icon kütüphanesi linki).
  Hangisi olduğuna göre işleme yöntemi değişir — dosyaysa doğrudan
  incele, Figma'ysa `get_metadata`/`get_variable_defs` ile tara,
  website'yse basitçe kütüphanenin adını/paketini not al. Belirtilmezse
  `TBD` bırak — generic bir icon seti varsayıp geçme.
  **Zamanlama:** Icon set spec'e kaydedilir ama `Primitives.icon` token'ı
  token-generator'ın component aşamasında, ilk icon kullanan component
  işlenirken üretilir.
  **Mobil uygulama seçildiyse ve icon seti verilmediyse** `TBD` bırakmak yerine sor:
  > "Uygulamada hangi ikonları kullanalım?"
  > - `[ ] Platformun kendi ikonları` — iOS'ta SF Symbols, Android'de Material Symbols. Uygulama telefonun geri kalanıyla aynı görsel dili konuşur. İki platform seçildiyse ikonlar iki versiyon olur. *(Not: SF Symbols yalnızca Apple cihazlarındaki uygulamalarda kullanılabilir.)*
  > - `[ ] İki platformda aynı set` — Material Symbols ya da seçeceğin başka bir set (Phosphor, Lucide…). Tek, tutarlı görünüm; iOS'ta biraz yabancı durabilir.
  > - `[ ] Kendi ikon setim var` — Linkini ya da dosyasını paylaş.

  Cevabı `icon_source` alanına yaz (`platform` | `shared:<set>` | `custom:<link>`). Web projelerinde bu soru sorulmaz.

Herhangi biri sağlanırsa **`reference-ingest` skill'ini** belirlenen modda
çalıştır. Çıktıyı spec'in ilgili alt bölümüne 9 alanlı formatta ekle.

**9 alanlı format alanları:** `kaynak`, `tür`, `label`, `güven`,
`içerik_özeti`, `tespit_edilen_değerler`, `bilinen_sorunlar`,
`işleme_notu`, `ingest_durumu`. Her alanın tam tanımı ve örnek çıktı
`skills/ads-reference-ingest/SKILL.md` dosyasında belgelenmiştir.

## Çıktı Formatı

Aşağıdaki şablonla bir `spec.md` üret:

```markdown
---
produced_by: adStudio
ads_version: "0.1"
---

# [Proje Adı] — Design Spec (Sıfırdan Tasarım)

## Amaç ve Kapsam
...

## Platform ve Teknik Kısıtlar
...

## Başarı Kriterleri
...

## Erişilebilirlik Gereksinimleri
...

## Marka / Ton
...

## Bilgi Mimarisi ve Temel Akışlar
...

## Design System Kaynağı
- [ ] Sıfırdan kurulacak
- [ ] Var olan foundation'dan türetilecek: [kaynak]

## İlk Kapsam (MVP Ekran/Component Envanteri)
...

## Referans Girdiler
### Design Token Library [constraint / inspiration]
[9 alanlı format]

### Örnek Ekran Görüntüleri [inspiration]
...

### Component Showcase
...

## Açık Sorular / TBD
...

## Bağlayıcı Kararlar
<!-- Konuşma sırasında verilen kalıcı tasarım kararları buraya eklenir.
     ads-iterate veya ads-design-strategy sonunda otomatik güncellenir.
     Dışarıdan da "bu kararı kaydet" diyerek eklenebilir.
     [Korunan] önekli maddeler redesign koruma listesidir — onaysız değiştirilemez. -->


---
<!-- BEGIN:token_directives -->
```yaml
source_label: constraint | inspiration
trust_profile: full | partial | directional
preserved_layers:
  - [korunan katmanlar — partial profilde doldurulur]
redesigned_layers:
  - [yeniden tasarlanacak katmanlar — partial profilde doldurulur]
redesign_notes: >
  [Neden yeniden tasarlanıyor — bilinen sorunlar, güvensizlik nedeni]
inspiration_images_trust: reference_only | directional | faithful
known_issues:
  - [kaynak dosyada tespit edilen mimari veya değer sorunları]
aesthetic_directives:
  user_explicit:
    fonts: []     # S3'te font adı verilmişse — örn. ["Söhne", "Canela"]
    colors: []    # S4'te renk değeri verilmişse — örn. ["#1a1a2e", "warm cream tones"]
    styles: []    # Serbest metin stil yanıtları — örn. ["brutalist", "japandi"]
  selected_options:
    language: ""  # S1 seçimi — örn. "minimal / editorial"
    density: ""   # S2 seçimi — örn. "low density"
    typography: "" # S3 seçimi (seçenek seçildiyse) — örn. "humanist sans-serif"
    color_approach: "" # S4 seçimi — "nötr + tek accent" | "tek baskın renk" | "sınırlı palet" | "zengin / çok renkli" | "renge boyanmış yüzey"
    motion: ""    # S5 seçimi — örn. "ölçülü"
color_scheme: light | dark | both   # Ortak Bağlam'daki "Renk şeması desteği" cevabı
scene_sentence: ""  # Yalnızca kullanıcı tema konusunda kararsızsa — kim, nerede, hangi ışıkta
platform: web | app | both          # Ortak Bağlam → "Ne tasarlıyoruz?"
app_platforms: []                   # app/both ise — [ios] | [android] | [ios, android]
tablet: false                       # "Tablet de kapsamda mı?"
icon_source: ""                     # Uygulamada — platform | shared:<set> | custom:<link>
component_source: ""                # ads-design-strategy doldurur (uygulama + Figma) — kit | drawn | own
dials:            # ads-design-strategist doldurur, ads-design-strategy yazar — spec-intake boş bırakır
  variance: null  # 1-10 — layout cesareti (S1/S2'den çıkarılır)
  motion: null    # 1-10 — hareket miktarı (S5'ten)
  density: null   # 1-10 — bilgi yoğunluğu (S2'den)
  source: ""      # inferred | user_explicit (tasarımcı düzelttiyse)
brand_guide_mode: false   # Kurumsal kimlik kılavuzu seçildiyse true
brand_guide_source: ""    # PDF adı, link veya "kullanıcı liste verdi"
preserved_layers: []      # brand_guide_mode true ise — örn. ["colors", "typography"]
```
<!-- END:token_directives -->
```

**Korunan öğeler (import / redesign akışından gelirse):** `ads-import` veya
`ads-impact-analysis` onaylanmış bir "Korunacaklar" listesi ilettiyse her maddeyi
`## Bağlayıcı Kararlar` bölümüne şu formatta yaz — kullanıcıya tekrar sorma,
liste zaten onaylandı:

```
- [Tarih] [Korunan] [tür]: [değer] — [neden korunuyor]
```

Örnek: `- 2026-10-01 [Korunan] nav etiketi: "Bireysel Krediler" — SEO ve kullanıcı alışkanlığı`

**Not:** `token_directives` bloğu teknik handoff metadata'sıdır —
kullanıcıya gösterilen spec özetine dahil edilmez. Token-generator bu bloğu
`<!-- BEGIN:token_directives -->` ve `<!-- END:token_directives -->` sentinel'larıyla
bulur. `source_label` veya `trust_profile` boş bırakılırsa token-generator adım 0'da
tekrar sorar.

## Tamamlanma Kontrolü
Spec taslağı çıktıktan sonra kullanıcıya göster ve şunu sor: "Eksik veya
yanlış bir alan var mı, yoksa bir sonraki adıma (token üretimi / IA) geçelim mi?"

Kullanıcı onaylarsa şunu ekle: "Devam etmek için `/ads-token-generator` komutunu
çalıştırın. Token üretimi yerine IA veya akış tasarımına geçmek isterseniz
bunu belirtin."

# Yapı Standartları — Flow ve Template

Ekran üreten, planlayan veya denetleyen her skill ve agent bu dosyayı okur. Token'lar ürünün **nasıl göründüğünü**,
bu dosyadaki iki proje dosyası ürünün **nasıl davrandığını ve nasıl kurulduğunu** tanımlar:

| Dosya | Ne tanımlar |
|---|---|
| `templates.md` | Ekran tipleri: iskelet, bölgeler, zorunlu durumlar, davranış |
| `flows.md` | Proje geneli davranış kuralları + kullanıcı akışları: adımlar, dallar, akışlar arası bağımlılık |

Her iki dosya proje kökünde durur, kalıcıdır ve üzerine yazılmaz; yeni kapsam **eklenir**. Varlıkları
`project-state.md → yapi: flows.md, templates.md` alanıyla bildirilir; otomatik `structure` testi bu alana bakar.

Bu dosyadaki biçim makine tarafından okunur (`scripts/test/structure.mjs`) — başlık ve madde adlarını birebir kullan.

---

## templates.md

Her template bir `##` başlığıdır. Kimlik `T-` ile başlar, büyük harf ve tire içerir.

```markdown
# [Proje] — Templates

## T-LIST — Liste ekranı
- Kullanım: Gruplar, Harcamalar
- Bölgeler: header, summary, list, primary-action
- Zorunlu durumlar: loading, empty, error
- Davranış: Satıra dokununca detay (T-DETAIL); çekip yenile; boşken açıklama + birincil eylem
- Token'lar: spacing-16, radius-card, color-surface
- Platform: iOS large title + liste; Android top app bar + FAB (`mobile-platforms.md → 5`)
- Pattern: (ads-ux-designer'ın template düzeyindeki kararı ve gerekçesi)
```

| Madde | Zorunlu | Not |
|---|---|---|
| `Kullanım` | Evet | Bu template'i kullanan ekranlar |
| `Bölgeler` | Evet | Virgülle ayrılmış, küçük harf-tire. Ekranda her bölge `data-region="…"` taşır |
| `Zorunlu durumlar` | Evet | `loading`, `empty`, `error`, `success`, `offline` içinden; yoksa `yok` |
| `Davranış` | Evet | Etkileşim: dokunma, kaydırma, yenileme, geri dönüş |
| `Token'lar`, `Platform`, `Pattern` | Hayır | Platform yalnızca `platform: app | both` |

### adStudio'nun önerdiği temel tipler

Proje bunları **uyarlar**; kullanmadığı tipi eklemez, ihtiyaç duyduğu yeni tipi ekler.

| Kimlik | Tip | Varsayılan bölgeler | Varsayılan zorunlu durumlar |
|---|---|---|---|
| `T-LIST` | Liste | header, filters (varsa), list, primary-action | loading, empty, error |
| `T-DETAIL` | Detay | header, summary, content, actions | loading, error |
| `T-FORM` | Form / giriş | header, fields, submit | error, success |
| `T-OVERVIEW` | Genel bakış / panel | header, metrics, sections | loading, empty, error |
| `T-STEPS` | Adımlı akış (onboarding, checkout) | progress, step-content, step-actions | error |
| `T-SETTINGS` | Ayarlar | header, groups | yok |
| `T-LANDING` | Tanıtım sayfası (web) | hero, sections, cta, footer | yok |

---

## flows.md

```markdown
# [Proje] — Flows

## Ortak Davranış
- Doğrulama: alandan çıkınca; gönderimde tüm hatalar alanın altında
- Başarı geri bildirimi: toast 3 sn + ilgili veri güncellenir
- Hata geri bildirimi: ne olduğu + ne yapılacağı; veri kaybolmaz
- Yıkıcı işlem: onay ister (silme, gruptan çıkma)
- Geri alma: silme sonrası 5 sn "Geri al"
- Yükleme: 300 ms üstü işlemde skeleton
- Çevrimdışı: (gerekiyorsa)

## F-01 — Grup oluştur
- Önkoşul: yok
- Giriş: Gruplar listesi → "Grup oluştur"
- Adımlar:
  1. Grup adı ve para birimi — screens/group-create.html · T-FORM
  2. Arkadaş davet et — screens/group-invite.html · T-FORM
- Dallar:
  - Hata: ad boş → kaydet pasif
  - İptal: değişiklik varsa onay sor
- Sonra: screens/group-detail.html → F-02
- Davranış: (akışa özel; Ortak Davranış'tan farklıysa)
- Başarı ölçütü: grup 2 adımda kurulur

## F-02 — Harcama ekle
- Önkoşul: F-01 (en az 1 grup)
- Giriş: Grup detayı → "+"
- Adımlar:
  1. Tutar, para birimi, açıklama — screens/expense-add.html · T-FORM
- Dallar:
  - Boş: grubun harcaması yoksa grup detayında "İlk harcamayı ekle"
  - Hata: ağ yok → taslak saklanır, uyarı
- Sonra: screens/group-detail.html
- Başarı ölçütü: harcama 2 dokunuşta kaydedilir
```

| Madde | Zorunlu | Not |
|---|---|---|
| `## Ortak Davranış` | Evet | Dosyada bir kez, en üstte; her akış bunu miras alır |
| `Önkoşul` | Evet | `yok` ya da önce gereken akış(lar): `F-01 (en az 1 grup)` |
| `Giriş` | Evet | Kullanıcının akışa nereden girdiği. Girişi olmayan akışa ulaşılamaz |
| `Adımlar` | Evet | Her adım: açıklama — `screens/<dosya>.html` · `T-…` |
| `Dallar` | Evet | En az hata ve iptal; listeli/boş olabilen veride boş durum |
| `Sonra` | Evet | Akış bitince gidilen ekran, sürüyorsa `→ F-…` |
| `Davranış`, `Başarı ölçütü` | Hayır | Başarı ölçütü spec'teki başarı kriterinden |

### Akışlar arası bağımlılık — hafif

- Elle yazılan yalnızca `Önkoşul` ve `Sonra`. **Ortak ekranlar elle yazılmaz**: aynı ekran birden çok akışta geçiyorsa
  bunu `structure` testi ekranlardaki `data-flow` işaretlerinden çıkarır.
- Önkoşullarda döngü olamaz (F-02 → F-03 → F-02).
- Önkoşulu karşılanmamış boş durum **çıkmaz sokak olamaz**: boş durum, kullanıcıyı önkoşulu tamamlayacağı ya da
  sıradaki akışı başlatacağı eyleme götürür ("Henüz harcama yok" → [İlk harcamayı ekle] → F-02).
- Üretim sırası önkoşullara göredir: önkoşul akışın ekranları önce.

### Kısa ve tam sürüm

| Mod | flows.md içeriği |
|---|---|
| Quick | Ortak Davranış + her akış için happy path, zorunlu dallar (hata, iptal, boş), Önkoşul, Giriş, Sonra |
| Deep | Yukarıdakiler + planner'ın genişletme sorularıyla bulunan dallar (yarıda bırakma, tekrar, başarı sonrası) |

Basit tek sayfa (landing) projelerinde tek akış yeterlidir: `F-01 — Ziyaret` (Önkoşul: yok).

---

## HTML işaretleri

Builder her ekranda (`screens/*.html`) şu işaretleri kullanır; `structure` testi bunları okur:

| İşaret | Nerede | Örnek |
|---|---|---|
| `data-template="T-…"` | `<body>` | `<body data-template="T-LIST" data-flow="F-01 F-02">` |
| `data-flow="F-…"` | `<body>` | Birden çok akış boşlukla ayrılır (ortak ekran) |
| `data-region="…"` | Bölgenin kök öğesi | `<section data-region="list">` |
| `data-state="…"` | Durumun kök öğesi | `<div data-state="empty" hidden>` — durum blokları sayfada bulunur, görünürlük CSS / `hidden` ile |
| `data-flow-start="F-…"` | Başka akışı başlatan eylem | `<a href="expense-add.html" data-flow-start="F-02">İlk harcamayı ekle</a>` |

Figma çıktısında aynı bilgi frame adında (`T-LIST · Gruplar`) ve frame açıklamasında (`flow: F-01 F-02`,
`states: loading, empty, error`) taşınır; durumlar ayrı frame veya variant olarak üretilir.

## Denetim özeti

| Bulgu | Etki | Teslimi engeller |
|---|---|---|
| Template'in zorunlu durumu ekranda yok | High | Evet |
| Ekranda `data-template` yok / bilinmeyen template veya akış kimliği | High | Evet |
| Akış adımındaki ekran dosyası yok | High | Evet |
| `Önkoşul` / `Sonra` var olmayan akışa veya ekrana gidiyor | High | Evet |
| Önkoşullarda döngü | High | Evet |
| Akışın `Giriş`i yok | High | Evet |
| Boş durumda eylem yok (çıkmaz sokak) | High | Evet |
| Template bölgesi ekranda yok | Medium | Hayır |
| Ekranda `data-flow` yok / akışta geçip ekranda işaretlenmemiş | Medium | Hayır |
| Akışta `Dallar` yok; flows.md'de `## Ortak Davranış` yok | Medium | Hayır |
| Ortak Davranış'a aykırılık (review) | Medium — yıkıcı işlemde onay yoksa High | High ise evet |

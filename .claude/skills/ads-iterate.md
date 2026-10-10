---
name: ads-iterate
description: Mevcut bir tasarım projesini düzenler veya yeni özellikler ekler. Küçük değişiklikleri direkt uygular, büyük özellikleri design-plan.md'nin "Geliştirme Backlog'u" bölümüne planlar ve sırayla çalıştırır.
---

# Iterate — Mevcut Projeyi Geliştir

## Durum Yönetimi

Başlamadan önce mevcut state dosyasını kontrol et:
```bash
ls /tmp/ads-iterate-*.json 2>/dev/null
```
Dosya varsa kullanıcıya "kaldığım yerden devam et / yeni başlat" sor.
Her adım tamamlandığında `/tmp/ads-iterate-{RUN_ID}.json` dosyasını güncelle.
Başarıyla tamamlanınca dosyayı sil.

---

## Token Standartları

Token JSON'a dokunmadan önce `.claude/references/token-standards.md` dosyasını oku.
Geçerli source değerleri orada tanımlıdır — bu listede olmayan hiçbir source değeri yazılamaz.

---

## Ön Koşul Kontrolü

`project-state.md` dosyasını proje kökünde oku. Varsa:
- `cikti_formati`, `token_dosyasi`, `figma_linki` ve üretilen dosyaları buradan al
- Aşağıdaki manuel kontrolleri atla

`cikti_formati`, `platform` veya `token_dosyasi` alanlarından biri eksikse (eski projeler) builder'ı çalıştırmadan
önce yaz: çıktı türünü mevcut dosyalardan çıkar (`components/` / `screens/` HTML → `html`, Figma linki → `figma`),
emin değilsen kullanıcıya sor. Alanların anlamı: `ads-design-builder.md` → "project-state.md".

**Brief:** Proje kökünde `design-brief.md` varsa oku — projenin onaylı yönüdür (Tez, persona, seçilen estetik yön,
kritik heuristic'ler). Bu skill'de çalıştırılan builder, planner, ads-ux-designer ve reviewer'lara "stratejist brief'i"
olarak iletilir. İstek brief'in `Tez` / `Reddettiği kalıp` satırıyla açıkça çelişiyorsa uygulamadan önce söyle ve yönü
değiştirmek için `/ads-design-strategy` öner. Dosya yoksa (eski projeler) brief'siz devam et.

`project-state.md` yoksa aşağıdaki dosyaları manuel kontrol et:

| Dosya | Zorunlu mu? |
|-------|-------------|
| `spec.md` | Evet |
| `[proje-adı]-tokens.json` | Evet |
| `components/` veya `screens/` klasörü | En az biri |

Herhangi biri eksikse dur:
> "`[eksik dosya]` bulunamadı. Önce `/ads-spec-intake`, `/ads-token-generator` ve `/ads-design-strategy` adımlarını tamamlayın."

---

## Adım 1 — İsteği Al

Kullanıcıya sor:
> "Ne değiştirmek veya eklemek istiyorsunuz?"

Yanıtı al. Adım 2'ye geç.

---

## Adım 2 — Büyüklüğü Değerlendir

İsteği şu kriterlere göre değerlendir:

**Küçük değişiklik** — tek bir component veya ekranı etkiliyor, yeni akış gerektirmiyor:
- Renk, tipografi, boşluk düzenlemesi
- Tek bir component'a eleman ekleme
- Mevcut bir ekranın içeriğini güncelleme
→ **Adım 3A**'ya geç

**Büyük özellik** — birden fazla component veya ekran gerektiriyor, yeni user flow içeriyor:
- Yeni ekran ekleme
- Çok adımlı akış tasarımı
- Yeni component grubu
→ **Adım 3B**'ye geç

Sınırda kalıyorsa büyük kabul et.

### Yapı (flow ve template) — her iki yolda da

`project-state.md → yapi` alanı varsa `flows.md` ve `templates.md` bu projenin kalıcı yapı kaydıdır
(`.claude/references/structure-standards.md`). Etkilenen dosyaları sayarken:
- **Template değişikliği** (bölge, zorunlu durum, davranış): o template'i kullanan **tüm ekranlar** etkilenen dosyadır.
- **Akış değişikliği** (adım, dal, `Sonra`): o akışın ekranları + o akışı `Önkoşul` gösteren akışların ekranları
  etkilenen dosyadır.
- Yeni akış veya yeni ekran = büyük özellik (Adım 3B) ve kapsam ekleme; önce `flows.md` / `templates.md`'ye eklenir.

`yapi` alanı yoksa (katman öncesi kurulmuş proje) büyük özellikte bir kez sor:
> "Bu projede akış ve ekran tipi kaydı (flows.md, templates.md) yok. Bu özellikle birlikte oluşturayım mı?
> Sonraki değişikliklerde hangi ekranların etkilendiği buradan bulunur."
Evet → Adım 3B'de planner mevcut ekranlardan da çıkararak yazar, `yapi` alanı eklenir. Hayır → eski yolla devam.

### Bağlayıcı karar değişikliği (her iki yolda da)

Bu adım adStudio'da bağlayıcı bir kararın değiştirilmesinin tek yoludur; `/ads-design-strategy` de bunu kullanır.

Büyüklüğe karar verdikten sonra `spec.md → ## Bağlayıcı Kararlar` bölümünün **tamamını** oku. İstek bir
kararla çelişiyorsa uygulamadan önce sor. Builder bir çelişkiyi kendisi fark edip "karar güncelleme gerekli"
diye dönerse de bu adım çalışır.

**`[Korunan]` madde** (nav etiketi, sayfa yolu/dosya adı, form alanı adı veya sırası, logo, yasal metin,
analytics ID):

> "Bu değişiklik korunan **[madde]** öğesini etkiliyor. Korunma nedeni: [neden].
> Değiştirmek SEO, analytics veya kullanıcı alışkanlığını etkileyebilir.
> `[ ] Evet, değiştir — koruma kaydını güncelle`
> `[ ] Hayır, bu öğeye dokunmadan uygula`"

**Diğer kararlar** (ör. "Bu görsel yön kesin seçildi", "X artık kullanılmayacak"):

> "Bu istek [Tarih] tarihli kararla çelişiyor: **[karar]**.
> `[ ] Kararı güncelle — yeni hâli: [istekten çıkan yeni karar]`
> `[ ] Karar kalsın — isteği karara uyacak şekilde uygula`"

Sonuç:
- **Güncelle:** Bağlayıcı Kararlar'daki satırı yeni hâliyle değiştir ve sonuna
  `(güncellendi: [Tarih], önceki: [eski değer])` ekle. Ardından builder'ı **güncel kayıtla** çalıştır —
  builder kararı `spec.md`'den okur, eski hâli uygulamaz.
- **Kalsın:** Kayda dokunma. Builder'a kararın korunacağını ve isteğin hangi kısmının uygulanmayacağını ilet;
  kullanıcıya özette söyle.
- Kayıt güncellenmeden builder'a "kararı aşarak uygula" denmez.

### "Modernleştir" tipindeki istekler

İstek genel bir modernizasyon ise ("daha modern görünsün", "tazeleyelim") ve
extension-spec'te `Modernizasyon kapsamı` tanımlı değilse, değişiklikleri şu sırayla
öner ve kullanıcının seçtiği adımda dur: 1. Tipografi → 2. Boşluk ve ritim →
3. Renk ayarı (marka accent'i korunur) → 4. Hareket → 5. Hero / ana section kurgusu →
6. Blok değişimi. İlk dört adım yapısal değildir; 5 ve 6 büyük özellik (Adım 3B) olarak işlenir.

---

## Adım 3A — Küçük Değişiklik (Direkt Uygula)

`ads-design-builder` agent'ını çalıştır. Şunları ilet:
- Kullanıcının değişiklik isteği
- Hangi dosyanın etkileneceği (`components/` veya `screens/` altındaki ilgili dosya)
- `[proje-adı]-tokens.json` yolu
- Mevcut çıktı formatı (html veya figma — `project-state.md → cikti_formati`'dan oku)
- Dial'lar ve `color_scheme` (`spec.md → token_directives`), korunan öğe kararı (varsa)
- `flows.md` ve `templates.md` yolları (`yapi` varsa)

Builder değişikliği uygular, etkilenen dosyayı günceller ve Pre-flight raporu döndürür.

### Review — Etki Bazlı

Builder'ın güncellediği dosya sayısını say:

**1 dosya etkilendiyse — hafif review:**
Yalnızca değiştirilen dosyayı kontrol et:
- Token değerleri doğru bağlanmış mı?
- AI tells yasak deseni girilmiş mi? (em-dash / en-dash dahil)
- Tutarlılık kilitleri bozulmuş mu (yeni bir accent rengi, farklı radius, aynı amaçlı ikinci CTA etiketi)?
- `[Korunan]` öğelerden biri onaysız değişmiş mi?
- **Tipografi ve kontrast (her zaman zorunlu):**
  - Body/label/caption metinleri ≥ 14px mi? (önerilen ≥ 16px)
  - `font-size` değerleri doğrudan pixel olarak belirtilmiş mi, yoksa token'a mı bağlı?
  - Metin rengi ile arka plan rengi arasındaki kontrast oranı WCAG AA karşılıyor mu? (normal metin ≥ 4.5:1, büyük metin ≥ 3:1)
  - Kontrast değerlerini token JSON'dan veya hesaplayarak doğrula; "büyük ihtimalle uyuyor" kabul etme.
  - `color_scheme: both` ise kontrastı koyu temada da kontrol et.
- **Yapı** (`yapi` varsa): ekranın template'inin zorunlu durumları ve bölgeleri duruyor mu; akış dalları (hata,
  iptal onayı) ve `Sonra` bağlantısı bozulmuş mu; boş durum çıkmaz sokak mı; değişiklik `## Ortak Davranış`'a
  aykırı mı (`structure-standards.md → Denetim özeti`).

HTML çıktısında ayrıca `node scripts/test/run-all.mjs` çalıştır.
Bulguları `etki` ve `teslimi engeller` alanlarıyla sınıflandır (`references/reviewer-checklist.md → Seviye Ölçeği`).
Teslim engeli varsa `ads-design-strategy.md → Adım 6` döngüsünü uygula (en fazla 2 tur); yeniden kontrol
yukarıdaki maddeler + `run-all.mjs`'tir (kontrast/boyut değerleri gerçekten düzelmiş mi doğrula).

**2+ dosya etkilendiyse — tam review:**
`ads-design-reviewer` ve `ads-ux-reviewer`'ı paralel çalıştır, ardından `ads-design-strategy.md → Adım 6` döngüsünü
ve teslim kapısını uygula.

`design-plan.md` varsa `## Geliştirme Backlog'u` bölümüne tamamlanmış olarak ekle:
```
- [x] [Tarih] Küçük düzenleme: [kullanıcının isteği]
```

---

## Adım 3B — Büyük Özellik (Planla ve Uygula)

### Plan

Önce bu iterasyon için bir çalışma kimliği üret: `date +%Y%m%d-%H%M` (örn. `20261002-1415`).

`ads-design-planner` agent'ını **iterasyon modunda** çalıştır. Şunları ilet:
- **Çalışma kimliği**
- Kullanıcının özellik isteği
- `spec.md` içeriği
- `[proje-adı]-tokens.json` yolu
- Mevcut çıktı formatı
- **Mod:** `iterasyon` — planner yeni görevleri `design-plan.md`'nin `## Geliştirme Backlog'u` bölümüne yazar, `## İlk Tasarım` bölümüne dokunmaz
- `flows.md` ve `templates.md` yolları (`yapi` varsa; yoksa yukarıdaki soruya verilen cevap)

Planner şunları üretir:
- Özelliği görevlere böler (katman sırasına göre)
- Yeni akışı `flows.md`'ye `Önkoşul` / `Sonra` ile **ekler**, ekranlarını mevcut template'lere bağlar (gerekirse yeni
  template ekler); var olan akışları yalnızca özellik gerektiriyorsa ve bunu göstererek değiştirir
- User flow boşluklarını tespit eder
- Kullanıcıya onaylatır

### Onay

Kullanıcıdan onay al:
> "Bu özellik için [n] görev planlandı. [design-plan.md → Geliştirme Backlog'u bölümünde görebilirsiniz.]
> Başlayalım mı?"

### Token Kapsam Kontrolü

Onay alındıktan sonra, UX tasarımına geçmeden önce planner'ın oluşturduğu component listesini mevcut `[proje-adı]-tokens.json` ile karşılaştır:

- Listede yeni bir component tipi var mı (mevcut token'larda karşılığı olmayan avatar, chip, modal, indeks şeridi vb.)?
- Varsa kullanıcıya bildir:

> "Bu özellik için [yeni component listesi] mevcut token setinde tam karşılığı olmayan değerler içerebilir. Devam etmeden önce `/ads-token-generator` çalıştırmanızı öneririm — eksik token'lar eklensin mi?"

Kullanıcı evet derse: `/ads-token-generator` çalıştırılana kadar bekle, ardından devam et.
Kullanıcı hayır derse veya yeni component tipi yoksa: doğrudan UX tasarımına geç.

### UX Tasarımı

Onay gelince önce `ads-ux-designer` agent'ını çalıştır. Şunları ilet:
- **Çalışma kimliği**
- Backlog'a eklenen yeni görevler
- `spec.md` içeriği
- `[proje-adı]-tokens.json` yolu
- `flows.md` ve `templates.md` yolları

Agent her görev için UX pattern seçer ve spec'leri `ux-specs.md`'ye, bu iterasyonun kendi bölümüne ekler
(ilk tasarımın ve önceki iterasyonların spec'leri korunur).

### Uygula

Builder'ı başlatmadan önce `ads-design-strategy.md → Adım 3c → Adım 4 Geçiş Kontrolü`nü bu iterasyonun
çalışma kimliğiyle uygula. Kontrol geçince `ads-design-builder` agent'ını çalıştır:
- `design-plan.md`'nin `## Geliştirme Backlog'u` bölümündeki yeni görevler ve **çalışma kimliği**
- `ux-specs.md` yolu (builder bu çalışmanın bölümünü `run=` kimliğiyle bulur)
- `flows.md` ve `templates.md` yolları
- `[proje-adı]-tokens.json` yolu
- Mevcut çıktı formatı

Builder görevleri sırayla işler; tamamlananları `[x]` olarak işaretler.

### Review

Büyük özellik tamamlandıktan sonra `ads-design-reviewer` ve `ads-ux-reviewer`'ı paralel çalıştır, ardından
`ads-design-strategy.md → Adım 6` döngüsünü ve teslim kapısını uygula.

---

## Adım 4 — Tamamlama Raporu

```
Teslim durumu: [Teslime hazır | İstisna onayıyla teslim edilebilir — n istisna | Teslime hazır değil — n açık engel: B1 …]   (ads-design-strategy Adım 6)
✓ Proje: [proje adı]
✓ Değişiklik: [kullanıcının isteği özeti]
✓ Etkilenen dosyalar: [liste]
✓ Backlog durumu: [n] tamamlandı / [n] bekliyor
```

Bekleyen görev varsa kullanıcıya bildir:
> "`design-plan.md` → Geliştirme Backlog'u bölümünde [n] görev daha var. Devam etmek için `/ads-iterate` çalıştırın."

**Çapraz sayfa hatırlatması:** Etkilenen dosya sayısı 2 veya daha fazlaysa rapora şunu ekle:
> "Birden fazla sayfada değişiklik yapıldı. Sunum öncesinde tutarlılık kontrolü için `/ads-check` çalıştırmanızı öneririm."

---

## Adım 5 — Bağlayıcı Karar Kontrolü

Tamamlama raporundan sonra şunu sor:

> "Bu iterasyonda kalıcı bir tasarım kararı aldık mı? (örn. 'X hep böyle kalacak', 'Y artık kullanılmayacak')"

Kullanıcı evet derse veya konuşmada açıkça bağlayıcı bir karar geçtiyse:
- `spec.md`'nin `## Bağlayıcı Kararlar` bölümünü oku
- Bölüm yoksa oluştur
- Kararı şu formatta ekle:

```
- [Tarih] [Karar] — [bağlam: hangi component, neden]
```

Örnek:
```
- [2026-09-02] Navigation arka planı hep --color-nav-bg token'ı ile kalacak, hardcode renk kullanılmayacak — sidebar yeniden tasarımı sırasında kararlaştırıldı
- [2026-09-02] Kartlarda box-shadow kullanılmayacak — flat design yönü benimsendi
```

Kaydettikten sonra bildir:
> "`spec.md → Bağlayıcı Kararlar` bölümüne eklendi. Bir sonraki konuşmada tüm agent'lar bu kararı otomatik olarak uygular."

---

## Kısıtlamalar

- `spec.md`'nin `## Bağlayıcı Kararlar` bölümü dışında spec.md'yi değiştirmez
- `## İlk Tasarım` bölümüne dokunmaz
- Framework dönüşümü yapmaz (React, Vue, React Native — ileride eklenecek)

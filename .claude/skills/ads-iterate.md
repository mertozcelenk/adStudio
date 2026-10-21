---
name: ads-iterate
description: Mevcut bir tasarım projesini düzenler veya yeni özellikler ekler. İşi üç seviyeden birine yönlendirir — küçük değişikliği direkt uygular, mevcut şablondan yeni ekranı birleşik plan + tek reviewer ile, yeni akışı tam süreçle (planner, UX, iki reviewer) yapar.
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

İstek komutla birlikte (`/ads-iterate <istek>`) ya da konuşmada az önce verildiyse tekrar sorma, doğrudan Adım 2'ye geç.
İstek yoksa sor:
> "Ne değiştirmek veya eklemek istiyorsunuz?"

Yanıtı al. Adım 2'ye geç.

---

## Adım 2 — Seviyeyi Değerlendir

Seviye ekran sayısına değil, **yeni karar ihtiyacına ve etkiye** göre seçilir:

**Küçük değişiklik** — tek bir component veya ekranı etkiliyor, yeni akış gerektirmiyor:
- Renk, tipografi, boşluk düzenlemesi
- Tek bir component'a eleman ekleme
- Mevcut bir ekranın içeriğini güncelleme
→ **Adım 3A**

**Şablondan yeni ekran (orta)** — yeni ekran veya ekranın büyük bir genişlemesi, ama üçü birden doğru:
- `templates.md`'deki **mevcut** bir template'e oturuyor (yeni template gerekmiyor)
- Mevcut bir akışın varyantı ya da tek adımlık yeni giriş (yeni çok adımlı akış yok)
- Yeni bir etkileşim modeli yok (yeni wizard, yeni sürükle-bırak, yeni gerçek zamanlı davranış değil)

Örnek: mevcut T-CHART'tan "Person Organization Chart" ekranı; mevcut T-LIST'ten yeni bir liste ekranı.
→ **Adım 3B**

**Yeni akış / karmaşık özellik (büyük)** — yeni çok adımlı akış, yeni template, yeni etkileşim modeli ya da birden
fazla akışı değiştiren iş. Örnek: yeni ödeme akışı, yetki wizard'ına yeni adım dalı.
→ **Adım 3C**

Seviyeyi orkestratör **önerir**, kullanıcı onaylar (Soru durağı 1). Kendi başına kesinleştirme.

### Soru durakları (orta ve büyük)

Kullanıcıya iş başına **en fazla iki durakta** soru sorulur; her durak tek bir soru penceresidir (birden çok soru
aynı pencerede). Agent'lar hiçbir açık kararı kendi başına seçmez (varsayım yok) — kararı bir sonraki durağa taşır.

- **Durak 1 — işe başlarken:** seviye önerisi (gerekçesi ve örnekle) + istekte baştan görünen açık ürün kararları
  (ör. "sayfa ilk açıldığında ne görünsün?"). Claude Code plan modunda plan onaylandıysa o onay Durak 1 sayılır;
  plan bu soruları içermeli.
- **Durak 2 — plan yazıldıktan sonra:** plan özeti (görev ve ekran sayısı) + planner'ın döndürdüğü açık kararlar +
  token kapsam uyarısı (varsa) + başlama onayı. Ayrıca "Başlayalım mı?" diye sorulmaz; Durak 2'deki onay başlama onayıdır.
- **Aynı kararı iki kez sorma.** Kullanıcının bu konuşmada verdiği her karar (Durak 1 cevapları, plan modu onayındaki
  kararlar) planner'a **onaylı kararlar** olarak iletilir; planner bunları açık karar olarak döndürmez, orkestratör
  yeniden sormaz.
- İş sırasında gerçekten yeni ortaya çıkan kapsam kararı (`ads-design-strategy.md → Adım 6 → Kapsam kararı`) ayrıca sorulur.

### Bağlam paketi (orta ve büyük)

Büyük proje dosyalarını (`ux-specs.md`, `design-plan.md`, `project-state.md`) her agent'a baştan okutmamak için:

1. Çalışma kimliği üret: `date +%Y%m%d-%H%M`.
2. İsteği ve onaylı kararları `.ads/request-<kimlik>.md` dosyasına yaz (kullanıcının cümlesi + Durak cevapları).
3. Anahtarları belirle: etkilenen ekran dosya adları, template ve akış kimlikleri, ana component adları
   (ör. `T-CHART,org-chart,F-02,org-node`).
4. `node scripts/test/context-pack.mjs --run <kimlik> --keys "<anahtarlar>" --request-file .ads/request-<kimlik>.md`
   → `.ads/context-<kimlik>.md`. Planner / UX yazdıktan sonra, builder'dan önce **yeniden çalıştır** (paket yeni plan
   ve spec bölümünü alır).
5. Her agent'a paket yolunu ilet. Agent'lar önce paketi okur; pakette olmayan bilgi için büyük dosyada yalnızca o
   bölümü arar (`grep -n` + aralık), dosyanın tamamını okumaz.

### Yapı (flow ve template) — her seviyede

`project-state.md → yapi` alanı varsa `flows.md` ve `templates.md` bu projenin kalıcı yapı kaydıdır
(`.claude/references/structure-standards.md`). Etkilenen dosyaları sayarken:
- **Template değişikliği** (bölge, zorunlu durum, davranış): o template'i kullanan **tüm ekranlar** etkilenen dosyadır.
- **Akış değişikliği** (adım, dal, `Sonra`): o akışın ekranları + o akışı `Önkoşul` gösteren akışların ekranları
  etkilenen dosyadır.
- Yeni ekran (Adım 3B) ve yeni akış (Adım 3C) kapsam eklemedir; önce `flows.md` / `templates.md`'ye eklenir.

`yapi` alanı yoksa (katman öncesi kurulmuş proje) orta veya büyük işte Durak 1'de sor:
> "Bu projede akış ve ekran tipi kaydı (flows.md, templates.md) yok. Bu özellikle birlikte oluşturayım mı?
> Sonraki değişikliklerde hangi ekranların etkilendiği buradan bulunur."
Evet → planner mevcut ekranlardan da çıkararak yazar, `yapi` alanı eklenir. Hayır → eski yolla devam.

### Bağlayıcı karar değişikliği (her seviyede)

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
6. Blok değişimi. İlk dört adım yapısal değildir; 5 ve 6 seviyesine göre Adım 3B veya 3C olarak işlenir.

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

Builder'ın güncellediği dosya sayısını say. **Figma çıktısında birim ekrandır:** bir ekranın ana frame'i ve durum
frame'leri tek ekran sayılır; değişen component'ler ayrıca sayılmaz, onları kullanan ekranlarla birlikte değerlendirilir.
`flows.md` / `templates.md` düzenlemeleri sayıma girmez (yapı etkisi yukarıdaki "Yapı" kuralıyla bulunur).
**Ortak stil değişikliği tek değişiklik sayılır:** yalnızca ortak bir stil dosyası (ortak CSS, token değeri, Figma'da
bir component'in stili) değiştiyse ve ekranların içeriği ya da yapısı değişmediyse hafif review uygulanır; HTML'de
testler bu durumda `--only screens/` ile tüm ekranlarda çalışır. Tam review, 2 veya daha fazla ekranın içeriği ya da yapısı değiştiğinde çalışır.

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

HTML çıktısında ayrıca otomatik testleri yalnızca etkilenen dosyalarda çalıştır:
`node scripts/test/run-all.mjs --only <değişen ekran / component dosyaları, virgülle>`; ortak stil (ortak CSS, token
değeri) değiştiyse `--only screens/`. Builder testleri bu kapsamla zaten çalıştırdıysa `test-results.json`'u oku, yeniden
çalıştırma. Tamamlama raporuna şunu ekle: "Testler yalnızca etkilenen dosyalarda çalıştı; birkaç küçük değişiklikten
sonra gerekirse `/ads-check` çalıştırın." Tam review yolunda ve `/ads-design-strategy`'de testler tüm projede çalışır. Figma çıktısında hafif review bulgularını gösterdikten
sonra ayrıntılı inceleme sorusunu sor (`ads-design-strategy.md → Quick mod → madde 4`); evet → iki reviewer + Adım 6.
Bulguları `etki` ve `teslimi engeller` alanlarıyla sınıflandır (`references/rules.md → Seviye Ölçeği`).
Teslim engeli varsa `ads-design-strategy.md → Adım 6` döngüsünü uygula (en fazla 2 tur); yeniden kontrol
yukarıdaki maddeler + `run-all.mjs`'tir (kontrast/boyut değerleri gerçekten düzelmiş mi doğrula).

**2+ dosya etkilendiyse — tam review** (ortak stil değişikliği istisnası yukarıda):
`ads-design-reviewer` ve `ads-ux-reviewer`'ı paralel çalıştır, ardından `ads-design-strategy.md → Adım 6` döngüsünü
ve teslim kapısını uygula.

`design-plan.md` varsa `## Geliştirme Backlog'u` bölümüne tamamlanmış olarak ekle:
```
- [x] [Tarih] Küçük düzenleme: [kullanıcının isteği]
```

---

## Adım 3B — Şablondan Yeni Ekran (birleşik plan, tek reviewer)

1. **Bağlam paketi** (Adım 2 → Bağlam paketi).
2. **Plan + UX spec:** `ads-design-planner`'ı **birleşik modda** çalıştır. İlet:
   - **Çalışma kimliği**, kullanıcının isteği, **onaylı kararlar** (Durak 1 ve plan modu onayı)
   - Bağlam paketi yolu, `[proje-adı]-tokens.json` yolu, çıktı formatı
   - **Mod:** `birleşik` — görevleri `design-plan.md → ## Geliştirme Backlog'u`'na, UX spec'leri `ux-specs.md`'ye,
     gerekirse akış / template eklerini `flows.md` / `templates.md`'ye yazar (`ads-design-planner.md → Birleşik mod`)

   Planner açık kararları seçmeden döndürür; kendisi kullanıcıya sormaz.
3. **Durak 2** (Adım 2 → Soru durakları): plan özeti + açık kararlar + token kapsam (aşağıdaki **Token Kapsam
   Kontrolü**) + başlama onayı, tek soru penceresinde. Cevapları `.ads/request-<kimlik>.md`'ye ekle ve
   `design-plan.md`'deki ilgili karar satırına `Edit` ile işle (ör. `K-1: Fullscreen kalsın — onay: kullanıcı`).
4. **Geçiş kontrolü:** `node scripts/test/plan-gate.mjs --run <kimlik>` (`ads-design-strategy.md → Adım 3c → Adım 4 Geçiş Kontrolü`).
5. **Paketi yeniden üret**, ardından `ads-design-builder`'ı çalıştır: görevler, çalışma kimliği, paket yolu,
   tokens yolu, çıktı formatı. Builder görevleri sırayla işler; tamamlananları `[x]` olarak işaretler.
6. **Review — tek birleşik reviewer:** `ads-design-reviewer`'ı **birleşik modda** çalıştır (tasarım + UX kontrol
   listesi tek agent'ta; `ads-design-reviewer.md → Birleşik mod`). Ardından `ads-design-strategy.md → Adım 6`
   döngüsünü ve teslim kapısını uygula; yeniden kontrolü de birleşik reviewer yapar.

---

## Adım 3C — Yeni Akış / Karmaşık Özellik (tam süreç)

### Plan

Bağlam paketini üret (Adım 2 → Bağlam paketi). `ads-design-planner` agent'ını **iterasyon modunda** çalıştır. Şunları ilet:
- **Çalışma kimliği**
- Kullanıcının özellik isteği ve **onaylı kararlar**
- Bağlam paketi yolu (spec, brief, akış ve template bölümleri buradan; `spec.md`'nin tamamını iletme)
- `[proje-adı]-tokens.json` yolu
- Mevcut çıktı formatı
- **Mod:** `iterasyon` — planner yeni görevleri `design-plan.md`'nin `## Geliştirme Backlog'u` bölümüne yazar, `## İlk Tasarım` bölümüne dokunmaz
- `flows.md` ve `templates.md` yolları (`yapi` varsa; yoksa Durak 1'deki cevap)

Planner şunları üretir:
- Özelliği görevlere böler (katman sırasına göre)
- Yeni akışı `flows.md`'ye `Önkoşul` / `Sonra` ile **ekler**, ekranlarını mevcut template'lere bağlar (gerekirse yeni
  template ekler); var olan akışları yalnızca özellik gerektiriyorsa ve bunu göstererek değiştirir
- User flow boşluklarını ve açık kararları tespit eder; kullanıcıya kendisi sormaz, orkestratöre döndürür

### Onay — Durak 2

Planner dönünce **tek soru penceresinde** sor: plan özeti ("Bu özellik için [n] görev planlandı —
design-plan.md → Geliştirme Backlog'u"), planner'ın açık kararları, token kapsam uyarısı (aşağıda) ve başlama onayı.
Ayrı bir "Başlayalım mı?" sorusu sorma.

### Token Kapsam Kontrolü

Durak 2'den **önce** planner'ın oluşturduğu component listesini mevcut `[proje-adı]-tokens.json` ile karşılaştır
(soru Durak 2'ye girsin):

- Listede yeni bir component tipi var mı (mevcut token'larda karşılığı olmayan avatar, chip, modal, indeks şeridi vb.)?
- Varsa Durak 2'ye şu soruyu ekle:

> "Bu özellik için [yeni component listesi] mevcut token setinde tam karşılığı olmayan değerler içerebilir. Devam etmeden önce `/ads-token-generator` çalıştırmanızı öneririm — eksik token'lar eklensin mi?"

Kullanıcı evet derse: `/ads-token-generator` çalıştırılana kadar bekle, ardından devam et.
Kullanıcı hayır derse veya yeni component tipi yoksa: doğrudan UX tasarımına geç.

### UX Tasarımı

Onay gelince önce `ads-ux-designer` agent'ını çalıştır. Şunları ilet:
- **Çalışma kimliği**
- Backlog'a eklenen yeni görevler ve onaylı kararlar
- Bağlam paketi yolu
- `[proje-adı]-tokens.json` yolu
- `flows.md` ve `templates.md` yolları

Agent her görev için UX pattern seçer ve spec'leri `ux-specs.md`'ye, bu iterasyonun kendi bölümüne ekler
(ilk tasarımın ve önceki iterasyonların spec'leri korunur).

### Uygula

Builder'ı başlatmadan önce `ads-design-strategy.md → Adım 3c → Adım 4 Geçiş Kontrolü`nü bu iterasyonun
çalışma kimliğiyle uygula ve **bağlam paketini yeniden üret**. Kontrol geçince `ads-design-builder` agent'ını çalıştır:
- `design-plan.md`'nin `## Geliştirme Backlog'u` bölümündeki yeni görevler ve **çalışma kimliği**
- Bağlam paketi yolu (plan ve UX spec bölümü pakette)
- `flows.md` ve `templates.md` yolları
- `[proje-adı]-tokens.json` yolu
- Mevcut çıktı formatı

Builder görevleri sırayla işler; tamamlananları `[x]` olarak işaretler.

### Review

Özellik tamamlandıktan sonra `ads-design-reviewer` ve `ads-ux-reviewer`'ı paralel çalıştır (ikisine de paket yolu),
ardından `ads-design-strategy.md → Adım 6` döngüsünü ve teslim kapısını uygula.

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

**Çapraz sayfa hatırlatması:** Etkilenen dosya (Figma'da ekran) sayısı 2 veya daha fazlaysa rapora şunu ekle:
> "Birden fazla sayfada değişiklik yapıldı. Sunum öncesinde tutarlılık kontrolü için `/ads-check` çalıştırmanızı öneririm."

**Aşama sonu hatırlatması** (Adım 5'ten sonra, mesajın son satırı; backlog'da bekleyen görev olsa da). Önce kayıt kontrolü:
konuşmada geçen kalıcı kararlar `spec.md → Bağlayıcı Kararlar`'da, durum `project-state.md`'de mi? Eksikse önce yaz.
> "Bu aşama bitti, kayıtlar dosyalarda. Maliyeti düşürmek için `/clear` yazabilir ya da oturumu yeniden açabilirsin; `/ads-iterate` ile kaldığın yerden devam edersin."

---

## Adım 5 — Bağlayıcı Karar Kontrolü

Konuşmada bir karar sinyali geçtiyse ("hep böyle kalsın", "artık kullanılmayacak", "her yerde böyle olsun") tamamlama
raporundan sonra şunu sor; sinyal yoksa sorma, rapora `Kalıcı karar: yok` yaz:

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

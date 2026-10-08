---
name: ads-import
description: Hali hazırda var olan bir projeyi adStudio pipeline'ına dahil eder. Proje klasörünü otomatik tarar, senaryoyu tespit eder ve doğru akışı başlatır. adStudio ile üretilmiş proje, dışarıdan HTML/CSS projesi veya Figma projesi — üç senaryoyu da destekler.
---

# Import — Mevcut Projeyi Pipeline'a Dahil Et

## Durum Yönetimi

Başlamadan önce mevcut state dosyasını kontrol et:
```bash
ls /tmp/ads-import-*.json 2>/dev/null
```
Dosya varsa kullanıcıya "kaldığım yerden devam et / yeni başlat" sor.
Her adım tamamlandığında `/tmp/ads-import-{RUN_ID}.json` dosyasını güncelle.
Başarıyla tamamlanınca dosyayı sil.

---

## Adım 1 — adStudio İmzasını Kontrol Et

İlk olarak `spec.md` içinde adStudio imzasını ara:

```bash
grep -q "produced_by: adStudio" spec.md 2>/dev/null
```

**İmza bulunduysa** → Kesin adStudio projesi. Adım 2 → Senaryo 1'e git. Başka kontrol gerekmez.

**İmza bulunamadıysa** → Adım 1b'ye geç.

## Adım 1b — Proje Klasörünü Tara

Proje kökünde şu dosya ve klasörlerin varlığını kontrol et:

| Sinyal | Kontrol |
|--------|---------|
| `spec.md` + `[herhangi-ad]-tokens.json` | adStudio projesi olabilir (imzasız) |
| `project-state.md` | adStudio state dosyası |
| `components/` veya `screens/` | HTML/CSS çıktı klasörleri |
| `*.html` (kök veya alt klasörlerde) | Dışarıdan HTML projesi |
| Kullanıcının verdiği Figma linki | Figma projesi |

---

## Adım 2 — Senaryoyu Tespit Et ve Onayla

Tarama sonucuna göre senaryoyu belirle ve kullanıcıya onayla:

### Senaryo 1 — adStudio Projesi

**Tespit:** `spec.md` + `[ad]-tokens.json` ikisi de varsa.

Kullanıcıya söyle:
> "Bu proje adStudio ile üretilmiş görünüyor. `spec.md` ve token seti mevcut.
> Doğrudan devam edebiliriz.
>
> Ne yapmak istiyorsunuz?
> `[ ] Tasarımı düzenle veya yeni özellik ekle` → `/ads-iterate`
> `[ ] Sunumu gerçek projeye taşı` → `/ads-promote`
> `[ ] Çıktı formatını değiştir (HTML/CSS ↔ Figma)` → `/ads-migrate`"

Seçime göre ilgili skill'i başlat. Onboard tamamlandı.

---

### Senaryo 2 — Dışarıdan HTML/CSS Projesi

**Tespit:** `spec.md` yok ama `components/`, `screens/` veya kök dizinde `.html` dosyaları var.

Kullanıcıya söyle:
> "Dışarıdan gelmiş bir HTML/CSS projesi tespit ettim. Pipeline'a dahil etmek için
> önce mevcut sistemi tarayıp token seti oluşturmam gerekiyor.
>
> Şu adımları sırayla çalıştıracağım:
> 1. `/ads-context-scanner` — mevcut HTML/CSS'i tara
> 2. `/ads-token-generator` — taranan değerlerden token seti üret
> 3. `/ads-spec-intake` — proje spec'ini oluştur
> 4. `/ads-design-strategy` — buradan devam
>
> Başlayalım mı?"

Onay gelince:

**Adım 2a — context-scanner**
`context-scanner` skill'ini çağır. Proje kökünü ve tüm `.html` dosyalarını ilet.
Scanner şunları çıkarır: renk paleti, tipografi, boşluk örüntüleri, component listesi,
Korunacaklar Envanteri ve mevcut dial okuması.

**Adım 2a' — Çalışma modu ve Korunacaklar**
Scanner bitince `ads-impact-analysis` skill'inin **"0. Çalışma Modu"** bölümünü uygula
(mod sorusu + Korunacaklar onayı + gerekiyorsa modernizasyon kapsamı).
Bu aşamada spec.md henüz yok — onaylanan listeyi not al, Adım 2c'de spec-intake'e ilet.

**Adım 2b — token-generator**
`token-generator` skill'ini çağır. Şunu ilet:
- Scanner'ın çıkardığı değerler
- `source: "reference_derived"` — tüm değerler mevcut projeden geliyor

Token dosyası üretilince devam et.

**Adım 2c — spec-intake**
`spec-intake` skill'ini çağır. Scanner bulgularını arka plan bilgisi olarak ilet —
spec-intake kullanıcıya S1-S5 sorularını sorar, proje brief'ini tamamlar.
Şunları da ilet:
- Onaylanmış Korunacaklar listesi → spec-intake bunları `## Bağlayıcı Kararlar`'a `[Korunan]` olarak yazar
- Çalışma modu ve modernizasyon kapsamı → spec'in "Amaç ve Kapsam" bölümüne
- Mevcut dial okuması → "Redesign – Koruyarak" modunda S1/S2/S5 sorularında
  varsayılan öneri olarak gösterilir ("Mevcut site: Minimal, Dengeli, Ölçülü görünüyor — korunsun mu?")

**Adım 2d — design-strategy**
`design-strategy` skill'ini başlat. Onboard tamamlandı.

---

### Senaryo 3 — Figma Projesi

**Tespit:** Kullanıcı Figma linki verdi veya `spec.md` yok ve HTML/CSS de yok.

Kullanıcıya sor:
> "Figma projesinin linkini paylaşır mısınız?"

Link alındıktan sonra:

**Adım 3a — Figma bağlantısı kontrolü**
`mcp__figma-desktop__get_metadata` ile bağlantıyı test et.
Başarısızsa `reference-ingest`'teki Chrome kontrol akışını uygula.

**Adım 3a' — Çalışma modu ve Korunacaklar**
Figma dosyasında nav etiketleri, form alanları, logo ve yasal metinler gibi
korunması gerekebilecek öğeleri `get_metadata` / `get_design_context` ile tespit et
(context-scanner'ın "Korunacaklar Envanteri" tablosundaki A/B kolonları), ardından
`ads-impact-analysis`'in **"0. Çalışma Modu"** bölümünü uygula. Onaylanan listeyi not al.

**Adım 3b — spec-intake**
`spec-intake` skill'ini çağır. Figma linkini `reference-ingest` için ilet —
Figma'dan token değerleri çekilir, spec'e eklenir. Onaylanmış Korunacaklar listesini
ve çalışma modunu da ilet (Senaryo 2, Adım 2c ile aynı kural).

**Adım 3c — token-generator**
`token-generator` skill'ini çağır. Figma'dan çekilen değerleri `reference_derived`
olarak işaretleyerek token seti oluştur.

**Adım 3d — design-strategy**
`design-strategy` skill'ini başlat. Onboard tamamlandı.

---

### Senaryo Tespit Edilemedi

Hiçbir sinyal yoksa kullanıcıya sor:

> "Projeyi tanımlamak için bir başlangıç noktasına ihtiyacım var.
> Elinizde ne var?
>
> `[ ] adStudio ile üretilmiş proje` — spec.md ve tokens.json var
> `[ ] HTML/CSS dosyaları` — klasör veya dosya yolunu paylaşın
> `[ ] Figma projesi` — Figma linkini paylaşın
> `[ ] Sıfırdan başlıyorum` — `/ads-spec-intake` ile başla"

Seçime göre ilgili senaryoya geç.

---

## Kısıtlamalar

- Mevcut proje dosyalarını değiştirmez — yalnızca okur
- `spec.md` veya token dosyası oluşturmaz — ilgili skill'lere devreder
- Framework dönüşümü yapmaz (React, Vue, React Native — ileride eklenecek)

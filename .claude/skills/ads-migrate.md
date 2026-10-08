---
name: ads-migrate
description: Mevcut bir tasarım projesinin çıktı formatını değiştirir — HTML/CSS'i Figma'ya veya Figma'yı HTML/CSS'e taşır. Tasarım değişmez, yalnızca format dönüşümü yapılır. Proje zaten üretim aşamasındayken çağrılır.
---

# Migrate — Format Dönüşümü

## Durum Yönetimi

Başlamadan önce mevcut state dosyasını kontrol et:
```bash
ls /tmp/ads-migrate-*.json 2>/dev/null
```
Dosya varsa kullanıcıya "kaldığım yerden devam et / yeni başlat" sor.
Her adım tamamlandığında `/tmp/ads-migrate-{RUN_ID}.json` dosyasını güncelle.
Başarıyla tamamlanınca dosyayı sil.

---

## Token Standartları

Token JSON'a dokunmadan önce `.claude/references/token-standards.md` dosyasını oku.
Geçerli source değerleri orada tanımlıdır — bu listede olmayan hiçbir source değeri yazılamaz.

---

## Ön Koşul Kontrolü

`project-state.md` dosyasını proje kökünde oku. Varsa:
- `cikti_formati`, `token_dosyasi`, `figma_linki` ve üretilen dosyaları buradan al
- Adım 1'deki yön sorusunda mevcut formatı kullanıcıya göster
- Aşağıdaki manuel kontrolleri atla

Yön seçildikten sonra, dönüşüme başlamadan önce `project-state.md`'nin başlık alanlarını yaz: `cikti_formati`
**hedef** formatla (HTML → Figma ise `figma`); `platform` (`spec.md`'den) ve `token_dosyasi` dosyada yoksa onları da
(dosya yoksa oluştur). Testler artık hedef çıktıya göre uygulanır. Alanların anlamı:
`ads-design-builder.md` → "project-state.md".

`project-state.md` yoksa aşağıdaki dosyaları manuel kontrol et:

| Dosya | Zorunlu mu? |
|-------|-------------|
| `spec.md` | Evet |
| `[proje-adı]-tokens.json` | Evet |

Herhangi biri eksikse dur:
> "`[eksik dosya]` bulunamadı. `/ads-spec-intake` ve `/ads-token-generator` adımlarının tamamlanmış olması gerekiyor."

---

## Adım 1 — Yön Sorusu

Kullanıcıya sor:

> "Hangi yönde dönüşüm yapmak istiyorsunuz?
>
> `[ ] HTML/CSS → Figma` — mevcut HTML/CSS dosyaları Figma'ya aktarılır
> `[ ] Figma → HTML/CSS` — Figma dosyasındaki tasarımlar HTML/CSS olarak üretilir"

---

## Adım 2A — HTML/CSS → Figma

### Kaynak kontrolü

`components/` ve `screens/` klasörlerini kontrol et. Hiç `.html` dosyası yoksa dur:
> "Aktarılacak HTML/CSS çıktısı bulunamadı. Önce `/ads-design-strategy` ile tasarımları üretin."

### Figma bağlantısı

Kullanıcıya sor:
> "Tasarımları eklemek istediğiniz Figma dosyasının linkini paylaşır mısınız?"

Link alındıktan sonra aşağıdaki sırayı **kesinlikle bu sırayla** uygula:

**Aşama 1 — Token'ları Figma değişkeni olarak oluştur**
`figma-use` skill'ini çağır; `[proje-adı]-tokens.json` içindeki tüm
koleksiyonları (`Primitives`, `Color`, `Typography`, `Layout`, `Component`,
`Viewport`) Figma local variables olarak oluştur.

**Aşama 2 — Oluşturulan değişken ID'lerini oku**
`use_figma` ile yerel değişkenleri sorgula ve tam ID haritasını al:
```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variables = await figma.variables.getLocalVariablesAsync();
return { collections: collections.map(c => ({ id: c.id, name: c.name })),
         variables: variables.map(v => ({ id: v.id, name: v.name, collectionId: v.variableCollectionId })) };
```
Bu haritayı Aşama 3'e ilet — atla.

**Aşama 3 — Frame'leri oluştur ve değişkenleri bağla**
`figma-generate-design` skill'ini çağır. Şunları açıkça ilet:
- Her HTML ekranının dosya yolu
- Aşama 2'den gelen tam değişken ID haritası
- Talimat: değişkenleri `get_libraries` ile değil, **Aşama 2'nin ID haritasından** bul; hardcode renk/spacing kullanma.

Figma bağlantısı başarısız olursa `ads-design-builder.md → Adım 0` sorun giderme akışını uygula.

### Tamamlama

> "Aktarım tamamlandı.
> ✓ Token'lar Figma değişkenlerine eklendi
> ✓ [n] ekran Figma frame'ine dönüştürüldü
> HTML/CSS dosyaları değiştirilmedi — her iki format da güncel."

---

## Adım 2B — Figma → HTML/CSS

### Figma kaynağı

Kullanıcıya sor:
> "HTML/CSS'e dönüştürmek istediğiniz Figma dosyasının linkini paylaşır mısınız?"

`figma-use` skill'ini çağır; dosyanın frame ve component yapısını oku.

### Üretim

`ads-design-builder` agent'ını çalıştır. Şunları ilet:
- Figma dosyasından okunan frame listesi
- `[proje-adı]-tokens.json` yolu
- Çıktı tipi: `html`

Builder her frame'i `screens/[ad].html` olarak, component'ları `components/[katman]/[ad].html` olarak üretir.
Tüm görevler bittikten sonra `index.html`'i oluşturur.

### Tamamlama

> "Dönüşüm tamamlandı.
> ✓ [n] ekran HTML/CSS olarak üretildi
> ✓ index.html güncellendi
> Figma dosyası değiştirilmedi — her iki format da güncel."

---

## Kısıtlamalar

- Tasarım kararı vermez — yalnızca format dönüşümü yapar
- `spec.md` ve `tokens.json` dosyalarını değiştirmez
- Framework dönüşümü yapmaz (React, Vue, React Native — ileride eklenecek)

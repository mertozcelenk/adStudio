---
name: ads-promote
description: Sunum için üretilmiş HTML/CSS çıktısını gerçek bir projeye dönüştürür. Mevcut spec.md, tokens.json ve HTML/CSS dosyalarını okuyarak kullanıcıya tek bir soru sorar — HTML/CSS olarak mı devam edilecek yoksa Figma'ya mı aktarılacak — ve seçime göre pipeline'ı başlatır.
---

# Promote — Sunumdan Gerçek Projeye

## Durum Yönetimi

Başlamadan önce mevcut state dosyasını kontrol et:
```bash
ls /tmp/ads-promote-*.json 2>/dev/null
```
Dosya varsa kullanıcıya "kaldığım yerden devam et / yeni başlat" sor.
Her adım tamamlandığında `/tmp/ads-promote-{RUN_ID}.json` dosyasını güncelle.
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

`project-state.md` yoksa aşağıdaki dosyaları manuel kontrol et:

| Dosya | Zorunlu mu? |
|-------|-------------|
| `spec.md` | Evet |
| `[proje-adı]-tokens.json` | Evet |
| `components/` veya `screens/` klasörü | En az biri |

Herhangi biri eksikse dur ve kullanıcıya söyle:
> "`[eksik dosya]` bulunamadı. `/ads-spec-intake` ve `/ads-design-strategy` adımlarının tamamlanmış olması gerekiyor."

---

## Adım 1 — Mevcut Çıktıyı Oku

`project-state.md` varsa oradan al; yoksa `spec.md`'den proje adını al.
`[proje-adı]-tokens.json` dosyasını oku; `source: "ai_inferred"` olan token'ları listele.
`project-state.md`'deki dosya listesini kullan; yoksa `components/` ve `screens/` klasörlerini tara.

---

## Adım 2 — Tek Soru

Kullanıcıya sor:

> "**[Proje adı]** onaylandı, tebrikler! Şimdi gerçek projeye geçelim.
>
> Çıktıyı nasıl ilerletmek istiyorsunuz?
>
> `[ ] HTML/CSS olarak devam — mevcut dosyalar temizlenir ve üretim kalitesine getirilir`
> `[ ] Figma'ya aktar — tasarımlar Figma dosyasına taşınır`"

Seçimden hemen sonra `project-state.md`'nin başlık alanlarını yaz: `cikti_formati` (seçilen yol), `platform`
(`spec.md`'den), `token_dosyasi` (promote token üretiyorsa onun adı). Alanların anlamı:
`ads-design-builder.md` → "project-state.md".

---

## Adım 3A — HTML/CSS Yolu

### Token Doğrulama

`ai_inferred` token varsa kullanıcıya göster:

> "Sunum sırasında bazı değerler tahmini olarak üretildi. Gerçek projeye geçmeden önce bunları doğrulamanızı öneririm:
>
> [ai_inferred token listesi — her biri için: isim, mevcut değer]
>
> Bu değerleri güncellemek ister misiniz? `[ ] Evet` `[ ] Hayır, olduğu gibi devam`"

Evet denirse → `token-generator` skill'ini çağır; mevcut token dosyası için persistence guard sorusunda "üstüne yaz" seçilir, kullanıcıdan gerçek değerler toplanır (token-generator'da ayrı bir "güncelleme modu" yoktur).

### HTML/CSS Temizleme

Mevcut `components/` ve `screens/` dosyalarını şu kriterlerle yeniden üret:

- Inline stil kullanma — tüm stiller ayrı CSS dosyasına taşı
- CSS custom property'leri token dosyasındaki değerlerle bağla
- Her component kendi klasöründe bağımsız çalışabilmeli
- `index.html` güncel component ve ekran listesiyle yeniden oluştur

`ads-design-builder` agent'ını **revision modunda** çağır (builder'da ayrı bir "üretim modu" yoktur): hedef dosya listesi =
mevcut `components/` ve `screens/`, düzeltilecek bulgular = yukarıdaki temizleme kriterleri.

### Teslim kapısı

Builder bitince quick moddaki gibi **hafif review** ile teslim kapısını uygula (`ads-design-strategy.md → Quick mod`
adım 1–4 ve Adım 6): `node scripts/test/run-all.mjs`, hafif review maddeleri, teslim engeli varsa düzeltme döngüsü,
teslim durumu. Kullanıcı "teslime hazır" çıktıyı onaylarsa görsel baseline'ı al (`node scripts/test/visual.mjs --update`).

---

## Adım 3B — Figma Yolu

### Token Doğrulama

Adım 3A ile aynı token doğrulama adımını uygula.

### Figma Bağlantısı

Kullanıcıya sor:

> "Tasarımları eklemek istediğiniz Figma dosyasının linkini paylaşır mısınız?"

Link alındıktan sonra aşağıdaki sırayı **kesinlikle bu sırayla** uygula:

**Aşama 1 — Token'ları Figma değişkeni olarak oluştur**
`figma-use` skill'ini çağır; `[proje-adı]-tokens.json` içindeki tüm
koleksiyonları Figma local variables olarak oluştur.

**Aşama 2 — Oluşturulan değişken ID'lerini oku**
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

Figma bağlantısı başarısız olursa → `ads-design-builder.md → Adım 0` sorun giderme akışını uygula.

---

## Adım 4 — Tamamlanma Raporu

Her iki yol sonunda kullanıcıya özet ver:

```
Teslim durumu: [Teslime hazır | İstisna onayıyla teslim edilebilir — n istisna | Teslime hazır değil — n açık engel]
✓ Proje: [proje adı]
✓ Çıktı: [HTML/CSS | Figma]
✓ Token'lar: [kaç tanesi doğrulandı / kaç tanesi ai_inferred kaldı]
✓ Dosyalar: [üretilen / güncellenen dosya listesi]
```

`ai_inferred` kalan token varsa uyar:
> "Aşağıdaki token'lar hâlâ tahmini değer içeriyor. İleride `/ads-token-generator` ile güncelleyebilirsiniz: [liste]"

---

## Kısıtlamalar

- Framework dönüşümü yapmaz (React, Vue, React Native — ileride eklenecek)
- Yeni component tasarlamaz — mevcut çıktıyı yeniden yapılandırır
- spec.md'yi değiştirmez

---
name: ads-component-library
description: Mevcut tasarım çıktısından component library oluşturur. components/ klasörü varsa oradan alır, yoksa screens/ dosyalarından tekrar eden UI parçalarını çıkarır. HTML (referans dosyalar) veya Figma (figma-generate-library ile tam kütüphane) çıktısı üretir.
---

# Component Library

## Token Standartları

Başlamadan önce `.claude/references/token-standards.md` dosyasını oku.
Geçerli source değerleri ve zorunlu koleksiyonlar orada tanımlıdır.

## Durum Yönetimi

Başlamadan önce mevcut state dosyasını kontrol et:
```bash
ls /tmp/ads-component-library-*.json 2>/dev/null
```
Dosya varsa kullanıcıya "kaldığım yerden devam et / yeni başlat" sor.
Her adım tamamlandığında `/tmp/ads-component-library-{RUN_ID}.json` dosyasını güncelle.
Başarıyla tamamlanınca dosyayı sil.

---

## Ön Koşul Kontrolü

`project-state.md` dosyasını proje kökünde oku. Varsa:
- `cikti_formati`, `token_dosyasi` ve üretilen dosyaları buradan al

`project-state.md` yoksa kontrol et:

| Dosya | Zorunlu mu? |
|-------|-------------|
| `spec.md` | Evet |
| `[proje-adı]-tokens.json` | Evet |
| `components/` veya `screens/` klasörü | En az biri |

Herhangi biri eksikse dur:
> "`[eksik dosya]` bulunamadı. Önce `/ads-spec-intake`, `/ads-token-generator` ve `/ads-design-strategy` adımlarını tamamlayın."

---

## Adım 1 — Kaynak Tespiti

### 1a. components/ klasörü var mı?

`components/` klasörünü kontrol et.

**Varsa:** Tüm `.html` dosyalarını listele. Bu dosyalar zaten atomize edilmiş — Adım 2'ye geç.

**Yoksa:** Adım 1b'ye geç.

### 1b. screens/'dan component çıkar

`screens/` klasöründeki tüm `.html` dosyalarını oku. Şu tekrar eden UI parçalarını tespit et:

| Tür | Tespit kriteri |
|-----|----------------|
| Button | `<button>`, `role="button"`, class içinde `btn` / `button` geçenler |
| Input | `<input>`, `<textarea>`, `<select>` |
| Form | `<form>` veya birden fazla input içeren container |
| Card | Tekrar eden container — görsel + başlık + açıklama yapısı |
| Navigation | `<nav>`, `role="navigation"` |
| Header | `<header>`, `role="banner"` |
| Footer | `<footer>`, `role="contentinfo"` |
| Badge / Tag | Küçük etiket yapısı, tekrar eden pill/chip |
| Modal | `role="dialog"`, `aria-modal` |
| Icon | Tekrar eden SVG bloğu |

**Tespit kuralları:**
- Aynı HTML yapısı en az 2 farklı ekranda geçiyorsa component adayı say
- Tek ekranda 3+ kez tekrarlıyorsa component adayı say
- Tasarım kararı verme — sadece gözlemle ve listele

Her tespit edilen component için kaydet:
- Bileşenin adı ve katmanı (Atoms / Molecules / Organisms)
- Hangi ekranlarda geçtiği
- Kaç state varyantı var (default, hover, disabled, error vb.)

---

## Adım 2 — Component Listesini Onayla

Kullanıcıya tespit edilen component'ları göster:

> "Şu component'ları tespit ettim:
>
> **Atoms**
> - Button (3 varyant: Primary, Secondary, Disabled) — 4 ekranda
> - Input (2 varyant: Default, Error) — 3 ekranda
> - Badge (1 varyant) — 2 ekranda
>
> **Molecules**
> - Card (2 varyant: Default, Featured) — 3 ekranda
> - Form (1 varyant) — 2 ekranda
>
> **Organisms**
> - Navigation (1 varyant) — tüm ekranlarda
>
> Eksik veya fazla olan var mı? Onaylarsanız devam ediyorum."

Kullanıcı onaylayana kadar ilerlemez. Değişiklik isterse listeyi güncelle ve tekrar sor.

---

## Adım 3 — Çıktı Yönü

Kullanıcıya sor:

> "Component library'yi nereye oluşturayım?
>
> `[ ] HTML` — Her component ayrı dosyaya çıkarılır (`components/` klasörü)
> `[ ] Figma` — Figma'da tam component library kurulur (variable binding, variant'lar, property'ler)
> `[ ] Her ikisi` — Önce HTML dosyaları, ardından Figma library"

---

## Adım 3A — HTML Çıktısı

Bu adım bir tasarım işi değil — mevcut HTML'den birebir çıkarma yapılır.
`ads-design-builder` yalnızca orijinal ekranlarda olmayan eksik bir component gerekiyorsa devreye girer.

### Extraction kuralları

Her tespit edilen component için:

1. İlgili HTML bloğunu en çok geçtiği ekrandan al — en temiz/tam örneği seç
2. Self-contained bir `.html` dosyasına taşı:
   - `components/atoms/[ad].html`
   - `components/molecules/[ad].html`
   - `components/organisms/[ad].html`
3. Dosyanın `<head>` bölümüne zorunlu metadata ekle:
   ```html
   <!-- Designed by: adesso Turkey -->
   <meta name="author" content="adesso Turkey">
   ```
4. Yapay zeka kökenini ima eden meta tag veya yorum ekleme
5. Token bağlantılarına dokunma — `var(--token-adı)` kullanımları olduğu gibi kalır
6. Inline stil varsa `style=""` → CSS sınıfına taşı

### Varyant dosyaları

Birden fazla varyant varsa (Primary / Secondary vb.) her varyant aynı dosyada ayrı section olarak yer alır — ayrı dosya açma.

### Tamamlama raporu

```
✓ Çıkarılan component'lar:
  - components/atoms/button.html (3 varyant)
  - components/atoms/input.html (2 varyant)
  - components/molecules/card.html (2 varyant)
  - components/organisms/navigation.html

⚠ Ekranlarda bulunamadı (yeni üretildi):
  - [varsa liste]
```

---

## Adım 3B — Figma Çıktısı

### Figma bağlantısı

Kullanıcıya sor:
> "Component library'yi eklemek istediğiniz Figma dosyasının linkini paylaşır mısınız?"

Link alındıktan sonra `figma-use` skill'ini yükle ve `mcp__figma-desktop__get_metadata` ile bağlantıyı doğrula.

Bağlantı başarısız olursa:
> "Figma dosyasına ulaşılamadı.
> - Figma Desktop açık değil
> - Claude Code eklentisi kurulu değil (`Plugins → Claude Code`)
> - Claude Code ayarlarında Figma MCP sunucusu etkin değil
>
> `[ ] Tekrar dene`
> `[ ] HTML olarak devam et`"

### figma-generate-library'ye geç

`figma-generate-library` skill'ini şu bağlamla çağır:
- Onaylanan component listesi (Adım 2)
- `[proje-adı]-tokens.json` yolu
- `spec.md` içeriği (isimlendirme, marka yönü)

Bu skill 4 fazda çalışır (Faz 0 keşif → Faz 3 component'lar → Faz 4 QA).
Her fazın başında kullanıcıya checklist sunar — onay olmadan ilerlemez.

---

## Adım 3C — Her İkisi

Önce Adım 3A'yı tamamla (HTML dosyaları oluşsun).
Ardından Adım 3B'yi başlat — `figma-generate-library` HTML dosyalarını da referans alabilir.

---

## Adım 4 — project-state.md Güncelle

`project-state.md` dosyasını güncelle:

```markdown
## Component Library

library_formati: [html | figma | her ikisi]
figma_library_linki: [varsa]

### components/
- atoms/button.html
- atoms/input.html
- molecules/card.html
- organisms/navigation.html
```

---

## Kısıtlamalar

- Tasarım kararı vermez — mevcut çıktıdan çıkarır
- `spec.md` ve `tokens.json` dosyalarını değiştirmez
- `ads-design-builder` yalnızca orijinal ekranlarda bulunmayan eksik component için devreye girer
- Ekranların içeriğine dokunmaz — screens/ dosyaları değişmez

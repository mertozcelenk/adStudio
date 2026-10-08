---
name: figma-generate-library
description: Codebase'den Figma'da profesyonel design system oluşturur. Token'dan component'a 4 fazlı iş akışı (20–100+ use_figma çağrısı).
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-generate-library/SKILL.md
last_checked: 2026-08-28
---

# figma-generate-library

Codebase'den Figma'da profesyonel design system inşa eder.
**Önce `figma-use` skill'ini yükle.**
Bu hiçbir zaman tek adımlı bir görev değildir — 20–100+ `use_figma` çağrısı gerektirir.

## Tek Kural

Her fazdan önce `Phase N Checklist` başlıklı kullanıcıya açık kontrol listesi yayınla.
Checklist yayınlanmadan önce hiçbir değişiklik yapma.
Faz sonunda `Phase N Summary` ile tamamlananları, oluşturulan objeleri ve kararları raporla.

---

## Zorunlu İş Akışı

### Faz 0 — Keşif (use_figma yazma yok)

- [ ] 0a. Codebase analizi → token, component, naming convention çıkar
- [ ] 0b. Figma dosyasını incele → sayfalar, değişkenler, component'lar, stiller
- [ ] 0c. Kütüphaneleri keşfet → `get_libraries` çalıştır, ardından `search_design_system`
- [ ] 0d. v1 kapsamını kilitle → token seti + component listesi
- [ ] 0e. Code ↔ Figma çakışmalarını çöz ve kaydet
- [ ] 0f. **Gap analysis** yayınla: code'da var / Figma'da yok, Figma'da var / code'da yok

### Faz 1 — Temeller (component'lardan önce token)

- [ ] 1a. Variable collection ve mode'ları oluştur
- [ ] 1b. Primitive variable'lar (ham değerler, 1 mod)
- [ ] 1c. Semantic variable'lar (primitive'lere alias, mod-aware)
- [ ] 1d. Tüm variable'lara scope ayarla — `ALL_SCOPES` asla
- [ ] 1e. Tüm variable'lara code syntax ekle
- [ ] 1f. Effect style (shadow) ve text style (typography) oluştur
- [ ] Exit: her token mevcut, tüm scope ve code syntax ayarlı

### Faz 2 — Dosya Yapısı (component'lardan önce)

- [ ] 2a. Sayfa iskeletini oluştur: Cover → Getting Started → Foundations → --- → Components → --- → Utilities
- [ ] 2b. Foundation dokümantasyon sayfaları (renk swatches, tip specimen, spacing)
- [ ] 2c. Her foundation sayfasının `get_screenshot`'ını al
- [ ] Exit: tüm sayfalar mevcut, foundation dokümantasyonu gezinebilir

### Faz 3 — Component'lar (bağımlılık sırasına göre, birer birer)

Her component için (atom'lardan molecule'e):

- [ ] 3a. Ayrı sayfa oluştur
- [ ] 3b. Auto-layout + tam variable binding ile base component
- [ ] 3c. Tüm variant kombinasyonları (`combineAsVariants` + grid layout)
- [ ] 3d. Component property'ler (TEXT, BOOLEAN, INSTANCE_SWAP)
- [ ] 3e. Property'leri child node'lara bağla
- [ ] 3f. Sayfa dokümantasyonu (başlık, açıklama, kullanım notları)
- [ ] 3g. Doğrula: `get_metadata` + `get_screenshot`
- [ ] Exit: variant sayısı doğru, tüm binding'ler doğrulandı

### Faz 4 — Entegrasyon + QA

- [ ] 4a. Code Connect mapping'lerini tamamla
- [ ] 4b. Erişilebilirlik denetimi (kontrast, touch target, focus görünürlüğü)
- [ ] 4c. İsimlendirme denetimi (duplicate yok, isimsiz node yok)
- [ ] 4d. Unresolved binding denetimi (hardcode fill/stroke kalmadı mı)
- [ ] 4e. Her sayfanın final screenshot'ı

---

## Kritik Kurallar

1. **Variable'lar component'lardan önce** — token olmadan component yapma.
2. **Oluşturmadan önce incele** — mevcut convention'ları bul ve eşleş.
3. **Sayfa başına bir component** (kural) — yakın aileler section separator ile paylaşabilir.
4. **Tüm görsel property'leri variable'a bağla** — fill, stroke, padding, radius, gap.
5. **Her variable'a scope** — `ALL_SCOPES` asla kullanma.
6. **Her variable'a code syntax** — WEB: `var(--color-bg-primary)` wrapper zorunlu.
7. **Semantic'leri primitive'lere alias et** — `{ type: 'VARIABLE_ALIAS', id: primitiveVar.id }`
8. **INSTANCE_SWAP for icons** — ikon başına variant oluşturma.
9. **`use_figma` çağrılarını asla paralelize etme** — kesinlikle sıralı.
10. **Node ID asla tahmin etme** — her zaman state ledger'dan oku.
11. **Doğrulanmamış iş üzerine inşa etme**.

---

## State Yönetimi

Context truncation'a karşı state'i diske yaz (`references/skill-state-pattern.md` standardı):
```
/tmp/ads-figma-generate-library-{RUN_ID}.json
```

Başlamadan önce mevcut state dosyasını kontrol et:
```bash
ls /tmp/ads-figma-generate-library-*.json 2>/dev/null
```
Dosya varsa kullanıcıya "kaldığım yerden devam et / yeni başlat" sor.

Her turn başında state dosyasını yeniden oku. State ledger:
```json
{
  "runId": "ds-build-001",
  "skill": "figma-generate-library",
  "status": "in_progress",
  "phase": "phase3",
  "step": "component-button",
  "entities": {
    "collections": { "primitives": "id:..." },
    "variables": { "color/bg/primary": "id:..." },
    "pages": { "Button": "id:..." },
    "components": { "Button": "id:..." }
  },
  "completedSteps": ["phase0", "phase1", "phase2"]
}
```

**Idempotency:** Oluşturmadan önce isim + state ledger ID ile sorgula. Zaten varsa atla veya güncelle — asla duplicate etme.

**Resume prompt:**
> "I'm continuing a design system build. Run ID: {RUN_ID}. Load figma-generate-library and resume from last completed step."

---

## Token Mimarisi

| Karmaşıklık | Pattern |
|---|---|
| < 50 token | Tek collection, 2 mod (Light/Dark) |
| 50–200 token | Primitives (1 mod) + Color semantic (Light/Dark) + Spacing + Typography |
| 200+ token | Multiple semantic collection, 4–8 mod |

```
Collection: "Primitives"    mode: ["Value"]
  blue/500 = #3B82F6

Collection: "Color"         modes: ["Light", "Dark"]
  color/bg/primary → Light: alias Primitives/white, Dark: alias Primitives/gray-900

Collection: "Spacing"       mode: ["Value"]
  spacing/sm = 8
```

---

## İsimlendirme Kuralları

**Variable'lar (slash-separated):**
```
color/bg/primary     color/text/secondary    color/border/default
spacing/xs  spacing/sm  spacing/md  spacing/lg
radius/none  radius/sm  radius/md  radius/full
```

**Component'lar:** `Button`, `Input`, `Card`, `Avatar`, `Badge`

**Variant'lar:** `Size=Medium, Style=Primary, State=Default`

**Sayfa separator'lar:** `---`

---

## Kütüphane Keşfi

`search_design_system`'den önce her zaman `get_libraries` çalıştır:
- Dönen library key'leriyle `search_design_system`'i scope et.
- Boş sonuç kütüphane olmadığı anlamına gelmez — yine de ara.
- `libraries_available_to_add_next_offset` doluysa sayfalama var — devam et.

Reuse kararı:
- **Reuse**: property API uyumlu, token modeli uyumlu, isim convention uyuşuyor.
- **Rebuild**: API uyumsuz, token modeli uyumsuz, ownership sorunu.
- **Wrap**: görsel eşleşme ama API uyumsuz → remote instance'ı wrapper içine göm.

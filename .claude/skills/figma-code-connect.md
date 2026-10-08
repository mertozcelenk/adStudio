---
name: figma-code-connect
description: Figma component'larını kod karşılıklarına bağlar. Code Connect mapping oluşturur ve günceller.
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-code-connect/SKILL.md
last_checked: 2026-08-28
---

# figma-code-connect

Figma component'larını codebase'deki gerçek implementasyonlara bağlar.
**Önce `figma-use` skill'ini yükle.** (`add_code_connect_map` ile Figma'ya yazar)
Bu skill doğrudan `use_figma` çağırmaz — Code Connect dosyaları üretir veya günceller.

## Code Connect Nedir?

Code Connect, Figma Dev Mode'da bir component seçildiğinde gerçek kod örneğini gösterir.
Tasarımcı-geliştirici handoff'unu güçlendirir.

## Adım 1 — Mapping'leri Keşfet

Figma MCP'den mevcut mapping'leri al:
```
get_code_connect_map → dosya içindeki tüm bağlantıları döndürür
```

Codebase'den component listesini çıkar:
```bash
find src/components -name "*.tsx" -o -name "*.jsx" | head -50
```

## Adım 2 — Eşleştirme Stratejisi

Her Figma component için:
1. Figma component adı → kod dosyası adı eşleştir (fuzzy match)
2. Figma property'leri → kod prop'ları eşleştir
3. Variant'ları → prop değerleriyle eşleştir

**Örnek eşleşme:**
```
Figma: Button [Size=Large, Style=Primary, State=Default]
Kod:   <Button size="lg" variant="primary" disabled={false} />
```

## Adım 3 — Code Connect Dosyası Oluştur

React için `.figma.tsx`:
```tsx
import figma from '@figma/code-connect'
import { Button } from './Button'

figma.connect(Button, 'FIGMA_NODE_URL', {
  props: {
    label: figma.string('Label'),
    size: figma.enum('Size', {
      Small: 'sm',
      Medium: 'md',
      Large: 'lg',
    }),
    variant: figma.enum('Style', {
      Primary: 'primary',
      Secondary: 'secondary',
      Ghost: 'ghost',
    }),
    disabled: figma.boolean('Disabled'),
    icon: figma.boolean('Has Icon'),
  },
  example: ({ label, size, variant, disabled }) => (
    <Button size={size} variant={variant} disabled={disabled}>
      {label}
    </Button>
  ),
})
```

## Adım 4 — Figma Node URL'sini Bul

`get_code_connect_map` veya `get_metadata` ile component node URL'sini al:
```
figma.com/file/[FILE_KEY]/[FILE_NAME]?node-id=[NODE_ID]
```

## Adım 5 — Mapping'i Kaydet

`add_code_connect_map` ile Figma'ya gönder — veya dosyayı `figma connect publish` ile yayınla.

## Desteklenen Framework'ler

| Framework | Dosya uzantısı | Import |
|---|---|---|
| React | `.figma.tsx` | `@figma/code-connect` |
| Vue | `.figma.vue` | `@figma/code-connect/vue` |
| SwiftUI | `.figma.swift` | `FigmaConnect` |
| Jetpack Compose | `.figma.kt` | `com.figma.codeConnect` |

## Kritik Kurallar

- Node URL'sini asla tahmin etme — her zaman `get_metadata`'dan al.
- Bir component için birden fazla `.figma.*` dosyası olabilir (farklı sayfalar/kullanım).
- Property isimlerini Figma'daki ile tam eşleştir — büyük/küçük harf dahil.
- Variant kombinasyonlarını `figma.enum()` ile map et — string hardcode etme.

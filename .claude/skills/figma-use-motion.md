---
name: figma-use-motion
description: Figma Motion eklentisiyle ileri seviye animasyon ve micro-interaction tanımlar. Figma Variables ile animate edilebilir property'ler.
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-use-motion/SKILL.md
last_checked: 2026-08-28
---

# figma-use-motion

Figma'da animasyon sistemi kurar — hem prototype transitions hem de kod için animasyon token'ları.
**Önce `figma-use` ve `figma-implement-motion` skill'lerini yükle.**

## Motion Token'ları

Animasyonlar da token olarak tanımlanmalı — hardcode süre/easing kullanma.

**Motion collection oluştur:**
```js
const collection = figma.variables.createVariableCollection("Motion");
collection.addMode("Default");
```

**Duration token'ları:**
```js
// ms cinsinden Number variable
const durationInstant  = figma.variables.createVariable("duration/instant",  collection, "FLOAT");
const durationFast     = figma.variables.createVariable("duration/fast",     collection, "FLOAT");
const durationMedium   = figma.variables.createVariable("duration/medium",   collection, "FLOAT");
const durationSlow     = figma.variables.createVariable("duration/slow",     collection, "FLOAT");

durationInstant.setValueForMode(modeId, 100);
durationFast.setValueForMode(modeId, 200);
durationMedium.setValueForMode(modeId, 300);
durationSlow.setValueForMode(modeId, 500);
```

**Easing token'ları (String variable):**
```js
const easingDefault   = "cubic-bezier(0.4, 0, 0.2, 1)"; // Material standard
const easingDecelerate = "cubic-bezier(0, 0, 0.2, 1)";  // Enter screen
const easingAccelerate = "cubic-bezier(0.4, 0, 1, 1)";  // Exit screen
const easingSharp      = "cubic-bezier(0.4, 0, 0.6, 1)"; // Quick actions
```

## Micro-interaction Kalıpları

**Hover → Fill değişimi:**
```js
// ComponentSet içinde Hovered variant'ı oluştur
const hoverVariant = figma.createComponent();
hoverVariant.name = "State=Hovered";
// Fill'i %10 daha koyu yap
hoverVariant.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.15, b: 0.95 } }];
```

**Press → Scale:**
```js
// Pressed variant
const pressVariant = figma.createComponent();
pressVariant.name = "State=Pressed";
pressVariant.resize(width * 0.96, height * 0.96);
```

**Loading spinner:**
```js
// Rotate animation placeholder
const spinner = figma.createEllipse();
spinner.resize(24, 24);
spinner.strokes = [{ type: 'SOLID', color: { r: 0.2, g: 0.5, b: 1 } }];
spinner.strokeWeight = 3;
spinner.strokeAlign = 'INSIDE';
spinner.name = "Spinner [rotate]"; // naming convention for motion tools
```

## Prototype ile Motion Entegrasyonu

Micro-interaction'lar için variant-based transitions:

```js
// Default → Hovered (on hover)
defaultVariant.reactions = [{
  action: {
    type: 'NODE',
    destinationId: hoveredVariant.id,
    navigation: 'CHANGE_TO',
    transition: {
      type: 'SMART_ANIMATE',
      easing: { type: 'EASE_OUT' },
      duration: 0.15  // duration/fast token karşılığı
    }
  },
  trigger: { type: 'ON_HOVER' }
}];
```

## CSS Animasyon Çıktısı

Motion token'larından CSS üret:
```css
:root {
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-medium: 300ms;
  --duration-slow: 500ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-decelerate: cubic-bezier(0, 0, 0.2, 1);
  --easing-accelerate: cubic-bezier(0.4, 0, 1, 1);
}

.button {
  transition: background-color var(--duration-fast) var(--easing-default),
              transform var(--duration-instant) var(--easing-default);
}
```

## use_figma Kullanımı

Yukarıdaki JS blokları `use_figma` aracına şu şekilde geçirilir:
```
use_figma({ code: `
  // JS bloğu buraya
  return { id: node.id };
` })
```

**`use_figma` çağrılarını asla paralelize etme — kesinlikle sıralı çalıştır.**

## Kritik Kurallar

- Motion token'larını diğer token'larla aynı collection'a koyma — ayrı "Motion" collection.
- `prefers-reduced-motion` media query'sine saygı göster — tüm animasyonlar isteğe bağlı olmalı.
- Duration'ı saniye değil ms olarak sakla — CSS ve Figma arasında dönüşümü kolaylaştır.
- Variant geçişlerinde Smart Animate kullan — layer isimleri tutarlı olmalı.

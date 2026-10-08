---
name: figma-implement-motion
description: Figma'da prototype bağlantıları, akıllı animasyonlar ve geçiş efektleri ekler.
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-implement-motion/SKILL.md
last_checked: 2026-08-28
---

# figma-implement-motion

Figma prototiplerine animasyon ve geçiş ekler.
**Önce `figma-use` skill'ini yükle.**

## Temel Kavramlar

- **Prototype connection:** Bir frame'den diğerine geçiş
- **Smart Animate:** Eşleşen layer isimleriyle otomatik ara kare
- **Easing:** Geçiş hız eğrisi
- **Trigger:** Geçişi tetikleyen olay (tıklama, hover, vb.)

## Adım 1 — Akış Haritası

Hangi frame'den hangisine, hangi trigger ile geçileceğini listele:
```
Screen A → Screen B : onClick(Button) : Smart Animate 300ms ease-out
Screen B → Screen C : onClick(NextBtn) : Slide Left 250ms ease-in-out
Modal Open : onClick(Overlay) : Dissolve 200ms linear
```

## Adım 2 — Prototype Bağlantısı Oluştur

```js
const sourceNode = figma.getNodeById(sourceFrameId);
const reaction = {
  action: {
    type: 'NODE',
    destinationId: targetFrameId,
    navigation: 'NAVIGATE',
    transition: {
      type: 'SMART_ANIMATE',
      easing: { type: 'EASE_OUT' },
      duration: 0.3
    },
    preserveScrollPosition: false
  },
  trigger: { type: 'ON_CLICK' }
};
sourceNode.reactions = [...sourceNode.reactions, reaction];
return { id: sourceNode.id };
```

## Geçiş Türleri

| Tür | `type` değeri | Kullanım |
|---|---|---|
| Smart Animate | `SMART_ANIMATE` | En yaygın, layer adı eşleşmesi gerekir |
| Dissolve | `DISSOLVE` | Fade in/out |
| Move In / Out | `MOVE_IN` / `MOVE_OUT` | Yön belirtilir |
| Push | `PUSH` | Slide ile aynı anda öteki kayar |
| Slide In / Out | `SLIDE_IN` / `SLIDE_OUT` | Modal, drawer |
| Instant | `INSTANT_TRANSITION` | Animasyonsuz |

## Trigger Türleri

```js
// Tıklama
{ type: 'ON_CLICK' }

// Hover
{ type: 'ON_HOVER' }

// Otomatik (gecikme ile)
{ type: 'AFTER_TIMEOUT', timeout: 2000 } // ms

// Klavye
{ type: 'KEY_DOWN', keyCodes: [13] } // Enter
```

## Adım 3 — Smart Animate için Layer Eşleştirme

Smart Animate yalnızca **aynı isimli** layer'ları animate eder.
Eşleşen layer'ları kontrol et:
```js
const sourceNames = new Set(sourceFrame.children.map(n => n.name));
const targetNames = new Set(targetFrame.children.map(n => n.name));
const matched = [...sourceNames].filter(n => targetNames.has(n));
return { matched, unmatched: [...sourceNames].filter(n => !targetNames.has(n)) };
```

Eşleşmeyen layer'lar animate edilmez — isimlerini düzelt.

## Adım 4 — Overlay ve Modal

```js
const reaction = {
  action: {
    type: 'NODE',
    destinationId: modalFrameId,
    navigation: 'OVERLAY',
    overlayRelativePosition: { x: 0, y: 0 },
    overlayBackground: { type: 'SOLID_COLOR', color: { r: 0, g: 0, b: 0, a: 0.5 } },
    overlayBackgroundInteraction: 'CLOSE_ON_CLICK_OUTSIDE',
    transition: {
      type: 'DISSOLVE',
      easing: { type: 'EASE_OUT' },
      duration: 0.2
    }
  },
  trigger: { type: 'ON_CLICK' }
};
```

## Adım 5 — Doğrula

Prototype akışını `get_metadata` ile kontrol et:
- `reactions` property dolu mu?
- Destination node ID'leri doğru mu?

Figma'da manuel "Present" ile test et.

## Kritik Kurallar

- **`use_figma` çağrılarını asla paralelize etme** — kesinlikle sıralı.
- Her bağlantı ayrı `use_figma` çağrısında — toplu reactions dizisi değiştirme.
- `reactions` array'i replace et, append et: `[...node.reactions, newReaction]`
- Smart Animate için kaynak ve hedef frame'de layer isimleri eşleşmeli.
- Duration saniye cinsindendir: 300ms = `0.3`.

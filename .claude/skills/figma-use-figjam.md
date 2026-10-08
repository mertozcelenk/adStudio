---
name: figma-use-figjam
description: FigJam board'larında çalışır — sticky note, connector, section ve şekil oluşturur. Beyin fırtınası ve workshop facilitation.
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-use-figjam/SKILL.md
last_checked: 2026-08-28
---

# figma-use-figjam

FigJam board'larında interaktif içerik oluşturur.
**Önce `figma-use` skill'ini yükle.**

Aşağıdaki JS blokları `use_figma` aracına şu şekilde geçirilir:
```
use_figma({ code: `
  // JS bloğu buraya
  return { id: node.id };
` })
```

## FigJam ve Figma Farkı

FigJam sonsuz canvas — frame yok, page mevhumu farklı.
Ana elementler: sticky, connector, shape, section, stamp, widget.

## Adım 1 — Board Amacını Belirle

| Amaç | İçerik |
|---|---|
| Beyin fırtınası | Sticky note kümeleri, oy noktaları |
| User journey mapping | Swimlane sections + sticky'ler |
| Retrospektif | 4 quadrant (İyi/Kötü/Dene/Dur) |
| Affinity diagram | Kümelenmiş sticky'ler + etiketler |
| Proje planlama | Timeline sections + görev kartları |

## Adım 2 — Section'ları Oluştur

```js
const section = figma.createSection();
section.name = "Keşfetmek İstediklerimiz";
section.x = 0; section.y = 0;
section.resize(800, 600);
section.fills = [{ type: 'SOLID', color: { r: 0.96, g: 0.97, b: 1 } }];
return { id: section.id };
```

## Adım 3 — Sticky Note'lar

```js
const sticky = figma.createSticky();
sticky.text.characters = "Kullanıcı onboarding sürecini nasıl iyileştiririz?";
sticky.x = 100; sticky.y = 100;

// Sticky renk (FigJam'da sabit palet)
sticky.fills = [{ type: 'SOLID', color: { r: 1, g: 0.95, b: 0.5 } }]; // sarı
return { id: sticky.id };
```

**FigJam Sticky Renkleri:**
- Sarı: `{ r: 1, g: 0.95, b: 0.5 }`
- Pembe: `{ r: 1, g: 0.7, b: 0.8 }`
- Yeşil: `{ r: 0.7, g: 1, b: 0.75 }`
- Mavi: `{ r: 0.65, g: 0.85, b: 1 }`
- Mor: `{ r: 0.88, g: 0.75, b: 1 }`

## Adım 4 — Connector (Bağlantı Oku)

```js
const connector = figma.createConnector();
connector.connectorStart = { endpointNodeId: nodeAId, magnet: 'AUTO' };
connector.connectorEnd   = { endpointNodeId: nodeBId, magnet: 'AUTO' };
connector.connectorLineType = 'ELBOWED'; // STRAIGHT | CURVED | ELBOWED
return { id: connector.id };
```

## Adım 5 — Şekil ve Metin

```js
// Elips
const shape = figma.createEllipse();
shape.resize(120, 120);
shape.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.6, b: 1 } }];

// Metin
await figma.loadFontAsync({ family: "Inter", style: "Regular" });
const text = figma.createText();
text.characters = "Başlangıç Noktası";
text.fontSize = 16;
```

## Adım 6 — Swimlane (User Journey için)

```js
// Yatay şeritler olarak section'lar
const lanes = ["Awareness", "Consideration", "Decision", "Retention"];
lanes.forEach((lane, i) => {
  const section = figma.createSection();
  section.name = lane;
  section.x = 0; section.y = i * 250;
  section.resize(2000, 230);
  return { id: section.id, lane };
});
```

## Adım 7 — Doğrula

```js
return {
  sections: figma.currentPage.children
    .filter(n => n.type === 'SECTION')
    .map(s => ({ id: s.id, name: s.name, childCount: s.children.length }))
};
```

## Kritik Kurallar

- **`use_figma` çağrılarını asla paralelize etme — kesinlikle sıralı çalıştır.**
- FigJam'da `createFrame()` yerine `createSection()` kullan — frame çalışmaz.
- Sticky içeriği kısa tut: max 2-3 satır.
- Renk kümeleme anlamlı olsun — keyfi renk atama yapma.
- Büyük board'ları section'lara böl — gezinmeyi kolaylaştır.
- `figma.getNodeById()` FigJam'da farklı davranabilir — dönen ID'leri state'e kaydet.

---
name: figma-generate-diagram
description: Figma'da akış şemaları, mimari diyagramlar, user journey ve sequence diagram üretir.
source: https://github.com/figma/mcp-server-guide/blob/main/skills/figma-generate-diagram/SKILL.md
last_checked: 2026-08-28
---

# figma-generate-diagram

Figma'da teknik ve UX diyagramları oluşturur.
**Önce `figma-use` skill'ini yükle.**

## Diyagram Türleri

| Tür | Ne zaman |
|---|---|
| Flowchart | Karar ağaçları, süreç akışları |
| User Journey | Persona'nın deneyim haritası |
| Architecture | Sistem bileşen diyagramı |
| Sequence | Zaman sıralı mesajlaşma |
| ER / Data | Veri modeli ilişkileri |

## Adım 1 — İçeriği Anla

- Diyagram türünü ve kapsamını belirle.
- Node'ları (kutular) ve bağlantıları (oklar) listele.
- Hiyerarşi veya sıra varsa belirle.

## Adım 2 — Grid Layout Hesapla

Otomatik yerleşim için:
```js
const cols = Math.ceil(Math.sqrt(nodeCount));
const rows = Math.ceil(nodeCount / cols);
const cellW = 200; const cellH = 120; const gap = 40;
```

## Adım 3 — Node'ları Oluştur

Her node için:
```js
const box = figma.createFrame();
box.resize(180, 80);
box.x = col * (cellW + gap);
box.y = row * (cellH + gap);
box.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.97, b: 1 } }];
box.cornerRadius = 8;

await figma.loadFontAsync({ family: "Inter", style: "Medium" });
const label = figma.createText();
label.characters = nodeLabel;
box.appendChild(label);

return { id: box.id, name: nodeLabel };
```

## Adım 4 — Bağlantı Okları

```js
const arrow = figma.createConnector();
arrow.connectorStart = { endpointNodeId: sourceId, magnet: 'RIGHT' };
arrow.connectorEnd   = { endpointNodeId: targetId, magnet: 'LEFT' };
return { id: arrow.id };
```

Her ok ayrı `use_figma` çağrısında.

## Adım 5 — Renk Kodlaması

Karar node'ları, başlangıç/bitiş, işlem node'ları farklı renklerle:
- Başlangıç/Bitiş: `{ r: 0.2, g: 0.7, b: 0.3 }` (yeşil)
- Karar: `{ r: 1, g: 0.8, b: 0.2 }` (sarı)
- İşlem: `{ r: 0.95, g: 0.97, b: 1 }` (açık mavi)
- Hata/Olumsuz: `{ r: 1, g: 0.3, b: 0.3 }` (kırmızı)

## Adım 6 — Başlık ve Açıklama

Diyagramın üstüne başlık frame'i ekle:
- Büyük başlık (diyagram adı)
- Alt başlık (tarih, versiyon, sorumlu)

## Adım 7 — Doğrula

`get_screenshot` ile tüm diyagramı kontrol et — okların doğru node'lara bağlandığını gör.

## Kritik Kurallar

- **`use_figma` çağrılarını asla paralelize etme** — kesinlikle sıralı.
- Node'lar ve oklar ayrı `use_figma` çağrılarında — asla tek seferde.
- Font'u metin eklemeden önce her zaman yükle.
- Node ID'lerini state'e kaydet — okları bağlarken kullanmak için.
- Grid hesabını önce yap, sonra oluştur — yerleşim sonradan değiştirme.

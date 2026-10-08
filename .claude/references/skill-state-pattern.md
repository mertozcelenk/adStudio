---
name: skill-state-pattern
description: Uzun süren skill'lerin süreç yarım kalınca kaldığı yerden devam edebilmesi için standart durum (state) yönetimi kalıbı.
---

# Skill State Pattern

Herhangi bir skill'de çok adımlı, kesintiye uğrayabilecek bir süreç varsa bu kalıbı uygula.

---

## 1. State Dosyası

Her skill çalışmasına benzersiz bir `RUN_ID` ata ve state'i diske yaz:

```
/tmp/ads-{skill-adı}-{RUN_ID}.json
```

Örnek: `/tmp/ads-reference-ingest-a3f9.json`

**RUN_ID üretimi:** 4 karakterli rastgele alfanumerik — `Math.random().toString(36).slice(2,6)`

**Her adımdan sonra state'i güncelle** — adım bitmeden yazmayı bırakma.

---

## 2. State Dosyası Yapısı

```json
{
  "runId": "a3f9",
  "skill": "ads-reference-ingest",
  "startedAt": "2026-08-28T10:30:00Z",
  "status": "in_progress",
  "input": {
    "url": "https://example.com",
    "label": "constraint"
  },
  "completedSteps": ["css-fetch"],
  "currentStep": "dom-query",
  "findings": {
    "colors": [
      { "name": "primary", "value": "#1a1a2e", "source": ":root --color-primary", "confidence": "verified" }
    ],
    "typography": [],
    "spacing": [],
    "radius": []
  },
  "pendingSteps": ["screenshot-verify", "output-format"]
}
```

| Alan | Açıklama |
|---|---|
| `runId` | Bu çalışmanın benzersiz ID'si |
| `skill` | Hangi skill çalışıyor |
| `status` | `in_progress` / `completed` / `failed` |
| `completedSteps` | Başarıyla tamamlanan adımlar |
| `currentStep` | Şu an işlenen adım |
| `findings` | O ana kadar toplanan veri |
| `pendingSteps` | Henüz yapılmamış adımlar |

---

## 3. Skill Başında: State Kontrolü

Skill her başladığında önce mevcut state dosyalarını kontrol et:

```bash
ls /tmp/ads-{skill-adı}-*.json 2>/dev/null
```

**Dosya varsa** — kullanıcıya sor:
> "Önceki bir `{skill-adı}` çalışması bulundu (Run ID: {runId}, {tarih}).
> `[ ] Kaldığım yerden devam et`
> `[ ] Yeni başlat`"

**Dosya yoksa** — yeni RUN_ID üret, state dosyasını oluştur, adım 1'den başla.

---

## 4. Her Adımda: State Güncelleme

```
Adım tamamlandı → completedSteps'e ekle → currentStep'i güncelle → state dosyasını yaz → sonraki adıma geç
```

Adım başarısız olursa:
```json
{
  "status": "failed",
  "failedStep": "dom-query",
  "error": "Sayfaya erişilemedi — timeout",
  "findings": { ... }  // o ana kadar toplananlar korunur
}
```

---

## 5. Tamamlanınca: Temizlik

Skill başarıyla bitince:
```bash
rm /tmp/ads-{skill-adı}-{RUN_ID}.json
```

Başarısız biterse dosyayı **silme** — resume için gerekli.

---

## 6. Resume Prompt

Kullanıcı "kaldığım yerden devam et" derse state dosyasını oku ve şu adımdan başla:

> State yüklendi. Run ID: {runId}. Tamamlanan: {completedSteps}. Devam: {currentStep}.

---

## 7. Hangi Skill'ler Bu Kalıbı Uygulamalı

| Skill | Neden |
|---|---|
| `ads-reference-ingest` | Web sitesi taraması çok adımlı, CSS + DOM + screenshot |
| `ads-token-generator` | 6 koleksiyon × N token, uzun ve aşamalı |
| `ads-context-scanner` | Çok sayfalı web taraması, tarama limiti aşılabilir |
| `figma-generate-library` | 4 faz, 20–100+ use_figma çağrısı (zaten uyguluyor) |
| `ads-design-builder` | Çok görevli, her görev bağımsız |

---

## 8. Kullanıcıya Gösterilen Özet (her adım sonrası)

State güncellenirken kullanıcıya kısa bir ilerleme bildirimi yaz:

```
[ads-reference-ingest] CSS okundu ✓ → DOM sorgusu başlıyor...
[ads-reference-ingest] DOM sorgusu tamamlandı ✓ → Görsel doğrulama...
[ads-reference-ingest] Tamamlandı. Run ID: a3f9 — 3 renk, 2 font, 4 spacing değeri bulundu.
```

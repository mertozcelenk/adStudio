# /ads-iterate maliyet kuralları — T4 (HTML, küçük ortak stil değişikliği) — 2026-10-20

**Amaç:** `perf/agent-okuma` dalı: iterate isteği tekrar sormuyor mu; yalnızca ortak stil değiştiğinde hafif review mi;
karar sinyali yokken kalıcı karar sorusu atlanıyor mu; rapor aşama sonu `/clear` hatırlatmasıyla mı bitiyor.
T3 "Ortak Hesap" projesinin kopyası, istek: `/ads-iterate kartların köşe yuvarlaklığını biraz artır`.

## Mini senaryo

| Senaryo | Sonuç | Maliyet |
|---|---|---|
| T4 — `/ads-iterate <istek>` (HTML, token değeri) | ✅ Hiç soru sorulmadı (istek tekrar sorulmadı, kalıcı karar sorusu yok; raporda `Kalıcı karar: yok`). Kayıttaki çağrılar: `ads-iterate` skill → `ads-design-builder` (1 kez); ana konuşma ekran dosyasına yazmadı; `ads-design-reviewer` / `ads-ux-reviewer` çalışmadı; hafif review + `run-all.mjs` (accessibility, tokens, responsive, tells, structure GEÇTİ; visual baseline yok). Rapor hatırlatma cümlesiyle bitti. "Teslime hazır" | $1.94, 6 dk |

## Notlar

- Ortak stil kuralı tam sınanmadı: builder yalnızca token JSON'u ve kart içeren tek ekranı (`group-detail.html`) değiştirdi,
  yani etkilenen ekran sayısı zaten 1'di. Orkestratör gerekçesini "ortak stil, içerik / yapı değişmedi" diye yazdı.
  Birden çok ekrana dokunan ortak stil değişikliği ayrıca sınanmadı.
- Builder ekranlarda tanımsız `--card-radius` buldu; kartlar `--modal-radius` ile çiziliyordu. Yeni `radius-2xl` (20px)
  kademesi ekledi ve gerekçesini token JSON'a yazdı. Diğer 4 ekranın `:root` bloğuna yeni token'ı eklemedi (kart yok).
- Okuma / görsel sınırı bu koşuda gözlemlenmedi (reviewer çalışmadı, builder ekran görüntüsü almadı).

# İlk doğrulama — 2026-10-08

adStudio'nun ilk sürümünün (köken: README) kurulum, geliştirme klasörü ve ilk mini senaryo doğrulaması.

| Kontrol | Sonuç |
|---|---|
| `npm run selftest` (çalıştırıcı, fixture'lar, check-names) repo içinde | ✅ |
| README kurulumu GitHub'dan, boş klasörde (`~/Desktop/adstudio-deneme`) | ✅ selftest + fixture + check-names geçti, `commands/` = `skills/` |
| Canlı geliştirme klasörü (`scripts/dev/sandbox.sh`) | ✅ testler deneme klasörünü kök alıyor; Claude Code 9 `ads-` agent'ı ve 14 `ads-` komutunu sembolik bağlantılardan yükledi, öneksiz veya eski önekli komut yok ($0.08) |
| Mini senaryo A1 — tek dosya, düzeltme döngüsü (`/ads-iterate`) | ✅ $0.85, 2 dk |

**A1 ayrıntı:** `/ads-iterate` → `ads-design-builder` yalnızca istenen başlığı değiştirdi → hafif review + `run-all` iki teslim
engeli buldu (em-dash · Kural, CTA satır kayması · High) → aynı builder oturumunda 1 düzeltme turu → yeniden kontrolde ikisi de
kapandı, `run-all` 0, "Teslime hazır", `check-run` geçti; `pricing.html` değişmedi; `ADS_PLAN` işareti okundu.

**Notlar:** Durum dosyası `/tmp/ads-iterate-*.json` izole test ortamında klasör dışı olduğu için yazılmadı (beklenen);
builder CTA düzeltmesinde `white-space:nowrap` ekledi (375px dahil testler geçti).

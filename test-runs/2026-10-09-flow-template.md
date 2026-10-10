# Flow ve template katmanı — 2026-10-08 / 09

**Amaç:** Görünümü tanımlayan token'ların yanına ürünün nasıl kurulduğunu ve nasıl davrandığını tanımlayan iki kalıcı proje
dosyası: `templates.md` (ekran tipleri: bölgeler, zorunlu durumlar, davranış) ve `flows.md` (Ortak Davranış + akışlar,
`Önkoşul` / `Sonra`). Sözleşme: `.claude/references/structure-standards.md`.

## Model çağrısız

| Kontrol | Sonuç |
|---|---|
| `npm run selftest` (çalıştırıcı + fixture'lar + check-names) | ✅ |
| `structure-good` | ✅ 0 bulgu; ortak ekran (group-detail ← F-01, F-02) bilgi olarak yazılır |
| `structure-bad` | ✅ 17 bulgu, kuralların hepsi en az bir kez; fixture dosyalarıyla tek tek gözden geçirildi, yanlış alarm yok |
| `tokens-clean` → structure | ✅ `yapi` alanı olmayan eski projede uygulanamaz |
| run-all öz-testi (Figma → uygulanamaz, project-state yok → çalıştırılamadı) | ✅ structure dahil |

## Mini senaryolar (geliştirme klasörü, `claude -p`, soru aracı kapalı)

| Senaryo | Sınanan | Sonuç | Maliyet |
|---|---|---|---|
| T2 — quick mod, "Ortak Hesap" (web, 4 ekran) | Adım 2b: builder'dan önce flows + templates, tek onay; ekranların bu dosyalardan üretimi | ✅ 3 akış (F-02 ve F-03 önkoşulu F-01), 3 template; her ekranda `data-template` / `data-flow` / `data-region` / `data-state`; iki boş durum sıradaki akışa (`data-flow-start`); `Sonra` hedefleri gerçek bağlantı; `index.html` akışlara göre gruplu; run-all 0 (structure 0 bulgu); "Teslime hazır", check-run geçti | $4.01, 14 dk |
| T3 — iterate, T2 çıktısına "harcamayı düzenle" | Var olan yapıya yeni akış eklenmesi | ✅ `F-04 — Harcamayı düzenle` (`Önkoşul: F-02`) yalnızca **eklendi**, F-01..F-03 ve Ortak Davranış değişmedi; T-FORM yeniden kullanıldı; ux-designer satır ve form kararlarını `templates.md → Pattern`'a yazdı; groups / group-create dokunulmadı (md5 aynı); planner → ux-designer → plan-gate → builder → iki reviewer → 1 düzeltme turu; structure geçti, "Teslime hazır", check-run geçti | $0.69 + $5.91, ~19 dk |

## Bulunan ve düzeltilen

- **Geliştirme klasöründe sembolik bağlantı:** T3'te orkestratör `structure-standards.md`'yi bulamadı — dosya arama aracı
  bağlantılı `.claude/references` klasörünün içine girmiyor (T2'de bulunmuştu; sonuç şansa kalıyordu). Gerçek kurulumda
  dosyalar kopyalandığı için sorun yoktu. `scripts/dev/sandbox.sh` artık kopyalar (eski bağlantıları güvenle kaldırır);
  repoda değişiklikten sonra yeniden çalıştırılır. T3'ün sonucu yine beklentiyi karşıladı (kurallar skill / agent metninde de var).

## Notlar

- T3 ilk turda kullanım sınırına takıldı (planner başlamıştı, dosya yazılmamıştı); otomatik yeniden başlatılmadı, sınır
  sıfırlandıktan sonra aynı oturum "devam" ile sürdürüldü.
- T3'te düzeltme turunu (tek satırlık sayfa başlığı) bütçe azaldığı için orkestratör builder'ı çağırmadan yaptı.
- Açık Medium önerileri (teslimi engellemez): T2 grup detayında başlık seviyesi atlama; T3'te düzenlenen satır vurgusunun
  zayıf kontrastı ve "Tekrar dene" sonrası odak.

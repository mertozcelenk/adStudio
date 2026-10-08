# token-generator kapanış yönlendirmesi — 2026-10-08

**Sorun:** Gerçek kullanımda showcase üretildikten sonra kullanıcı sıradaki skill'e yönlendirilmedi. İlk showcase mesajı
açık kararlarla (font lisansı, ikon kalınlığı) bitti; düzeltme turundan sonra da yönlendirme son mesajda yer almadı.
Kural yalnızca "showcase sorusu yanıtlandıktan sonra" diye yazılmıştı.

**Değişiklik:** `ads-token-generator.md → 6. Sıradaki adım (her kapanışta)`: skill'i kapatan her mesaj (showcase teslimi,
her düzeltme turu) yönlendirmeyle biter, yönlendirme son bloktur; açık karar varsa önce kararlar sorulur, sonra koşullu
yönlendirme verilir. `ads-pipeline-tester.md`'ye kontrol maddesi.

| Kontrol | Sonuç |
|---|---|
| `npm run selftest` (çalıştırıcı, fixture'lar, check-names) | ✅ |
| Mini senaryo T1, tur 1: showcase teslimi, General Sans lisansı açık karar | ✅ son blok "Bu kararlar netleşince `/ads-design-strategy`…"; ardından ek yok · $1.12, 4 dk |
| Mini senaryo T1, tur 2: düzeltme isteği (lisanssız sorun olmayan, daha kalın başlık fontu) | ✅ font Source Sans 3 / 700; son blok koşulsuz `/ads-design-strategy` yönlendirmesi · $1.46 + $2.01 |

**Notlar:** Tur 2 ilk denemede kullanım sınırına takıldı (düzenlemeler bitmiş, kapanış yazılamamıştı); otomatik yeniden
başlatılmadı, sınır sıfırlandıktan sonra aynı oturum "devam" ile sürdürüldü. Bu son çağrının maliyeti ($2.01, tek tur),
aradan geçen sürede önbelleğin düşmesi ve oturum bağlamının yeniden yazılmasından kaynaklanıyor.
Deneme klasörü: `scripts/dev/sandbox.sh` ile kurulan canlı geliştirme klasörü.

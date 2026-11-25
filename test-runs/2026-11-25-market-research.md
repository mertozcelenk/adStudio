# Pazar analizi (ads-market-research) — Faz 1 canlı doğrulama — 2026-11-25

**Amaç:** `feat/market-research` dalı: `/ads-market-research` (rakip analizi, rapor, `research/market-analysis.md`) ve
`ads-research-worker`. Konu: UAE bankacılık ve fintech, iOS + Android, spec yok ("analiz önce" yolu).
Senaryo a (öneriye "hayır") ve b (karışık cevap) bu turda yapılmadı.

## Mini senaryolar

| Senaryo | Sonuç | Maliyet |
|---|---|---|
| t5 — gerçek analiz, Mobbin açık, 10 rakip (liste onayı turu + tur2 `--resume`) | ✅ Tur1 rakip listesinde onay için durdu (araştırmaya başlamadı). Tur2: worker çağrıldı, Mobbin `ios`/limit 3/`standard` (10 arama), rapor + `market-analysis.md` (12 öneri, `research-file.mjs` geçti), spec'e uygulama yok. ⚠️ Google Play yok, resmî web inilmedi, 7/10 rakip `Görsel yok` | $1.45 (tur1 $0.09 + tur2 $1.36) |
| t6 — Mobbin kapalı, 6 rakip (liste verildi) | ⚠️ Mobbin kapalı davranışı ✅ (`mobbin: unavailable`, App Store'a düştü), Platform dağılımı ✅, ton örnekleri İngilizce ✅. Rapor HTML'i ÜRETİLMEDİ: model birleştirme betiği (`perl`) yazdı, çalıştıracak izin yoktu. Google Play: `WebFetch` yalnızca başlık/gezinme döndürdü | $1.17 |
| t7 — aynı, düzeltmelerden sonra | ✅ HTML doğrudan `Write` ile yazıldı (betik yok), `research-file.mjs` geçti (12 öneri), Play puan/indirme bandı arama özetinden (`Teyit`/etiketli), Platform dağılımı (Statcounter, ülke geneli notuyla), Wise için "Play sayfası bulunamadı" dürüstçe yazıldı | $1.36 |

Toplam ≈ $3.98.

## Bu işte yapılan değişiklikler (canlı bulgulardan)

- Ürün içi örnek metinler (ton örnekleri, kelime listesi) arayüz dilinde, global ürünlerde İngilizce (kullanıcı geri bildirimi, t5 raporu).
- Worker: platform Android içeriyorsa Google Play sayfası da çekilir (kaynak sırası boşluğu, t5); Play sayfası boş dönerse `WebSearch` yedeği (t6: sayfa JavaScript ile yüklenir).
- Pazar görünümüne "Platform dağılımı" (iOS/Android payı, Play indirme bantları; ülke geneli notu, `constraint` önerisi).
- Skill 4. adım: raporu doğrudan `Write` ile yaz, derleme betiği / shell komutu yok (t6).

## Notlar

- Resmî web sayfası taranmaması talimata uygun (mağaza bulununca sonrakine inilmez); eksik değil.
- Mobbin'de ENBD X, Mashreq, Wio, Liv., Tabby, Monzo, Nubank için bulgu çıkmadı (veri sınırı); `Görsel yok` etiketi doğru.
- Açık: Play sayfaları `WebFetch` ile okunamıyor; Wio/Liv./Wise için Android verisi eksik kalabilir (tarayıcı çalıştıran araç gerekir, kapsam dışı).
- Henüz yapılmadı: senaryo a/b, Faz 2 (`ads-screen-research`). Model çağrılı, her biri ayrı onayla.

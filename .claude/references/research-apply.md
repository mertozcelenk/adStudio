# Araştırma Önerilerini Spec'e Aktarma

`ads-market-research` (ve `ads-spec-intake` Adım 0) bu adımı kullanır. Biçim: `references/research-file.md`.
Araştırma durumu ile karar durumu ayrıdır; bu adım yalnızca kararı işler, tasarıma ve token'lara dokunmaz.

## Ne zaman çalışır
- Araştırma dosyasında `decision: pending` blok yoksa hiçbir şey sorulmaz, adım biter.
- `spec.md` yoksa ve çağıran `ads-spec-intake` değilse aktarım yapılmaz, sessizce çıkılır; `ads-spec-intake` Adım 0 bu adımı
  spec yazılmadan önce çalıştırır (1. adım hemen, 2–5. adımlar spec taslağı yazılırken).

## Adımlar
1. **Tek toplu soru.** `pending` blokları bir tabloda göster: `R<n>` · alan · öneri · durum (`hypothesis` ise "çıkarım",
   `stale` ise "eski veri — kabul önerilmez") · spec'teki yeri. Sor: "Hangilerini kabul ediyorsun? Her satır için
   kabul / değiştir / reddet de." Cevap gelmeden hiçbir şey yazma; cevaplanmayan satırlar `pending` kalır.
2. **Yalnızca kabul edilenler** spec'e yazılır (`research-file.md` eşlemesine göre). `rejected` ve `pending` spec'e girmez.
   `modified` ise kullanıcının hâli yazılır ve bloğa `final:` eklenir.
3. **Estetik yön** (`aesthetic_direction`): rakibin rengi, fontu, ölçüsü kopyalanmaz; yalnızca ilgili `selected_options.*`
   alanına yön yazılır. Yön `brand_guide_mode`, `user_explicit` ya da `[Korunan]` bir madde ile çelişirse mevcut
   "kararı güncelle / karar kalsın" sorusunu sor, cevabı uygula.
4. **Bağlayıcı Kararlar'a** kabul edilen her öneri için bir satır:
   `- <tarih> [Araştırma] <konu>: <karar> — kaynak: research/market-analysis.md R<n>`
   Aynı `R<n>` ikinci kez eklenmez; eski karar silinmez.
5. **Dosyayı güncelle:** her bloğun `decision:` satırı (Edit ile; dosya baştan yazılmaz). `token_directives.research`:
   hiç `pending` kalmadıysa `done:<tarih>`, kaldıysa `pending`.
6. **Token zaten üretildiyse** (`project-state.md → token_dosyasi` dolu ya da `*-tokens.json` var) ve bir
   `aesthetic_direction` kabul edildiyse yalnızca şunu söyle: "Estetik yön değişti; token setini yeniden üretmek
   için `/ads-token-generator` çalıştırılmalı." Kendiliğinden çalıştırma.

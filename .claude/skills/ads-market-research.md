---
name: ads-market-research
description: Bir ürün fikri için pazar ve rakip analizi yapar (rakipler, hedef kitle, konumlandırma, MVP, ton), paylaşılabilir rapor üretir ve kabul edilen önerileri spec'e aktarır. Yalnızca kullanıcı isteyince çalışır — "pazar araştırması", "rakip analizi", "benchmark çıkar".
---

# Market Research — Pazar Araştırması ve Rakip Analizi

Bir ürün fikri için pazar araştırması, rakip analizi ve tasarım yönü çıkarır; sonucu tek sayfalık web raporu olarak
yayınlar ve karara dönüşebilen önerileri `research/market-analysis.md` dosyasına yazar. Kullanıcının dilinde yaz
(varsayılan Türkçe). **Yalnızca kullanıcı istediğinde çalışır**; hiçbir akış bunu kendiliğinden başlatmaz.

Başvuru dosyaları:
- `references/market-report-sections.md` — her bölümün içeriği ve tablo yapıları
- `references/market-report-template.html` — raporun HTML/CSS şablonu ve bileşenleri
- `references/research-file.md` — `research/market-analysis.md` biçimi ve spec eşlemesi
- `references/research-apply.md` — kabul edilen önerileri spec'e aktarma adımı
- `ads-research-worker` agent'ı — rakip ekranlarını kendi bağlamında toplar

## İş akışı

### 0. Girdi toplama
`spec.md` varsa konu, pazar, iş modeli ve platformu oradan al; bunları tekrar sorma. Yoksa mesajdan çıkar:

| Girdi | Örnek | Yoksa |
|---|---|---|
| Konu | "Sürücülerin yakıt alarak puan topladığı sadakat uygulaması" | Sor |
| Hedef pazar | Türkiye + global örnekler | Sor |
| İş modeli | Tek marka / koalisyon / bağımsız | Sor |
| Rakip listesi ve modu | "Sadece Opet ve Shell'i incele" | Liste yok kabul et (adım 1) |
| Rakip notları | "Opet: araçta ödeme akışına bak" | Not yok |
| Ek bölüm | "Fiyatlandırma bölümü de olsun" | Sabit bölümler |

Eksikleri **tek bir AskUserQuestion çağrısında** sor. Mesajda açıkça olan bir şeyi tekrar sorma.

### 1. Rakip listesi
| Kullanıcı ne dedi | Ne yapılır |
|---|---|
| "Sadece bunları incele" / "yalnızca bunlar" | Yalnızca verilen rakipleri incele. **Başka rakip önerme veya ekleme.** |
| "Öncelikle bunlara bak" / "özellikle bunlar" | Verilenleri derinlemesine incele. Önemli bulduğun rakipleri "Eklendi" etiketiyle ekle ve hafif incele (marka kartı + matris satırı yeter). |
| Mod belirtmeden liste verdi | "Öncelikle" modu gibi davran. |
| Liste vermedi | Listeyi kendin çıkar (yerel pazar liderleri + 3–5 global örnek). **Araştırmaya başlamadan göster ve onay al.** Ekleme/çıkarma yapılabilir; onaydan sonra başla. |

Her rakip için tek satır gerekçe ver. Onayı düz metinle iste ve cevabı bekle. **Rakip notu** varsa o rakipte konuyu
öncelikli ele al: daha fazla kaynak, marka kartında ayrı "Odak" satırı, ekran aramasında o akış önce.

### 2. Araştırma
- WebSearch (varsayılan `standard`; yerel, yeni ya da zor bulunan bilgide `extended`) ve WebFetch kullan. Bağımsız aramaları aynı turda paralel gönder.
- Önce resmî kaynaklar (düzenleyici kurum, şirketin kendi sayfası, mağaza sayfaları), sonra sektör raporları ve haberler.
- **Kaynak defteri:** her kaynağa bulunduğu anda numara ver, hangi verinin hangisinden geldiğini not et. Raporda her veri bu numarayla gösterilir.
- **Hedef kitle ve boşluk sinyalleri:** her rakip için kimi hedeflediğini (kampanya dili, segment, yorumcu profili) ve tekrar eden şikâyetleri topla. Hedef kitle kullanıcıya sorulmaz, bu sinyallerden çıkarılır.
- Spam, içerik çiftliği, kaynaksız özet sitelerini kullanma. Her veriye tarih yaz; 2–3 yıldan eskiyi "Eski veri" işaretle.
- Doğrulayamadığını rapordan çıkarma, "Teyit" etiketiyle bırak. Kendi çıkarımların "Hipotez" etiketi alır.

### 3. Ekranlar
Rakip ekranlarını **kendin arama**; `ads-research-worker`'a ver (rakipler, akışlar, platform, sınırlar). Worker Mobbin →
mağaza → web sırasıyla toplar, yalnızca yapılandırılmış bulguyu döndürür; görseller ana bağlama girmez. Worker
`ai_usage_notice` döndürürse metnini sohbette kullanıcıya olduğu gibi göster. `mobbin: unavailable` dönerse teslimde belirt.
Manuel ekran çekimi kapsam dışıdır; kullanıcıdan ekran istenmez.

### 4. Rapor
1. Artifact aracının gerektirdiği tasarım kılavuzunu yükle. Artifact aracı yoksa raporu `research/market-report.html` olarak yaz.
2. `references/market-report-template.html` şablonunu oku; CSS token'larını ve bileşenleri oradan al. Renk ve display yazı tipini konuya göre uyarlayabilirsin; yapı ve bileşen sınıfları aynı kalsın.
3. `references/market-report-sections.md` bölümlerini sırayla doldur; kullanıcı aksini söylemedikçe bölüm atlama.
4. Raporu scratchpad dizinine yaz (`<konu-kisa-adi>-raporu.html`).

**Yazım kuralları**
- Her sayısal veri ve rakip bilgisi metin içinde numaralı kaynak etiketi taşır: `<sup><a class="c" href="#k3">3</a></sup>`.
- Etiketler: `Teyit`, `Eski veri`, `Hipotez`, `Eklendi`, `Görsel yok`.
- Kesin rakamla yaz; "…e varan", "devasa", "inanılmaz" gibi pazarlama dili kullanma.
- Öneriler bir bulguya bağlanır (Bulgu → karar tablosu). Her "neden biz" gerekçesi en az bir kaynaklı rakip boşluğuna, şikâyete veya matris eksiğine bağlanır; kaynaksız gerekçe yazılmaz. Şirket avantajları kullanıcıdan istenmez; araştırmadan çıkanlar `Hipotez` alır.

### 5. Yayın, araştırma dosyası ve aktarım
1. Raporu Artifact olarak yayınla (`icon: "chart"`, tek cümlelik `description`; güncellemede aynı dosya yolu).
2. **Araştırma dosyası:** proje klasörüne `research/market-analysis.md` yaz (`references/research-file.md` biçimi). Var olan
   dosya varsa önce `market-analysis.[tarih].md` olarak yeniden adlandır. Klasör bir adStudio projesi değilse (`.claude/`
   yok) nereye yazılacağını sor. Raporun Bulgu → karar, Hedef kitle, Konumlandırma, MVP, Tasarım dili, Ton ve Mevzuat
   bölümlerinden **en fazla 12** öneri çıkar; en çok karar etkileyenleri seç. Hepsi `decision: pending`.
3. **Aktarım:** `spec.md` varsa `references/research-apply.md` adımını çalıştır. Yoksa dosyayı yazıp bırak; `ads-spec-intake`
   başladığında okur.
4. Sohbette ver: rapor linki (sayfa özel; paylaşmak için Share menüsü), 4–6 maddelik öne çıkan bulgular (çıkarılan hedef
   kitle ve tek cümlelik "neden biz" mutlaka içinde), doğrulanamayan noktalar, çalışmayan bağlantılar, araştırma dosyasının yolu.
5. Kullanıcı başka format (pptx, docx, Notion) isterse ancak o zaman dönüştür.

## Bağlantı sorunları
Bir araç ya da bağlantı (Mobbin, WebFetch hedefi, MCP) hata verirse aynı çağrıyı tekrar deneme. O kaynağı bu çalıştırma boyunca
kapalı say, sıradakine geç, sonunda kullanıcıya bildir.

## Token tasarrufu
- Rakip sayısını onaylı listeyle sınırla; "Eklendi" rakiplere derin inceleme yapma.
- Sayfa çekerken prompt'ta yalnızca ihtiyacın olan alanları iste.
- Raporu bir kez yaz, bir kez kontrol et, yayınla.

# Araştırma Dosyası — Sözleşme

Araştırma skill'leri (`ads-market-research`, ileride ekran araştırması) bulgularını projede `research/` altına bu biçimde
yazar. `ads-spec-intake` ve `references/research-apply.md` aynı biçimi okur. Dosya `scripts/test/research-file.mjs` ile denetlenir.

Dosya: `research/market-analysis.md`. Yeniden üretimde var olan dosya ezilmez; eskisi `market-analysis.[tarih].md` olur
(`design-brief.[tarih].md` ile aynı kural).

## Biçim
```markdown
# Pazar analizi — <konu>
tarih: 2026-11-04
pazar: Türkiye
is_modeli: tek marka

## R1 · <kısa başlık>
field: audience
status: hypothesis
proposal: <bir–iki cümle; karara dönüşebilen öneri>
basis: <kaynak numaraları ve rapor bölümü, ör. "kaynak 3, 7 — bölüm 6a">
decision: pending
```
- `R<n>` numaraları 1'den başlar, tekrar etmez, kalıcıdır (karar sonrası silinmez, yeniden numaralanmaz).
- `decision: modified` ise kullanıcının son hâli `final:` satırına yazılır.
- Rakamsal pazar verisi bu dosyaya girmez; yalnızca karara dönüşebilen öneriler girer (rapor ayrıntıyı taşır).

## Alanlar ve izinli değerler
| Anahtar | Değerler |
|---|---|
| `field` | `audience` `persona` `positioning` `constraint` `scope_candidate` `tone` `aesthetic_direction` `design_principle` `ux_pitfall` `reference_screen` |
| `status` | `confirmed` (kaynakla doğrulandı) · `hypothesis` (araştırmadan çıkarım) · `stale` (2–3 yıldan eski veri) |
| `decision` | `pending` · `accepted` · `modified` · `rejected` — yalnızca `research-apply.md` değiştirir |

## `field` → spec karşılığı
| `field` | `spec.md` karşılığı |
|---|---|
| `audience`, `persona`, `positioning` | Amaç ve Kapsam |
| `constraint` | Platform ve Teknik Kısıtlar |
| `scope_candidate` | İlk Kapsam (özellik adayı; ekrana IA aşamasında çevrilir) |
| `tone`, `design_principle`, `ux_pitfall` | Marka / Ton |
| `aesthetic_direction` | `token_directives.aesthetic_directives.selected_options.*` (yalnızca yön: `language`, `density`, `color_approach`, `motion`; değer kopyalanmaz) |
| `reference_screen` | Referans Girdiler → Örnek Ekran Görüntüleri (yalnızca link) |

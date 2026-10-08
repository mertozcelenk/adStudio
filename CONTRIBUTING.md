# adStudio'ya yeni adım eklemek

Her yeni adım, skill veya agent için aynı sıra izlenir. Amaç: değişiklik kurulu projeleri bozmadan geliştirilsin,
sabit kurallar ücretsiz testlerle, ajan davranışı tek bir küçük senaryoyla kanıtlansın.

## 1. Dal ve deneme klasörü
```bash
git checkout main && git pull && git checkout -b feat/<adım-adı>
scripts/dev/sandbox.sh ~/Desktop/adstudio-gelistirme      # repodaki talimatlar anında geçerli
```
Deneme klasöründe `claude` açıp `/ads-…` komutlarıyla denersin. `~/.claude`'a ve kurulu projelere dokunulmaz.

## 2. Türünü seç ve doğru yere ekle
| Tür | Nereye | Dikkat |
|---|---|---|
| Mevcut akışa adım | İlgili skill'in adımları arasına (ör. `ads-design-strategy.md → Adım N`) | Adım numaraları ve diğer dosyalardaki "Adım N" atıfları güncellenir |
| Yeni skill / komut | `.claude/skills/ads-<ad>.md` — frontmatter `name: ads-<ad>`, `description` | Kurulum `commands/` kopyasını kendisi yapar |
| Yeni agent | `.claude/agents/ads-<ad>.md` — frontmatter `name`, `description`, `tools` | Onu çağıran skill'de adı birebir aynı yazılır |

Ad önekli olmalı (`ads-`); `check-names` öneksiz veya yazım hatalı atıfları yakalar.

## 3. Sözleşmelere bağla (gerekiyorsa)
- **Başlangıç kaydı:** üretim yapan akış `project-state.md`'ye `cikti_formati`, `platform`, `token_dosyasi`, `yapi` yazar.
- **Yapı (flow / template):** ekran üreten veya değiştiren adım `flows.md` / `templates.md`'yi okur, yeni kapsamı oraya
  ekler ve ekranları işaretler (`references/structure-standards.md`); `structure` testi denetler.
- **Teslim kapısı:** üretim yapan akış hafif veya tam review ile biter ve teslim durumu yazar (`ads-design-strategy.md → Adım 6`).
- **Bulgu modeli:** yeni bir kontrol bulgu üretiyorsa `etki` + `teslimi engeller` alanlarını taşır (`reviewer-checklist.md → Seviye Ölçeği`).
- **Kapsam kararı:** builder'ın yeni kapsam eklemesi gerekiyorsa durup sorar.
- **Bağlayıcı kararlar:** kararı aşan değişiklik "kararı güncelle / karar kalsın" adımından geçer.

## 4. Test et
1. **Sabit kural** (dosya, işaret, durum, sayı) → model çağrısız test veya fixture: `scripts/test/` altında betik ya da
   `fixtures/<ad>/expected.json` (kural + dosya + seçici + viewport + tema bazında).
2. **Ajan davranışı** → tek mini senaryo: tek davranış, planlama / UX zinciri yok, en fazla 1 düzeltme + 1 yeniden kontrol,
   harcama tavanı. Beklenen sonuç dosyası oturumun klasörü dışında tutulur; sonuç dosyalardan değerlendirilir.
3. Her zaman:
   ```bash
   cd scripts/test && npm run selftest      # çalıştırıcı + fixture'lar + check-names
   ```

## 5. Belgele ve gönder
- `ads-pipeline-tester.md`'ye yeni adım için kontrol maddesi.
- README (akış şeması / özellik) ve TESTING (yeni test veya fixture) güncellenir.
- Commit → `git push -u origin feat/<adım-adı>` → PR. Birleşmeden önce selftest yeşil olmalı.

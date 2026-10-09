#!/bin/zsh
# Geliştirme klasörü — repodaki talimatları kurulu projelere dokunmadan dener.
#
# Kullanım: scripts/dev/sandbox.sh <klasör>      (yoksa oluşturur; tekrar çalıştırmak repodaki son hâli kopyalar)
#
#   <klasör>/.claude/agents, skills, references  → repodan KOPYA
#   <klasör>/.claude/commands                    → repo/.claude/skills'in kopyası (slash komutları)
#   <klasör>/scripts/test                        → repodan KOPYA; node_modules repodan bağlanır
#
# Neden kopya: dosya arama aracı (Glob) sembolik bağlantılı klasörlerin içine girmiyor; bağlantı kurulduğunda
# model `.claude/references/…` dosyalarını bulamayıp kuralları okumadan devam edebiliyor (T3, 2026-10-09).
# Test betikleri de kopyadır: Node bağlantının gerçek yolunu çözer, bağlanırsa testler repoyu tarar.
# Repoda değişiklik yaptıktan sonra bu komutu yeniden çalıştır. Proje dosyalarına (spec, ekranlar…) dokunmaz.
#
# Deneme klasörü repoya hiçbir şey yazmaz; ~/.claude'a dokunmaz.
set -eu
[[ $# -eq 1 ]] || { echo "kullanım: scripts/dev/sandbox.sh <klasör>"; exit 2; }
REPO=${0:A:h:h:h}
DIR=${1:A}
[[ "$DIR" == "$REPO"* ]] && { echo "deneme klasörü repo içinde olamaz: $DIR"; exit 2; }

mkdir -p "$DIR/.claude" "$DIR/scripts"
for d in agents skills references commands; do
  # eski sürümün sembolik bağlantısı: yalnızca bağlantının kendisi kaldırılır (rsync bağlantı üzerinden repoya yazmasın)
  [[ -L "$DIR/.claude/$d" ]] && rm "$DIR/.claude/$d"
done
for d in agents skills references; do
  rsync -a --delete "$REPO/.claude/$d/" "$DIR/.claude/$d/"
done
rsync -a --delete "$REPO/.claude/skills/" "$DIR/.claude/commands/"

[[ -d "$REPO/scripts/test/node_modules" ]] || (cd "$REPO/scripts/test" && npm install --silent && npx playwright install chromium >/dev/null)
mkdir -p "$DIR/scripts/test"
rsync -a --delete --exclude node_modules --exclude snapshots "$REPO/scripts/test/" "$DIR/scripts/test/"
ln -sfn "$REPO/scripts/test/node_modules" "$DIR/scripts/test/node_modules"

echo "Hazır: $DIR"
echo "  cd \"$DIR\" && claude        → /ads-… komutları repodaki son hâliyle"
echo "  repoda değişiklik yaptıysan bu komutu tekrar çalıştır"

#!/bin/zsh
# Canlı geliştirme klasörü — repodaki talimatları kopyalamadan dener.
#
# Kullanım: scripts/dev/sandbox.sh <klasör>      (yoksa oluşturur; tekrar çalıştırmak test betiklerini yeniler)
#
#   <klasör>/.claude/agents, skills, references  → repoya sembolik bağlantı (repoda değişiklik = anında geçerli)
#   <klasör>/.claude/commands                    → repo/.claude/skills'e bağlantı (slash komutları)
#   <klasör>/scripts/test                        → KOPYA (Node bağlantının gerçek yolunu çözer; bağlanırsa testler
#                                                  deneme klasörünü değil repoyu tarar). node_modules repodan bağlanır.
#
# Deneme klasörü repoya hiçbir şey yazmaz; ~/.claude'a dokunmaz.
set -eu
[[ $# -eq 1 ]] || { echo "kullanım: scripts/dev/sandbox.sh <klasör>"; exit 2; }
REPO=${0:A:h:h:h}
DIR=${1:A}
[[ "$DIR" == "$REPO"* ]] && { echo "deneme klasörü repo içinde olamaz: $DIR"; exit 2; }

mkdir -p "$DIR/.claude" "$DIR/scripts"
for d in agents skills references; do ln -sfn "$REPO/.claude/$d" "$DIR/.claude/$d"; done
ln -sfn "$REPO/.claude/skills" "$DIR/.claude/commands"

[[ -d "$REPO/scripts/test/node_modules" ]] || (cd "$REPO/scripts/test" && npm install --silent && npx playwright install chromium >/dev/null)
mkdir -p "$DIR/scripts/test"
rsync -a --delete --exclude node_modules --exclude snapshots "$REPO/scripts/test/" "$DIR/scripts/test/"
ln -sfn "$REPO/scripts/test/node_modules" "$DIR/scripts/test/node_modules"

echo "Hazır: $DIR"
echo "  cd \"$DIR\" && claude        → /ads-… komutları repodaki güncel talimatlarla"
echo "  test betiklerini değiştirdiysen bu komutu tekrar çalıştır"

#!/usr/bin/env bash
# Transforme un document Markdown en PDF présentable, pour envoi au client.
#   bash scripts/md-vers-pdf.sh docs/00-produit/04-questions-devis.md docs/06-sources/05-questions-devis.pdf "Titre"
set -euo pipefail

source="${1:?usage : md-vers-pdf.sh <source.md> <sortie.pdf> [titre]}"
sortie="${2:?usage : md-vers-pdf.sh <source.md> <sortie.pdf> [titre]}"
titre="${3:-La Loka}"

# CHROME_HEADLESS permet de forcer le chemin. Sinon on cherche dans les caches
# puppeteer : celui de l'utilisateur courant, et ceux des comptes de la machine
# (la session peut tourner sous un autre compte que celui qui a installé Chrome).
chrome="${CHROME_HEADLESS:-}"
if [ -z "$chrome" ]; then
  for base in "$HOME/.cache/puppeteer" /home/*/.cache/puppeteer /root/.cache/puppeteer; do
    [ -d "$base" ] || continue
    trouve=$(find "$base" -name chrome-headless-shell -type f 2>/dev/null | head -1)
    if [ -n "$trouve" ]; then chrome="$trouve"; break; fi
  done
fi
[ -n "$chrome" ] || {
  echo "Chrome headless introuvable. Indiquez-le avec CHROME_HEADLESS=/chemin/vers/chrome-headless-shell" >&2
  exit 1
}

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
python3 "$(dirname "$0")/md-vers-html.py" "$source" "$tmp/page.html" "$titre" >/dev/null
"$chrome" --no-sandbox --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$sortie" "file://$tmp/page.html" 2>/dev/null
echo "PDF écrit : $sortie"

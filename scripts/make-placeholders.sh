#!/usr/bin/env bash
# Génère des placeholders audio de dev : des tons TENUS, à volume constant,
# chacun sur une hauteur distincte. Surtout pas de trémolo — une source qui
# pulse masque les fondus et rend tout enchaînement illisible à l'oreille.
set -euo pipefail

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Erreur : ffmpeg est introuvable. Installez-le (ex. apt install ffmpeg) puis relancez." >&2
  exit 1
fi

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/public/audio"
mkdir -p "$out"

gen() {
  local name="$1" dur="$2" src="$3" af="$4"
  ffmpeg -y -hide_banner -loglevel error -f lavfi -i "$src" -t "$dur" -af "$af" -c:a aac -b:a 128k "$out/$name.m4a"
  echo "  $name.m4a (${dur}s)"
}

echo "Génération des placeholders dans $out"

gen accueil 4 "sine=frequency=880" "volume=0.3"
gen tfe 90 "sine=frequency=110" "volume=0.3"
gen air 60 "sine=frequency=330" "volume=0.3"
gen lucidite 6 "sine=frequency=1046" "volume=0.25"
gen porte 3 "anoisesrc=colour=brown:amplitude=0.7" "volume=0.6"
gen renouveau 45 "sine=frequency=220" "volume=0.3"
gen cloture 5 "sine=frequency=262" "volume=0.3"
gen med-01 20 "sine=frequency=440" "volume=0.3"
gen med-02 20 "sine=frequency=494" "volume=0.3"
gen med-03 20 "sine=frequency=523" "volume=0.3"
gen mantra-01 8 "sine=frequency=587" "volume=0.3"
gen mantra-02 8 "sine=frequency=659" "volume=0.3"
gen mantra-03 8 "sine=frequency=698" "volume=0.3"

echo "Terminé : 13 fichiers dans public/audio/."

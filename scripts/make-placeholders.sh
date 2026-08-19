#!/usr/bin/env bash
# Génère des placeholders audio de dev (fréquences différenciées, durées courtes).
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

gen accueil 4 "sine=frequency=880" "tremolo=f=6:d=0.9,volume=0.4"
gen tfe 90 "sine=frequency=55" "tremolo=f=0.1:d=0.8,volume=0.5"
gen air 60 "sine=frequency=220" "tremolo=f=0.25:d=0.6,volume=0.35"
gen lucidite 6 "sine=frequency=1046" "tremolo=f=3:d=0.7,volume=0.3"
gen porte 3 "anoisesrc=colour=brown:amplitude=0.7" "volume=0.8"
gen renouveau 45 "sine=frequency=330" "tremolo=f=0.4:d=0.5,volume=0.35"
gen cloture 5 "sine=frequency=262" "tremolo=f=0.8:d=0.6,volume=0.4"
gen med-01 20 "sine=frequency=440" "vibrato=f=4:d=0.6,tremolo=f=1.5:d=0.9,volume=0.4"
gen med-02 20 "sine=frequency=494" "vibrato=f=5:d=0.6,tremolo=f=1.8:d=0.9,volume=0.4"
gen med-03 20 "sine=frequency=523" "vibrato=f=6:d=0.6,tremolo=f=2.2:d=0.9,volume=0.4"
gen mantra-01 8 "sine=frequency=587" "tremolo=f=1:d=0.8,volume=0.4"
gen mantra-02 8 "sine=frequency=659" "tremolo=f=1.3:d=0.8,volume=0.4"
gen mantra-03 8 "sine=frequency=698" "tremolo=f=1.6:d=0.8,volume=0.4"

echo "Terminé : 13 fichiers dans public/audio/."

# La Loka — Spec V1 (d'après la réponse client du 19/08/2026)

Source : [`../06-sources/02-reponse-oddwave-boutons.pdf`](../06-sources/02-reponse-oddwave-boutons.pdf) (Dorine & Morgane).
Cadrage initial : [`01-cadrage-client.md`](01-cadrage-client.md).
Ce qui reste en suspens : [`03-questions-ouvertes.md`](03-questions-ouvertes.md).

## Périmètre — confirmé le 15/09/2026

Le livrable est **un site mobile unique**, ouvert depuis le QR code de la boîte
ou depuis son adresse, et consulté sur téléphone pendant la partie. Il porte le
voyage sonore décrit ci-dessous.

Ce n'est **pas** un site vitrine du jeu : ni boutique, ni pages de présentation
ou de presse. Si un tel site devenait nécessaire, ce serait un projet distinct.

## Inventaire audio (fourni par Oddwave, masters WAV)

| Piste | Quantité | Durée | Notes |
|---|---|---|---|
| Méditations | 10 | ~4 min | pause / reprise / relance possibles |
| Mantras | 10 | ~30 s | un seul à la fois, crossfade doux entre deux |
| Jingle + message d'accueil | 1 | courte | déclenché par « Commencement » |
| Ambiance Terre-Feu-Eau | 1 | ~45 min | continue, **doit boucler** si la partie dure |
| Ambiance Air | 1 | ~20 min | démarre au passage Lucidité |
| Ambiance Lucidité (passage) | 1 | ? | à articuler avec le bouton étoile filante (cf. questions ouvertes) |
| Ambiance Porte | 1 | courte | bruit de porte qui s'ouvre |
| Univers Renouveau | 1 | ? | enchaîné après la Porte |
| Message de clôture | 1 | courte | intégration de l'expérience |

Volume total estimé : ~2h10 de contenu → **~110–130 Mo** encodé (AAC 128 kbps) ; possibilité de descendre (Opus/HE-AAC) si besoin.

## Interface : 6 boutons (validée par le client)

| Bouton | Symbole | Action |
|---|---|---|
| Commencement | spirale | jingle d'accueil + message d'accueil |
| Terre, Feu, Eau | feuille | lance l'ambiance voyage (boucle) |
| Lucidité / Air | étoile filante | fondu de sortie Terre-Feu-Eau → ambiance Air |
| Méditation | lotus | ouvre le choix des 10 méditations (ducking de l'ambiance) |
| Mantra | oreille | déclenche un mantra (superposé, un seul à la fois) |
| Dernière case | clé | bruit de Porte → univers Renouveau (couvre Rituel de fin + Légende personnelle) |

Interface minimaliste, discrète, univers graphique La Loka, différenciation visuelle Terre/Feu/Eau/Air, texte limité aux titres/boutons/indications.

## Règles de mixage

1. **Ducking méditation** : l'ambiance ne s'arrête pas, volume baisse pendant la voix, remonte progressivement à la fin.
2. **Mantra** : se superpose à l'ambiance ; un seul à la fois ; crossfade doux si un nouveau est lancé.
3. **Boucle** : Terre-Feu-Eau boucle sans couture.
4. **Passage Lucidité** : fondu de sortie Terre-Feu-Eau, entrée Air.
5. **Séquence finale (clé)** : Porte puis Renouveau enchaînés ; le message de clôture reste-t-il un déclenchement séparé ? (cf. questions ouvertes)

## Contraintes validées

- Un seul téléphone au centre de la table, usage collectif, déclenchements 100 % manuels.
- Partie type ~60 min → wake lock indispensable.
- Haut-parleur du téléphone (enceinte Bluetooth recommandable dans les règles).
- Téléchargement au premier lancement puis hors-ligne (validé par le client).
- Français uniquement en V1, **mais architecture extensible dès la conception** (nouvelles méditations/mantras/contenus → manifeste JSON).
- Relancer une piste/phase possible (erreur de manipulation).

## Points encore ouverts

1. **Ambiance Lucidité vs bouton étoile filante** : l'inventaire liste une « ambiance Lucidité » distincte de l'ambiance Air, mais le bouton unique « Lucidité / Air » ne mentionne que l'Air. Séquence probable : passage (Lucidité) → Air enchaînés sur un seul appui — à confirmer.
2. **Message de clôture** : déclenché comment ? Un 7e élément après la séquence clé, ou enchaîné automatiquement après Renouveau ?
3. **Choix méditation/mantra** : le lotus ouvre une liste de 10 — nommées/numérotées comment ? Le mantra est-il choisi ou aléatoire/séquentiel ?
4. **Mantra pendant une méditation** : autorisé ? (proposition : non, pour garder la voix seule au premier plan)
5. **Dates** : impression/sortie en cours de définition avec la maison d'édition → l'URL/QR reste à figer avant toute impression (notre point bloquant E1 tient toujours).
6. **Droits** : à vérifier ensemble (musiques, voix, diffusion en ligne, extensions).
7. **Budget** : « budget minimum » pour une V1 fonctionnelle et qualitative → à chiffrer dans notre devis (inclut domaine, QR, hébergement — cf. [`01-cadrage-client.md`](01-cadrage-client.md)).

## Prochaines étapes

1. Devis V1 « budget minimum » (dev + domaine/QR/hébergement + option maintenance).
2. Maquette UI des 6 boutons dans la charte La Loka (validation rapide client).
3. Réponses aux micro-questions 1–4 (un mail suffit).
4. Scaffold technique : Vite + React + TS, moteur audio Web Audio (ducking/crossfade/boucle), manifeste de contenu, PWA + préchargement, wake lock.

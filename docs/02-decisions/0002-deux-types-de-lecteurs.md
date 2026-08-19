# ADR 0002 — Deux types de lecteurs : flux pour le long, buffer pour le court

- **Statut** : accepté — 19/08/2026
- **Portée** : `src/audio/players.ts`
- **Voir aussi** : [0003](0003-boucle-par-lecteurs-alternes.md)

## Contexte

`decodeAudioData` place le PCM **décodé** en mémoire vive. Les ordres de
grandeur du projet :

| Piste | Durée | RAM décodée |
|---|---|---|
| Terre-Feu-Eau | ~45 min | **~950 Mo** |
| une méditation | ~4 min | ~85 Mo |
| un mantra | ~30 s | ~10 Mo |

Charger la bande-son du voyage en `AudioBuffer` fait planter n'importe quel
téléphone. En garder deux ou trois décodées pour les méditations n'est pas
davantage tenable.

## Décision

Deux implémentations d'une même interface `Player` :

- **`StreamPlayer`** — un élément `<audio>` branché dans le graphe via
  `MediaElementAudioSourceNode` : décodage en flux, mémoire quasi nulle. Pour
  les ambiances et les méditations.
- **`BufferPlayer`** — un `AudioBuffer` classique : démarrage à l'échantillon
  près, léger. Pour les pistes courtes : jingle, mantras, Porte, clôture.

Les deux se branchent sur les mêmes nœuds de gain ; le reste du moteur ne voit
pas la différence.

## Conséquences

- Deux classes qui se ressemblent : ce n'est **pas** un doublon à factoriser.
  La règle est inscrite dans `CLAUDE.md` pour qu'aucune passe de simplification
  ne les fusionne.
- `<audio>` est le seul contact du moteur avec le DOM (cf.
  [0008](0008-moteur-en-typescript-pur.md)).
- Le démarrage d'un `StreamPlayer` dépend du réseau et du tampon : d'où
  [0006](0006-fondu-au-demarrage-reel.md).

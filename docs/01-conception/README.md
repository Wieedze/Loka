# 01 — Conception

Comment le projet est construit. Décrit **l'état d'aujourd'hui** : ces documents
se mettent à jour. Le *pourquoi* figé d'une décision est dans
[`../02-decisions/`](../02-decisions/).

| # | Document | Ce qu'on y trouve |
|---|---|---|
| 01 | [Architecture](01-architecture.md) | la stack, la contrainte mémoire, le graphe audio, la machine d'état, l'arborescence, les jalons |
| 02 | [Moteur audio](02-moteur-audio.md) | les variables temporelles, les déclencheurs, sortie vs ducking, comment vérifier à l'oreille |
| 03 | [Charte graphique](03-charte-graphique.md) | le prompt Claude Design pour l'identité et les pictogrammes |

## Voir aussi

- [`../../tools/README.md`](../../tools/README.md) — mesurer un fondu pour de vrai.
- `src/audio/engine.test.ts` — les cinq règles de mixage, exécutables.

## Ajouter une entrée

Un document de conception décrit **ce qui existe**. S'il décrit un choix qu'on
pourrait défaire, c'est un ADR : écrire l'ADR, et ne garder ici que la
description, avec un lien.

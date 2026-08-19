# ADR 0015 — Les placeholders audio sont des tons tenus à volume constant

- **Statut** : accepté — 19/08/2026
- **Portée** : `scripts/make-placeholders.sh`
- **Voir aussi** : [postmortem 02](../03-postmortems/02-ecoute-chaotique.md),
  [leçon 04](../04-lecons/04-un-outil-de-test-doit-etre-ennuyeux.md)

## Contexte

Les masters ne sont pas livrés ; le moteur se développe sur des sons générés par
ffmpeg. La première génération utilisait un trémolo (`tremolo=f=0.1:d=0.8`) pour
rendre les placeholders « moins pénibles » à écouter.

Le volume variait donc de 80 % toutes les dix secondes. **La source masquait
complètement les fondus** : l'écoute était illisible, et les enveloppes mesurées
mesuraient le trémolo, pas le fondu.

## Décision

Des **tons tenus, à volume rigoureusement constant**, une hauteur distincte par
piste pour les reconnaître à l'oreille.

## Conséquences

- Les placeholders sont ennuyeux à écouter. C'est le but : toute variation
  entendue vient alors du moteur, et d'aucune autre source.
- Règle inscrite dans `CLAUDE.md`.

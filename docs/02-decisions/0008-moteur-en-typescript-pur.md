# ADR 0008 — Le moteur et la machine d'état restent du TypeScript pur

- **Statut** : accepté — 19/08/2026
- **Portée** : `src/audio/`, `src/journey/`
- **Voir aussi** : [0009](0009-pas-de-bibliotheque-d-etat.md)

## Contexte

Le mixage et l'enchaînement des phases sont la partie du produit où une erreur
s'entend et coûte cher. Ils doivent être testables sans navigateur, et survivre
au remplacement complet de l'interface (la charte graphique n'est pas encore
faite).

## Décision

`src/audio/` et `src/journey/` ne contiennent **ni React, ni accès au DOM** —
à la seule exception de l'élément `<audio>` d'un `StreamPlayer`, imposé par
[0002](0002-deux-types-de-lecteurs.md).

Le moteur expose `subscribe()` / `getState()` ; l'interface s'y branche, jamais
l'inverse.

## Conséquences

- Les tests rejouent les automations sur un faux `AudioContext`
  (`src/testing/fakeAudio.ts`), sans navigateur ni fichier son.
- L'habillage graphique peut changer sans toucher au moteur.
- Les cinq règles de mixage de la spec sont couvertes une par une par
  `engine.test.ts` : c'est la spec exécutable. **Elles ne prouvent pas que le
  son est bon** — voir [leçon 01](../04-lecons/01-mesurer-plutot-que-relire.md).

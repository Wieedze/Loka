# ADR 0005 — Les fondus sont exponentiels, pas linéaires

- **Statut** : accepté — 19/08/2026
- **Portée** : `rampValueAt()` dans `src/audio/ramp.ts`
- **Voir aussi** : [0004](0004-fondus-pilotes-par-gainramp.md)

## Contexte

L'oreille perçoit l'intensité de façon logarithmique. Une rampe de gain linéaire
s'entend comme « il ne se passe rien », puis le son disparaît brutalement dans
la dernière fraction — ce qui est perçu comme abrupt quelle que soit la durée du
fondu.

## Décision

Faire progresser les fondus par **pas égaux en décibels** : la valeur suit
`from × (to / from) ^ progression`.

Une exponentielle n'atteint jamais zéro : les fondus voyagent donc entre un
plancher `GAIN_FLOOR = 0.0008` (≈ −62 dB, déjà inaudible) et 1, et le vrai zéro
est posé **après** la fin de la rampe.

## Conséquences

- Un fondu de sortie se termine par une valeur nulle explicite, jamais par
  l'asymptote de la rampe.
- Toute lecture de niveau attendue dans un test doit tenir compte du plancher.

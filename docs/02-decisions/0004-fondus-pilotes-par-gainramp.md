# ADR 0004 — Les fondus passent par `GainRamp`, jamais par `param.value`

- **Statut** : accepté — 19/08/2026
- **Portée** : `src/audio/ramp.ts`
- **Voir aussi** : [postmortem 01](../03-postmortems/01-fondus-inaudibles.md),
  [leçon 02](../04-lecons/02-ne-pas-relire-une-api-qu-on-vient-de-piloter.md)

## Contexte

Deux comportements de la Web Audio API, tous deux vérifiés dans un vrai Chrome :

1. **La valeur d'un `AudioParam` n'est pas relisible juste après une
   planification.** Après `setValueAtTime(0, t)`, `gain.value` renvoie encore
   `1.000` : le fil audio n'a pas appliqué l'événement.
2. **`cancelScheduledValues(t)` efface aussi l'événement posé exactement à
   `t`.** Enchaîner `fadeTo(0, 0)` puis `fadeTo(1, 3)` annule donc le premier
   appel.

Conséquence réelle : **tous les fondus de l'application étaient silencieusement
désactivés**, avec une suite de tests verte.

## Décision

Une classe `GainRamp` **possède** un `AudioParam` et toutes les rampes qui lui
sont appliquées. Elle suit elle-même la valeur courante (`RampState`), sait la
recalculer à n'importe quel instant (`rampValueAt`) et donc repartir du bon
niveau même en plein milieu d'un fondu.

Aucun code du moteur ne touche un `gain.value` directement.

## Conséquences

- Un seul endroit à relire quand un fondu est suspect.
- L'état de la rampe est du calcul pur, donc testable sans navigateur
  (`ramp.test.ts`).
- Règle inscrite dans `CLAUDE.md`.

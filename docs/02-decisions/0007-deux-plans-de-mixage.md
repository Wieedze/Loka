# ADR 0007 — Deux plans de mixage plutôt que trois bus

- **Statut** : accepté — 19/08/2026 (remplace un découpage en trois bus)
- **Portée** : `Graph` dans `src/audio/engine.ts`
- **Voir aussi** : [0001](0001-web-audio-native.md)

## Contexte

Le premier moteur séparait ambiances, mantras et voix en trois bus de gain.
Deux d'entre eux ne bougeaient jamais : le seul mouvement réel du mixage est
« le fond s'efface quand une voix parle ».

## Décision

Deux plans, et **un seul se baisse** :

```
  ambiances ─┐
             ├─► fond (le seul gain qui bouge) ─┐
  mantras ───┘                                  ├─► destination
                                                │
  méditations, jingle, Porte, clôture ──────────┘
```

Chaque lecteur garde en plus **son propre gain**, pour ses fondus d'entrée et de
sortie. Le bus du fond ne sert qu'au ducking.

Le ducking est **recalculé à partir de l'état** (`updateDuck()`), pas empilé :
plusieurs voix peuvent se superposer, et c'est la dernière à finir qui relève le
fond.

## Conséquences

- Un seul gain à surveiller quand le mixage est suspect.
- Les rôles « parlés » (`jingle`, `meditation`, `cloture`) ducken ; les
  transitions de design sonore (Porte, Lucidité) passent à plein niveau sans
  duckerie — c'est du son, pas de la parole.

# ADR 0013 — Machine d'état permissive : tout est rattrapable

- **Statut** : accepté — 19/08/2026
- **Portée** : `src/journey/machine.ts`
- **Source** : réponse client B6 / « relancer une piste ou une phase »

## Contexte

L'application est posée à plat au centre d'une table, manipulée par plusieurs
personnes pendant une heure, dans la pénombre. Les fausses manœuvres sont
certaines. Le client demande explicitement de pouvoir revenir en arrière ou
relancer une phase.

## Décision

La machine est **permissive** : chaque bouton reste actionnable et relance sa
piste. L'interface **guide** — elle met en avant la prochaine étape logique —
mais ne **verrouille** jamais.

Phases : `attente → commencement → voyage(TFE) → lucidite(Air) →
finale(Porte→Renouveau) → cloture`.
Overlays, superposés sans changer la phase : `meditation`, `mantra`.

## Conséquences

- Un bouton ne peut jamais mettre le voyage dans un état sans issue.
- Le revers : plusieurs commandes mènent au même son. Ce qui a produit un bug
  réel — voir [postmortem 02](../03-postmortems/02-ecoute-chaotique.md) et
  [leçon 03](../04-lecons/03-que-fait-la-repetition.md). D'où la règle :
  relancer une ambiance **déjà en cours** est sans effet.

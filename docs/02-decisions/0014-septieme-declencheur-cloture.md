# ADR 0014 — Un septième déclencheur pour la clôture

- **Statut** : **provisoire** — à revoir dès réponse du client (question Q2)
- **Portée** : `src/journey/machine.ts`, écran Voyage
- **Voir aussi** : [questions ouvertes](../00-produit/03-questions-ouvertes.md)

## Contexte

Le client a validé **six boutons**. Mais le déroulé comporte une phase de
clôture (message d'intégration) après l'univers Renouveau, et aucun des six
boutons ne la déclenche. La question est posée au client, sans réponse à ce
jour : le message part-il seul après Renouveau, ou par un geste ?

Avec six boutons et aucun automatisme, **la phase de clôture est inatteignable**.

## Décision

Ajouter un septième déclencheur « Clôture », qui n'apparaît que lorsque la phase
le permet. Choix retenu parce qu'il est le moins coûteux à défaire : si le client
répond « c'est automatique », on supprime un bouton et on branche un enchaînement
— l'inverse aurait demandé de réinventer une place dans le mandala.

## Conséquences

- L'interface affiche parfois sept déclencheurs, pas six : à signaler au client
  lors de la validation de la maquette.
- **À revisiter** dès la réponse à Q2.

## Autres décisions prises faute de réponse

Même statut provisoire, même sort à la réponse du client :

- **Q1** — Le bouton étoile filante joue le son de passage Lucidité
  **par-dessus** le fondu enchaîné vers l'Air, pas avant.
- **Q4** — Les mantras restent autorisés pendant une méditation, mais ils sont
  duckés comme le reste du fond.

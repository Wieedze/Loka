# Postmortem 04 — 78 fichiers écrits en root

- **Date** : 19/08/2026
- **Portée** : environnement de travail
- **Détecté par** : l'utilisateur, incapable d'ouvrir ses propres fichiers

## Impact

Le premier scaffold a laissé **78 fichiers appartenant à `root`**, inaccessibles
depuis l'éditeur de l'utilisateur, et `git` refusait le dépôt avec
`dubious ownership`. Le projet était bloqué avant même la première ligne utile.

## Cause racine

La session Claude tourne en `root`, l'utilisateur travaille sous `max`. Tout
fichier créé par la session appartient donc à `root`. Rien dans l'outillage ne
le signale : l'écriture réussit, le problème n'apparaît qu'à la lecture, côté
humain.

## Correction

`chown -R max:max /home/max/Project/Loka` après **toute vague d'écriture**, y
compris celles des sous-agents et des workflows. Inscrit dans `CLAUDE.md` et
dans les consignes passées aux workflows.

## Ce qu'on en retient

- [Leçon 07 — la sortie d'un outil ne dit pas si le résultat est utilisable](../04-lecons/07-la-sortie-d-un-outil-n-est-pas-le-resultat.md)

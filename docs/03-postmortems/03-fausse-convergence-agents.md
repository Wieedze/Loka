# Postmortem 03 — Un workflow d'agents qui annonce une fausse convergence

- **Date** : 19/08/2026
- **Portée** : outillage de revue automatisée, pas le produit
- **Détecté par** : relecture manuelle du journal du workflow

## Impact

**12 findings réels n'ont jamais été appliqués**, dont 3 bugs sérieux — alors
que le workflow annonçait « zéro finding, convergence atteinte ».

## Ce qui s'est passé

Une boucle revue → correction tournait jusqu'à ce qu'une ronde ne remonte plus
rien. À la ronde 2, les agents relecteurs ont **planté** (crédits épuisés) et
renvoyé `null`. Le script filtrait les `null` — un réflexe raisonnable — obtenait
une liste vide, et concluait à la convergence.

## Cause racine

Le script confondait deux situations que rien ne distinguait dans son type de
retour :

| Ce qui arrivait | Ce que le script comprenait |
|---|---|
| « J'ai regardé, il n'y a rien » | liste vide → convergence |
| « Je n'ai pas pu regarder » | liste vide → convergence |

`.filter(Boolean)` a transformé une panne en bonne nouvelle.

## Correction

Le script distingue désormais « aucun finding » de « l'agent a échoué », et
**s'arrête en signalant les relecteurs en échec** plutôt que de conclure.

## Ce qu'on en retient

- [Leçon 06 — un résultat vide n'est pas un résultat](../04-lecons/06-un-resultat-vide-n-est-pas-un-resultat.md)

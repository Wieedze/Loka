# 03 — Postmortems

Les incidents qui ont réellement coûté du temps : ce qu'on a cru, ce qui était
vrai, et ce qui aurait dû alerter plus tôt. Un fichier par incident, dans
l'ordre où ils sont arrivés.

Sans reproche : on cherche la cause, pas le coupable. Ce qui est utile, c'est le
signe d'alerte — celui qu'on reverra.

| # | Incident | Détecté par | Vu par les tests |
|---|---|---|---|
| 01 | [Les fondus qui ne s'entendaient pas](01-fondus-inaudibles.md) | le client, à l'oreille, **3 fois** | non — 38 tests verts |
| 02 | [« C'est chaotique » : trois causes empilées](02-ecoute-chaotique.md) | le client, sur `/diagnostic` | non |
| 03 | [Un workflow d'agents qui annonce une fausse convergence](03-fausse-convergence-agents.md) | relecture du journal | sans objet |
| 04 | [78 fichiers écrits en root](04-fichiers-ecrits-en-root.md) | l'utilisateur, bloqué | sans objet |

## Le motif commun

Trois des quatre viennent du même réflexe : **raisonner sur le code au lieu de
mesurer le réel**. Le code était juste, la planification était juste, les tests
étaient verts — et le son était faux.

C'est ce qui a donné la
[leçon 01](../04-lecons/01-mesurer-plutot-que-relire.md), la plus rentable du
dossier.

## Écrire un postmortem

Numéro suivant. Le format :

```markdown
# Postmortem 0X — Titre : le symptôme, pas la cause

- **Date** / **Détecté par** / **Vu par les tests**

## Impact           ce que ça a coûté, en clair
## Chronologie      seulement si l'enchaînement apprend quelque chose
## Cause racine     une section par cause — il y en a souvent plusieurs
## Correction       avec un lien vers l'ADR quand la correction en a produit un
## Ce qu'on en retient   les liens vers les leçons
```

Un incident qui n'a rien appris de transférable n'a pas besoin de postmortem : un
commit et une ligne dans le journal suffisent.

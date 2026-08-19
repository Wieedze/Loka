# 04 — Leçons

**Le dossier à lire avant de toucher au son.**

Chaque leçon est une règle transférable, tirée d'un incident réel. Le
[postmortem](../03-postmortems/) raconte ce qui est arrivé une fois ; la leçon
dit ce qu'il faut faire la prochaine fois, y compris ailleurs.

| # | La règle | Née de |
|---|---|---|
| 01 | [Un test vert ne prouve pas que le son est bon](01-mesurer-plutot-que-relire.md) — quand quelqu'un dit « je n'entends pas », mesurer, pas relire | [PM 01](../03-postmortems/01-fondus-inaudibles.md) |
| 02 | [Ne pas relire l'état d'une API qu'on vient de piloter](02-ne-pas-relire-une-api-qu-on-vient-de-piloter.md) — une commande acceptée n'est pas appliquée | [PM 01](../03-postmortems/01-fondus-inaudibles.md) |
| 03 | [Quand plusieurs commandes mènent au même effet, se demander ce que fait la répétition](03-que-fait-la-repetition.md) | [PM 02](../03-postmortems/02-ecoute-chaotique.md) |
| 04 | [Un outil de test doit être ennuyeux](04-un-outil-de-test-doit-etre-ennuyeux.md) — si la source varie, on mesure la source | [PM 02](../03-postmortems/02-ecoute-chaotique.md) |
| 05 | [Rendre invisible n'est pas arrêter](05-un-gain-a-zero-n-est-pas-un-arret.md) — une piste à gain zéro tourne toujours | [PM 02](../03-postmortems/02-ecoute-chaotique.md) |
| 06 | [Un résultat vide venant d'un agent n'est pas un résultat](06-un-resultat-vide-n-est-pas-un-resultat.md) | [PM 03](../03-postmortems/03-fausse-convergence-agents.md) |
| 07 | [La réussite d'un outil ne dit pas si le résultat est utilisable](07-la-sortie-d-un-outil-n-est-pas-le-resultat.md) | [PM 04](../03-postmortems/04-fichiers-ecrits-en-root.md) |

## Les trois qui touchent au son, en une ligne chacune

Si vous ne lisez que ça avant d'ouvrir `src/audio/` :

1. **Mesurer** (`/diagnostic`, `tools/mesure-enveloppe.ts`) avant de relire.
2. **Ne jamais relire un `AudioParam`** : `GainRamp` tient la valeur.
3. **Un fondu de sortie coupe, un ducking jamais.**

## Écrire une leçon

Numéro suivant. Une leçon tient en quatre temps : d'où elle vient, le
raisonnement faux, ce qu'on fait à la place, le signe d'alerte.

Le signe d'alerte est la partie la plus utile — c'est la seule qu'on relira dans
l'urgence. Écrire une leçon dont le titre est déjà la règle : elle doit être
utile même sans être ouverte.

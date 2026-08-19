# 04 — Leçons

**Le dossier à lire avant de toucher au son.**

Chaque leçon est une règle transférable, tirée d'un incident réel. Le
[postmortem](../03-postmortems/) raconte ce qui est arrivé une fois ; la leçon
dit ce qu'il faut faire la prochaine fois, y compris ailleurs.

| # | La règle | Née de |
|---|---|---|
| 01 | [Mesurer plutôt que relire](01-mesurer-plutot-que-relire.md) — un test vert ne prouve pas que le son est bon | [PM 01](../03-postmortems/01-fondus-inaudibles.md) |
| 02 | [Ne pas relire une API qu'on vient de piloter](02-ne-pas-relire-une-api-qu-on-vient-de-piloter.md) — une commande acceptée n'est pas une commande appliquée | [PM 01](../03-postmortems/01-fondus-inaudibles.md) |
| 03 | [Se demander ce que produit la répétition](03-que-fait-la-repetition.md) — un bouton qu'on peut presser deux fois le sera | [PM 02](../03-postmortems/02-ecoute-chaotique.md) |
| 04 | [Un outil de test doit être ennuyeux](04-un-outil-de-test-doit-etre-ennuyeux.md) — si la source varie, on mesure la source | [PM 02](../03-postmortems/02-ecoute-chaotique.md) |
| 05 | [Un gain à zéro n'est pas un arrêt](05-un-gain-a-zero-n-est-pas-un-arret.md) — rendre inaudible n'est pas libérer | [PM 02](../03-postmortems/02-ecoute-chaotique.md) |
| 06 | [Un résultat vide n'est pas un résultat](06-un-resultat-vide-n-est-pas-un-resultat.md) — « rien trouvé » ≠ « pas pu chercher » | [PM 03](../03-postmortems/03-fausse-convergence-agents.md) |
| 07 | [La sortie d'un outil n'est pas le résultat](07-la-sortie-d-un-outil-n-est-pas-le-resultat.md) — l'écriture a réussi, la lecture a échoué | [PM 04](../03-postmortems/04-fichiers-ecrits-en-root.md) |

## Les trois qui touchent au son, en une ligne chacune

Si vous ne lisez que ça avant d'ouvrir `src/audio/` :

1. **Mesurer** (`/diagnostic`, `tools/mesure-enveloppe.ts`) avant de relire —
   [leçon 01](01-mesurer-plutot-que-relire.md).
2. **Ne jamais relire un `AudioParam`** : `GainRamp` tient la valeur —
   [leçon 02](02-ne-pas-relire-une-api-qu-on-vient-de-piloter.md),
   [ADR 0004](../02-decisions/0004-fondus-pilotes-par-gainramp.md).
3. **Un fondu de sortie coupe, un ducking jamais** —
   [leçon 05](05-un-gain-a-zero-n-est-pas-un-arret.md).

## Écrire une leçon

Numéro suivant. Le format est court et tient en trois temps :

1. **le raisonnement faux**, énoncé tel qu'on se l'était tenu — c'est ce qui
   rend la leçon reconnaissable quand on est en train de le refaire ;
2. **ce qui était vrai**, avec le chiffre ou le fait qui tranche ;
3. **« En pratique »** : le geste concret, et le signe d'alerte qui doit le
   déclencher.

Le titre porte déjà la règle : une leçon doit être utile sans être ouverte.
Terminer par le lien vers le postmortem d'origine, et vers l'ADR quand la leçon
en a produit un.

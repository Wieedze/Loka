# Leçon 01 — Mesurer plutôt que relire

Quand quelqu'un dit « ça ne marche pas » et que la suite de tests est verte, la
relecture de code ne trancherait rien : les deux affirmations peuvent être vraies
en même temps. Un test vérifie ce qui est **planifié** ; l'utilisateur entend ce
qui **sort du haut-parleur**. Entre les deux, il y a le navigateur, le réseau, le
décodeur, et la perception.

Trois relectures successives ont produit trois corrections plausibles et trois
bugs restants. La construction d'un instrument de mesure a résolu les trois
causes en quelques minutes.

**En pratique.** Au deuxième signalement du même symptôme, arrêter de lire le
code et construire de quoi observer : `tools/mesure-enveloppe.ts` rend l'audio
dans un vrai navigateur, la page `/diagnostic` trace le niveau réel sur
l'appareil de l'utilisateur.

Voir [postmortem 01](../03-postmortems/01-fondus-inaudibles.md).

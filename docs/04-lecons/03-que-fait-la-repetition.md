# Leçon 03 — Se demander ce que produit la répétition

Terre, Feu et Eau ouvrent la même bande-son. Les toucher l'un après l'autre
empilait trois copies décalées de la même piste, chacune en fondu croisé avec la
précédente. C'est une grande part de ce que le client décrivait comme
« chaotique ».

Le geste isolé était correct. C'est sa **répétition** qui ne l'était pas — et
aucun test ne la décrivait, parce que chaque test vérifiait une transition
propre.

**En pratique.** Pour toute commande, se demander : que se passe-t-il si on
l'actionne deux fois de suite ? Et si deux commandes différentes mènent au même
effet ? Sur un téléphone posé au centre d'une table et manipulé par plusieurs
personnes, la répétition n'est pas un cas limite : c'est le cas normal.

Voir [postmortem 02](../03-postmortems/02-ecoute-chaotique.md) et
[ADR 0013](../02-decisions/0013-machine-d-etat-permissive.md).

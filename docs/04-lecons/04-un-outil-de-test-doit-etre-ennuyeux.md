# Leçon 04 — Un outil de test doit être ennuyeux

Les placeholders audio étaient générés avec un trémolo : le volume variait de
80 % toutes les dix secondes. Un fondu de trois secondes était donc **invisible à
l'oreille**, noyé dans les variations de la source — et les premières mesures
d'enveloppe mesuraient le trémolo, pas le fondu.

**En pratique.** Un support de test doit être aussi neutre que possible sur la
dimension qu'on observe. Pour vérifier des enchaînements de volume : des tons
tenus, à volume constant, une hauteur par piste. Ennuyeux à écouter, et c'est
exactement ce qu'on veut.

La règle vaut au-delà de l'audio : une donnée de test qui bouge sur l'axe mesuré
transforme un bug en mystère.

Voir [ADR 0015](../02-decisions/0015-placeholders-tons-tenus.md).

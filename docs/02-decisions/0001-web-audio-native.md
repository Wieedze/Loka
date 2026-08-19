# ADR 0001 — Web Audio API native, pas de bibliothèque de lecture

- **Statut** : accepté — 19/08/2026
- **Portée** : `src/audio/`
- **Voir aussi** : [0002](0002-deux-types-de-lecteurs.md), [0007](0007-deux-plans-de-mixage.md)

## Contexte

L'application doit baisser une ambiance pendant une voix (ducking), superposer
un mantra, enchaîner deux ambiances en fondu croisé et boucler une piste de
45 minutes sans couture. Les bibliothèques de lecture audio du web (Howler et
consorts) proposent une API « lire / arrêter / régler le volume » et masquent le
graphe qui est en dessous.

## Décision

Utiliser la **Web Audio API native**, sans couche d'abstraction tierce. Le
moteur construit lui-même son graphe de nœuds de gain et planifie ses rampes.

## Conséquences

- On écrit et on maintient nous-mêmes les fondus, les bus et le ducking — c'est
  précisément le code où vit la valeur du produit.
- Les pièges de l'API sont à notre charge : ils ont coûté une journée, sont
  documentés en [postmortem 01](../03-postmortems/01-fondus-inaudibles.md) et
  encadrés par [0004](0004-fondus-pilotes-par-gainramp.md) et
  [0006](0006-fondu-au-demarrage-reel.md).
- Zéro dépendance audio à suivre dans le temps.

## Alternative écartée

**Howler.js** : couvre 80 % du besoin (lecture, volume, sprites) mais expose mal
le graphe. Le ducking et le fondu croisé se seraient écrits *contre* la
bibliothèque, avec ses limites en plus des nôtres.

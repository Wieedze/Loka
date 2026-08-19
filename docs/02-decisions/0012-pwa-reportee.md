# ADR 0012 — PWA, préchargement et hors-ligne reportés au jalon 3

- **Statut** : accepté — 19/08/2026
- **Portée** : absence volontaire de `src/preload/`, pas de service worker

## Contexte

Le hors-ligne est une exigence réelle : on ne coupe pas un voyage d'une heure
parce que le réseau faiblit. Mais le préchargement suppose des fichiers à
précharger, et les masters ne sont pas livrés. Écrire la couche maintenant
reviendrait à laisser du **code dormant**, non vérifiable, qui vieillit.

## Décision

Reporter au jalon 3 : `vite-plugin-pwa` pour le shell applicatif, et un
`PreloadManager` maison sur la **Cache API** pour l'audio (Workbox ne sait pas
afficher une progression réelle en octets sur ~120 Mo).

La couture prévue est le `version` du manifeste
([0010](0010-manifeste-json.md)) : une nouvelle version ne retélécharge que les
pistes nouvelles ou modifiées.

## Conséquences

- Il n'y a **que deux écrans** aujourd'hui (Accueil, Voyage). Le troisième —
  l'écran de chargement rituel — arrive avec le préchargement.
- Ne pas s'étonner de l'absence de `src/preload/` : c'est délibéré, pas un oubli.

# ADR 0017 — Les pages d'élément sont un gabarit unique, rempli par un preset

- **Statut** : accepté — 19/08/2026
- **Portée** : `manifest.json` (`elements`), `PageElement.tsx`, `Voyage.tsx`
- **Voir aussi** : [0010](0010-manifeste-json.md), [0007](0007-deux-plans-de-mixage.md)

## Contexte

Toucher un élément devait ouvrir une page dédiée. Écrire quatre pages — une par
élément — aurait multiplié par quatre le coût de la moindre évolution, et figé
dans l'interface les identifiants de pistes que le client peut renommer.

## Décision

**Une seule page**, remplie par un preset déclaré dans le manifeste :

```json
{ "id": "air", "titre": "Air", "texte": "…", "piste": "air", "passage": "lucidite" }
```

Le manifeste porte le **contenu** (titre, texte, quelle piste, quel son de
passage). L'interface garde la **mise en page** (angle, point cardinal, glyphe),
qui relève du plateau et non du contenu.

`parseManifest` refuse un preset qui pointe vers une piste absente, en nommant le
coupable : sans cette vérification, un identifiant renommé casserait un bouton en
silence.

## L'animation

C'est **le nœud du mandala lui-même** qui se déplace vers le centre, pas une
nouvelle icône qui apparaît : le geste reste continu, on suit des yeux ce qu'on
a touché. Les autres nœuds s'effacent en quinconce depuis les bords, la page
monte ensuite. GSAP orchestre l'ensemble dans un `gsap.context()` que React
révoque au démontage.

`prefers-reduced-motion` ramène toutes les durées à zéro : les mêmes états, sans
le mouvement.

## Conséquences

- Ajouter un élément d'extension = une entrée dans le manifeste, plus une
  position dans `PLACES` si sa place sur le mandala est nouvelle.
- La page n'affiche pas d'icône : elle laisse la place que le nœud vient occuper.
  Toucher à cette mise en page demande de vérifier les deux ensemble.
- GSAP entre dans les dépendances (~70 Ko compressés).

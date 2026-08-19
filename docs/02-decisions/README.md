# 02 — Décisions (ADR)

Une décision structurante par fichier : son contexte, ce qu'on a tranché, ce que
ça coûte. Un ADR est **daté et figé** — on ne le réécrit pas, on le **remplace**
par un ADR suivant qui explique pourquoi on a changé d'avis.

À lire quand on est tenté de faire autrement : chaque entrée dit ce que
l'alternative évidente aurait coûté.

## Le moteur audio

| # | Décision |
|---|---|
| [0001](0001-web-audio-native.md) | Web Audio API native, pas de bibliothèque de lecture |
| [0002](0002-deux-types-de-lecteurs.md) | Deux types de lecteurs : flux pour le long, buffer pour le court |
| [0003](0003-boucle-par-lecteurs-alternes.md) | La boucle Terre-Feu-Eau se fait par deux lecteurs alternés |
| [0004](0004-fondus-pilotes-par-gainramp.md) | Les fondus passent par `GainRamp`, jamais par `param.value` |
| [0005](0005-fondus-exponentiels.md) | Les fondus sont exponentiels, pas linéaires |
| [0006](0006-fondu-au-demarrage-reel.md) | Un fondu démarre quand le son sort, pas quand on le demande |
| [0007](0007-deux-plans-de-mixage.md) | Deux plans de mixage plutôt que trois bus |

## Structure du code

| # | Décision |
|---|---|
| [0008](0008-moteur-en-typescript-pur.md) | Le moteur et la machine d'état restent du TypeScript pur |
| [0009](0009-pas-de-bibliotheque-d-etat.md) | Pas de bibliothèque d'état : `useSyncExternalStore` |
| [0010](0010-manifeste-json.md) | Tout le contenu vient d'un manifeste JSON, sans backend |

## Livraison et exploitation

| # | Décision |
|---|---|
| [0011](0011-cloudflare-pages-et-r2.md) | Cloudflare Pages pour l'app, R2 pour l'audio |
| [0012](0012-pwa-reportee.md) | PWA, préchargement et hors-ligne reportés au jalon 3 |
| [0016](0016-branches-et-integration-continue.md) | Branches `main` / `dev` / `feat`, CI sur toutes les branches |

## Parcours et contenu

| # | Décision | Statut |
|---|---|---|
| [0013](0013-machine-d-etat-permissive.md) | Machine d'état permissive : tout est rattrapable | accepté |
| [0014](0014-septieme-declencheur-cloture.md) | Un septième déclencheur pour la clôture | **provisoire** — attend le client |
| [0015](0015-placeholders-tons-tenus.md) | Les placeholders audio sont des tons tenus | accepté |

## Écrire un ADR

Numéro suivant, sur quatre chiffres, jamais réutilisé. Le format tient en cinq
sections :

```markdown
# ADR 00XX — Titre à l'affirmative, la décision elle-même

- **Statut** : accepté | provisoire | remplacé par 00YY — JJ/MM/AAAA
- **Portée** : les fichiers concernés

## Contexte      ce qui était vrai, y compris les chiffres qui ont pesé
## Décision      ce qu'on fait, à l'impératif
## Conséquences  le prix à payer, y compris ce qu'on s'interdit
## Alternative écartée   ce qu'elle aurait coûté
```

Un ADR se justifie quand la décision **survivrait mal à un oubli** : quelqu'un
serait tenté de la défaire de bonne foi. Les trois quarts de ceux d'ici viennent
de là.

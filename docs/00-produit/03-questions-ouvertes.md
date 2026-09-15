# Questions ouvertes

Ce qui attend une réponse, qui doit répondre, et ce qu'on a décidé **en
attendant**. Toutes envoyées au client le 19/08/2026, sans réponse à ce jour.

⚠️ = bloquant : conditionne un démarrage ou une échéance irréversible.

## Côté client — Oddwave Studio (Dorine & Morgane)

| # | Question | Décidé en attendant | À revoir dans |
|---|---|---|---|
| **Q1** | Le bouton étoile filante enchaîne-t-il l'ambiance de passage Lucidité **puis** l'Air en un seul appui ? L'inventaire liste une ambiance Lucidité distincte, mais le bouton ne mentionne que l'Air. | Le son de passage joue **par-dessus** le fondu enchaîné vers l'Air, pas avant. | [ADR 0014](../02-decisions/0014-septieme-declencheur-cloture.md) |
| **Q2** | Le message de clôture part-il seul après Renouveau, ou par un geste ? | Un **7e déclencheur** « Clôture », visible seulement quand la phase le permet — sinon la phase est inatteignable. | [ADR 0014](../02-decisions/0014-septieme-declencheur-cloture.md) |
| **Q3** | Comment présenter les 10 méditations : titres, numéros, lien avec les cases du plateau ? Les mantras sont-ils choisis ou enchaînés ? | Liste simple depuis le manifeste, dans l'ordre du fichier. | [ADR 0010](../02-decisions/0010-manifeste-json.md) |
| **Q4** | Peut-on lancer un mantra pendant une méditation ? *(notre proposition : non)* | Autorisé, mais le mantra est **ducké comme le reste du fond**. | [ADR 0007](../02-decisions/0007-deux-plans-de-mixage.md) |
| **Q5** ⚠️ | Date limite de l'imprimeur ? | Rien à décider : c'est une date, pas un choix. Voir ci-dessous. | — |
| **Q6** | Droits sur les musiques et les voix : la diffusion en ligne est-elle couverte par les contrats existants ? | Rien — question juridique, pas technique. | — |
| **Q7** | Budget : le client demande une V1 « budget minimum ». | Devis à produire (dev + domaine/QR/hébergement + option maintenance). | [cadrage](01-cadrage-client.md) |

## Q5 est le seul vrai point bloquant

Tout le reste se rattrape après la sortie. **L'URL du QR code, non** : une fois
la boîte imprimée, elle est définitive.

La parade est indépendante de la réponse du client, et doit être prise **avant**
toute impression : figer l'URL sur un domaine qu'on maîtrise, derrière une
redirection intermédiaire — de sorte que l'hébergement puisse changer sans que
le QR imprimé ne meure. Voir
[ADR 0011](../02-decisions/0011-cloudflare-pages-et-r2.md).

## Côté nous

| Question | Position actuelle |
|---|---|
| App publique ou accès réservé ? | Public, sauf demande contraire du client. |
| Statistiques d'usage anonymes ? | Proposé en option dans le devis, pas implémenté. |

## Questionnaire de devis, envoyé le 15/09/2026

Un second questionnaire est parti, orienté chiffrage :
[`04-questions-devis.md`](04-questions-devis.md). Il reprend deux questions
restées sans réponse depuis août : la date limite de l'imprimeur (Q5, devenue
C2) et l'enveloppe budgétaire (Q7, devenue F1).

**Q6, les droits sur les musiques et les voix, n'est plus posée nulle part** :
elle a été retirée du questionnaire de devis. Si les contrats existants ne
couvrent pas la diffusion en ligne, cela se découvrira tard. À reposer
directement, hors questionnaire.

## Tenir cette liste

- Une question qui reçoit une réponse **sort du tableau** : la réponse va dans
  la [spec](02-spec-v1.md), avec sa date et sa source.
- Une décision provisoire qui devient définitive fait l'objet d'un **nouvel
  ADR** — on ne modifie pas l'ancien, on le remplace.
- Une décision provisoire **contredite** par le client : nouvel ADR aussi, qui
  dit ce qui a changé et pourquoi.

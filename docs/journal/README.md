# Journal de bord

Pour retrouver le contexte après une pause, et ne pas refaire les mêmes erreurs.

## Par où commencer

| Si vous cherchez… | Lisez |
|---|---|
| **Les pièges déjà rencontrés** — à lire avant de toucher au son | [`erreurs.md`](erreurs.md) |
| Ce qui s'est passé un jour donné, et pourquoi | les journaux datés ci-dessous |
| Ce que l'application doit faire | [`../spec-v1.md`](../spec-v1.md) |
| Comment le son est censé s'enchaîner | [`../son.md`](../son.md) |
| Comment le projet est construit | [`../architecture.md`](../architecture.md) |
| Les règles de travail sur ce dépôt | [`../../CLAUDE.md`](../../CLAUDE.md) |

## Journaux

- [19 août 2026](2026-08-19.md) — cadrage client, moteur audio, mandala,
  CI/CD, et la longue traque des fondus.

## Tenir ce journal

Une entrée par journée de travail réelle, nommée `AAAA-MM-JJ.md`. Y mettre ce
que le code et l'historique git ne diront pas :

- **les décisions et leur raison**, surtout celles prises faute de réponse du
  client, pour savoir quoi revisiter ;
- **les questions en attente**, avec qui doit répondre ;
- **les fausses pistes**, qui coûtent plus cher à refaire qu'à écrire.

Ne pas y recopier ce que le code dit déjà. Une erreur qui a coûté du temps va
dans [`erreurs.md`](erreurs.md), pas seulement dans le journal du jour : c'est
le fichier qu'on relit avant de recommencer.

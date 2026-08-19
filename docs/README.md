# Documentation — La Loka

Application web compagnon sonore du jeu de plateau La Loka (client : Oddwave
Studio), accessible par QR code sur la boîte du jeu.

## Par où commencer

| Si vous cherchez… | Allez voir |
|---|---|
| **Les pièges déjà rencontrés** — à lire avant de toucher au son | [`04-lecons/`](04-lecons/) |
| Ce que l'application doit faire | [`00-produit/02-spec-v1.md`](00-produit/02-spec-v1.md) |
| Comment le son est censé s'enchaîner | [`01-conception/02-moteur-audio.md`](01-conception/02-moteur-audio.md) |
| Comment le projet est construit | [`01-conception/01-architecture.md`](01-conception/01-architecture.md) |
| **Pourquoi** telle chose est faite ainsi | [`02-decisions/`](02-decisions/) |
| Ce qui a été perdu comme temps, et sur quoi | [`03-postmortems/`](03-postmortems/) |
| Ce qui reste en attente du client | [`00-produit/03-questions-ouvertes.md`](00-produit/03-questions-ouvertes.md) |
| Ce qui s'est passé un jour donné | [`05-journal/`](05-journal/) |
| Les règles de travail sur ce dépôt | [`../CLAUDE.md`](../CLAUDE.md), [`../CONTRIBUTING.md`](../CONTRIBUTING.md) |

## Les dossiers

| Dossier | Contient | Se lit |
|---|---|---|
| [`00-produit/`](00-produit/) | ce que l'app doit faire, d'où ça vient, ce qui reste ouvert | avant de coder une fonctionnalité |
| [`01-conception/`](01-conception/) | comment c'est construit : stack, moteur audio, charte | en continu, c'est la référence technique |
| [`02-decisions/`](02-decisions/) | les ADR — une décision structurante par fichier, avec son pourquoi | quand on est tenté de faire autrement |
| [`03-postmortems/`](03-postmortems/) | les incidents réels : impact, cause racine, correction | quand un symptôme ressemble à du déjà-vu |
| [`04-lecons/`](04-lecons/) | ce qu'on en a tiré, sous forme de règles réutilisables | **avant de toucher au son** |
| [`05-journal/`](05-journal/) | le contexte daté, les décisions prises faute de réponse | en reprenant après une pause |
| [`06-sources/`](06-sources/) | les documents du client, non modifiables | pour vérifier une affirmation à la source |

## Conventions

- **Un fichier = une idée**, numéroté dans son dossier. Le numéro donne l'ordre
  de lecture et sert d'adresse stable (« ADR 0004 », « leçon 03 »).
- **Le `README.md` de chaque dossier est son index** : il dit ce que le dossier
  contient et comment y ajouter une entrée. Il n'est donc pas numéroté.
- **Les entrées du journal gardent leur date** (`AAAA-MM-JJ.md`) : c'est leur
  numérotation naturelle, et elle trie correctement.
- **Postmortem ≠ leçon.** Le postmortem raconte *ce qui est arrivé une fois* ;
  la leçon énonce *la règle qui vaut ailleurs*. Un postmortem renvoie toujours
  aux leçons qu'il a produites, et réciproquement.
- **ADR ≠ documentation.** L'ADR fige une décision et son pourquoi, à sa date ;
  il ne se met pas à jour, il se **remplace** par un ADR suivant. La
  documentation courante, elle, décrit toujours l'état d'aujourd'hui.

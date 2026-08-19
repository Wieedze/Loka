# 05 — Journal de bord

Pour retrouver le contexte après une pause. Une entrée par journée de travail
réelle, nommée `AAAA-MM-JJ.md` — la date **est** la numérotation, et elle trie
correctement.

| Journée | Ce qui s'y est joué |
|---|---|
| [19 août 2026](2026-08-19.md) | cadrage client, moteur audio, mandala, CI/CD, et la longue traque des fondus |

## Ce qu'on y met — et ce qu'on n'y met pas

Le journal porte ce que le code et l'historique git ne diront jamais :

- **les décisions et leur raison**, surtout celles prises faute de réponse du
  client, pour savoir quoi revisiter ;
- **les questions en attente**, avec qui doit répondre ;
- **les fausses pistes**, qui coûtent plus cher à refaire qu'à écrire.

Ne pas y recopier ce que le code dit déjà.

## Où va quoi

Le journal est chronologique, donc peu consultable. Ce qui doit rester
retrouvable en sort :

| Ce que vous êtes en train d'écrire | Va plutôt dans |
|---|---|
| une décision structurante et son pourquoi | un [ADR](../02-decisions/) |
| un bug qui a coûté du temps | un [postmortem](../03-postmortems/) |
| la règle qu'on en tire | une [leçon](../04-lecons/) |
| une question qui attend le client | [questions ouvertes](../00-produit/03-questions-ouvertes.md) |

Le journal garde alors le récit et renvoie vers l'entrée dédiée. C'est cette
séparation qui fait qu'on relit les leçons avant de coder, mais le journal
seulement en reprenant le projet.

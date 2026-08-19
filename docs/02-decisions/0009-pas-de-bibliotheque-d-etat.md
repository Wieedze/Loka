# ADR 0009 — Pas de bibliothèque d'état : `useSyncExternalStore`

- **Statut** : accepté — 19/08/2026 (annule le choix initial de Zustand)
- **Portée** : `src/ui/hooks/useEngine.ts`
- **Voir aussi** : [0008](0008-moteur-en-typescript-pur.md)

## Contexte

Le cadrage prévoyait Zustand pour faire le pont entre le moteur audio (qui vit
hors React) et l'interface. Mais le moteur expose déjà `subscribe()` et
`getState()` : exactement le contrat que React attend de
`useSyncExternalStore`.

## Décision

Supprimer Zustand. `useEngine()` branche le moteur sur React en trois lignes,
avec l'API standard.

## Conséquences

- Une dépendance en moins, et aucune source de vérité en double.
- Le moteur reste ignorant de React (cf. [0008](0008-moteur-en-typescript-pur.md)).
- Si un état purement UI devenait complexe, la question se reposerait — pour
  l'interface seule, jamais pour le moteur.

# ADR 0003 — La boucle Terre-Feu-Eau se fait par deux lecteurs alternés

- **Statut** : accepté — 19/08/2026
- **Portée** : `src/audio/engine.ts`, `loopCrossfadeStart()` dans `ramp.ts`
- **Voir aussi** : [0002](0002-deux-types-de-lecteurs.md)

## Contexte

La spec demande que la bande-son du voyage **boucle sans couture** si la partie
dure plus de 45 minutes (règle 3 de [la spec](../00-produit/02-spec-v1.md)).
L'attribut `loop` d'un élément `<audio>` produit un blanc audible sur certains
navigateurs au point de rebouclage.

## Décision

Faire tourner **deux `StreamPlayer` en alternance**. À l'approche de la fin du
lecteur A, le lecteur B démarre et les deux se croisent en fondu sur
`crossfadeSec`. Le point de bascule est calculé par `loopCrossfadeStart()`,
jamais avant la moitié de la piste — sinon un fichier court relancerait une
rotation à chaque sondage.

## Conséquences

- Deux fois le tampon réseau pendant les quelques secondes du croisement.
- Un timer de sondage (`LOOP_POLL_MS`, 250 ms) surveille la position de lecture.
- La règle est inscrite dans `CLAUDE.md` : ne pas « simplifier » en `loop=true`.

# Leçon 05 — Un gain à zéro n'est pas un arrêt

Descendre le volume à zéro ne coupe rien : la piste continue de tourner, de
consommer réseau, batterie et décodeur. Repéré à l'oreille par le client sur la
page de diagnostic, dont le bouton « sortie » ne faisait que baisser le gain.

Deux gestes qui se ressemblent et qu'il ne faut jamais confondre :

| | Sortie | Ducking |
|---|---|---|
| Ce qu'on entend | descend à zéro, puis plus rien | descend, puis remonte |
| Ce qui se passe | la piste est **coupée** après le fondu | la piste **n'a jamais cessé** |
| Dans le code | `fadeOutAndStop()` | `updateDuck()` |

**En pratique.** Tout fondu de sortie programme l'arrêt réel une fois écoulé. Un
test vérifie qu'après une sortie la piste est bien arrêtée, et qu'après un
ducking elle joue toujours.

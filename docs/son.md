# Le son : variables temporelles et déclencheurs

Référence de travail pour les enchaînements de pistes. Le comportement attendu
vient de `spec-v1.md` ; ce document dit **comment** on l'obtient.

## Le principe, en une phrase

Oui, c'est exactement le modèle : **on appuie → une fonction asynchrone lance la
lecture → une fois que le son sort vraiment, on fait varier progressivement le
paramètre de volume.** Le seul piège est le « une fois que le son sort
vraiment » : c'est là que ça cassait.

## La méthode de référence

La documentation officielle est formelle sur un point : `linearRampToValueAtTime`
part **de l'événement précédent**. Sans un `setValueAtTime` juste avant pour
poser l'ancre, il n'y a pas de rampe — la valeur saute.

```js
// L'ancre : « à cet instant, le volume vaut ceci »
gain.gain.setValueAtTime(0, ctx.currentTime);
// La rampe : « et il vaudra cela dans 3 secondes »
gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
```

Deux pièges de plus, tous deux rencontrés ici :

1. **On ne peut pas relire `gain.value` pour savoir où on en est.** Juste après
   une planification, la valeur lue est encore l'ancienne (le fil audio n'a pas
   appliqué l'événement). C'est pourquoi `GainRamp` suit lui-même la valeur
   courante et sait repartir du bon niveau, même en plein milieu d'un fondu.
2. **`cancelScheduledValues(t)` efface aussi un événement posé exactement à `t`.**
   Enchaîner deux fondus naïvement annule donc le premier.

## Le piège qui rendait tout instantané

`play()` ne veut pas dire « le son sort ». Entre l'appui et le premier
échantillon audible il y a le réseau, le décodage, la mise en tampon.

```
appui ──► play() ──────── chargement ────────► le son sort enfin
          │                                     │
          └── AVANT : la rampe démarrait ici ───┘
              elle s'écoulait en silence, et la piste
              apparaissait à plein volume

          └── MAINTENANT : on attend la promesse de play(),
              puis la rampe démarre à l'instant où ça sonne
```

C'est invisible en local (le fichier est déjà là) et flagrant sur un téléphone.

## Les variables temporelles

Toutes dans `public/manifest.json`, sous `mix` — **aucune n'est en dur dans le
code**, on peut les régler sans toucher au développement.

| Variable | Défaut | Ce qu'elle règle |
|---|---|---|
| `crossfadeSec` | 3 s | Entrée d'une ambiance, sortie de la précédente, fondu entre deux mantras, bascule de boucle. |
| `duckLevel` | 0.25 | Niveau auquel retombe le fond pendant une voix (1 = intact, 0 = muet). |
| `duckInSec` | 1.5 s | Temps que met le fond à s'effacer quand une voix commence. Court : la voix doit passer devant vite. |
| `duckOutSec` | 4 s | Temps que met le fond à revenir à la fin de la voix. Long : c'est le « remonte progressivement » de la spec. |
| `voiceFadeSec` | 1 s | Sortie d'une voix qu'on arrête ou qu'on remplace. |

Deux constantes restent dans `src/audio/engine.ts`, parce qu'elles relèvent du
comportement et non du réglage artistique :

| Constante | Valeur | Rôle |
|---|---|---|
| `CUT_FADE_SEC` | 0.06 s | Coupe un message qu'on relance : assez court pour être perçu comme net, assez long pour ne pas claquer. |
| `LOOP_POLL_MS` | 250 ms | Fréquence à laquelle on regarde s'il est temps d'enchaîner la boucle. |

## Les déclencheurs

| Geste | Ce qui part | Ce qui s'arrête | Durées utilisées |
|---|---|---|---|
| Spirale — Commencement | jingle d'accueil, plein niveau | le message précédent, s'il y en a un | `CUT_FADE_SEC` en sortie, `duckInSec` pour le fond |
| Terre / Feu / Eau | ambiance du voyage, en fondu | l'ambiance en cours, en fondu | `crossfadeSec` des deux côtés |
| Air — Lucidité | son de passage + ambiance Air | Terre-Feu-Eau, en fondu | `crossfadeSec` |
| Lotus — Méditation | la voix, plein niveau | la voix précédente | `duckInSec` pour baisser le fond |
| fin de méditation | — | la voix | `duckOutSec` pour relever le fond |
| Oreille — Mantra | le mantra, en fondu | le mantra précédent, en fondu | `crossfadeSec` |
| Clé — La Porte | bruit de porte, puis Renouveau | l'ambiance du voyage, en fondu | `crossfadeSec` |
| Lune — Clôture | message de clôture | — | `duckInSec` / `duckOutSec` |

Règle générale : **une ambiance ne démarre et ne s'arrête jamais autrement qu'en
fondu ; une voix démarre net** (on ne fait pas apparaître une parole
progressivement) **et ne s'arrête qu'en fondu court.**

## Baisser le son : deux gestes à ne pas confondre

| | Sortie | Ducking |
|---|---|---|
| Ce qu'on entend | descend à zéro, puis plus rien | descend à 25 %, puis remonte |
| Ce qui se passe | la piste est **coupée** après le fondu | la piste **n'a jamais cessé** de jouer |
| Dans le code | `fadeOutAndStop()` | `updateDuck()` |
| Quand | changement d'ambiance, arrêt d'une voix, Porte | une voix passe au premier plan |

Un fondu de sortie n'est pas terminé quand le gain atteint zéro : la piste tourne
encore et continue de consommer batterie et réseau. Le moteur programme donc
toujours l'arrêt une fois le fondu écoulé. C'est vérifié par un test.

Les placeholders de développement sont des **tons tenus à volume constant**, une
hauteur par piste. C'est délibéré : un placeholder qui pulse (trémolo) masque
complètement les fondus et rend tout enchaînement illisible à l'oreille.

## Vérifier de ses oreilles

`bun run dev` puis **`/diagnostic`** : une page hors application qui joue de
vraies pistes avec le vrai lecteur et **trace le niveau mesuré en sortie**, pas
la valeur demandée. La durée du fondu est réglable de 0,5 à 10 s.

Si la courbe monte en pente douce, le fondu s'entend. Si elle saute à la
verticale, on a un vrai problème — et on saura sur quel appareil.

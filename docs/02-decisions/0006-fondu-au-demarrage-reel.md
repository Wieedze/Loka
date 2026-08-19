# ADR 0006 — Un fondu démarre quand le son sort, pas quand on le demande

- **Statut** : accepté — 19/08/2026
- **Portée** : `FadingPlayer.play()` dans `src/audio/players.ts`
- **Voir aussi** : [postmortem 01](../03-postmortems/01-fondus-inaudibles.md),
  [leçon 01](../04-lecons/01-mesurer-plutot-que-relire.md)

## Contexte

`play()` ne veut pas dire « le son sort ». Entre l'appui et le premier
échantillon audible il y a le réseau, le décodage, la mise en tampon. Une rampe
lancée à l'appel de `play()` s'écoule **pendant le chargement**, en silence, et
la piste apparaît à plein volume.

Invisible en développement local — le fichier est déjà là — et flagrant sur un
téléphone.

## Décision

`play(fadeInSec)` **attend la promesse de lecture**, puis démarre la rampe à
l'horloge audio de cet instant-là. La règle vit dans `FadingPlayer.play()` :
un seul endroit pour tous les lecteurs, quel que soit leur type.

Corollaire iOS : `play()` peut être **refusé** hors geste utilisateur. L'échec
de la promesse doit déclencher le même nettoyage que la fin naturelle de la
piste — sinon le ducking reste bloqué ou l'ambiance meurt en silence.

## Conséquences

- Le lancement d'une piste est asynchrone de bout en bout dans le moteur.
- Test de régression : « attend le démarrage du fichier au lieu de s'écouler
  pendant le chargement ».

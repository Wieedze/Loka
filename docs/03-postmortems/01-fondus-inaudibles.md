# Postmortem 01 — Les fondus qui ne s'entendaient pas

- **Date** : 19/08/2026
- **Durée** : la majeure partie de la journée
- **Détecté par** : le client, à l'oreille — **trois fois de suite**
- **Détecté par les tests** : non. 38 tests verts pendant toute la durée du bug.

## Impact

Aucun fondu de l'application n'était audible. Les pistes apparaissaient et
disparaissaient net. Trois signalements successifs du client, trois causes
**différentes et toutes réelles**, chacune masquant la suivante.

## Chronologie

1. Le client signale que les fondus ne s'entendent pas. La suite de tests est
   verte, le code relu semble juste. Première correction à l'aveugle.
2. Deuxième signalement. Deuxième relecture, deuxième correction plausible.
3. Troisième signalement. Arrêt des relectures, construction d'un **instrument
   de mesure**. Les trois causes tombent en quelques minutes.

## Causes racines

### 1. Deux fondus planifiés au même instant s'annulaient

`cancelScheduledValues(t)` efface aussi l'événement posé **exactement** à `t`.
Enchaîner `fadeTo(0, 0)` puis `fadeTo(1, 3)` annulait donc le premier appel.
Tous les fondus de l'application étaient silencieusement désactivés.

Aggravant : on tentait de relire `gain.value` pour savoir où en était un fondu.
Juste après une planification, la valeur lue est encore l'ancienne — le fil
audio n'a pas appliqué l'événement. Mesuré dans un vrai Chrome : après
`setValueAtTime(0, t)`, `gain.value` renvoie toujours `1.000`.

→ **Correction** : [ADR 0004](../02-decisions/0004-fondus-pilotes-par-gainramp.md).
`GainRamp` suit lui-même la valeur courante.

### 2. Le fondu s'écoulait avant que le son ne sorte

`play()` ne veut pas dire « le son sort ». Entre l'appel et le premier
échantillon audible il y a le réseau, le décodage, la mise en tampon. La rampe
s'écoulait **pendant le chargement**, en silence, et la piste apparaissait à
plein volume.

Invisible en local — le fichier est déjà là. Flagrant sur un téléphone.

→ **Correction** : [ADR 0006](../02-decisions/0006-fondu-au-demarrage-reel.md).
`play(fadeInSec)` attend la promesse, puis lance la rampe.

### 3. La source elle-même masquait les fondus

Voir [postmortem 02](02-ecoute-chaotique.md) : les placeholders pulsaient.

## Pourquoi les tests n'ont rien vu

Les tests vérifiaient que les bonnes automations étaient **planifiées**. C'est
utile — ce sont les règles de mixage de la spec, exécutables — mais cela ne dit
rien de ce qui sort du haut-parleur. Les trois causes vivaient toutes dans
l'écart entre « planifié » et « entendu ».

## Ce qui a débloqué la situation

Pas une relecture de code. **Deux instruments de mesure** :

- `tools/mesure-enveloppe.ts` — rend l'audio dans un vrai Chrome via un
  `OfflineAudioContext`, avec le **vrai code** de `ramp.ts`, et renvoie
  l'enveloppe mesurée.
- la page `/diagnostic` — trace le niveau **réellement mesuré en sortie** sur
  l'appareil de l'utilisateur, que le client peut ouvrir lui-même.

## Ce qu'on en retient

- [Leçon 01 — mesurer plutôt que relire](../04-lecons/01-mesurer-plutot-que-relire.md)
- [Leçon 02 — ne pas relire une API qu'on vient de piloter](../04-lecons/02-ne-pas-relire-une-api-qu-on-vient-de-piloter.md)

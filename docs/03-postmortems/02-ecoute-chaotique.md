# Postmortem 02 — « C'est chaotique » : trois causes empilées

- **Date** : 19/08/2026
- **Détecté par** : le client, à l'écoute, puis sur la page `/diagnostic`
- **Détecté par les tests** : non

## Impact

Même une fois les fondus réparés
([postmortem 01](01-fondus-inaudibles.md)), l'écoute restait illisible : sons
qui se chevauchent, volume qui pompe, pistes qui continuent après leur sortie.
Trois causes indépendantes, aucune visible dans le code du moteur.

## Causes racines

### 1. Des placeholders qui pulsaient

Les sons de développement étaient générés avec `tremolo=f=0.1:d=0.8` : le volume
variait de 80 % toutes les dix secondes. **La source masquait complètement les
fondus.** Pire, elle faussait les mesures : les « enveloppes » relevées
mesuraient le trémolo, pas le fondu.

→ **Correction** : [ADR 0015](../02-decisions/0015-placeholders-tons-tenus.md).
Des tons tenus, à volume constant.

### 2. Trois boutons pour une seule bande-son

Terre, Feu et Eau ouvrent tous la même bande-son du voyage — fidèle au son livré
par le client. Mais les toucher l'un après l'autre **empilait trois copies
décalées de la même piste**, chacune en fondu croisé avec la précédente. C'était
une grosse part du « chaotique ».

→ **Correction** : relancer une ambiance déjà en cours est sans effet
(`playAmbiance` sort immédiatement si `state.ambianceId === id`).

### 3. Un fondu de sortie qui ne coupait pas

Descendre le gain à zéro n'arrête pas une piste : elle continue de tourner en
silence, à consommer batterie et réseau — et à occuper un lecteur.

→ **Correction** : un fondu de sortie programme toujours l'arrêt réel une fois
écoulé (`fadeOutAndStop`, avec `STOP_MARGIN_SEC` de marge). À ne jamais
confondre avec le **ducking**, qui descend puis remonte et ne coupe jamais
(`updateDuck`). Tableau comparatif dans
[conception / moteur audio](../01-conception/02-moteur-audio.md).

## Ce qu'on en retient

- [Leçon 03 — se demander ce que fait la répétition](../04-lecons/03-que-fait-la-repetition.md)
- [Leçon 04 — un outil de test doit être ennuyeux](../04-lecons/04-un-outil-de-test-doit-etre-ennuyeux.md)
- [Leçon 05 — un gain à zéro n'est pas un arrêt](../04-lecons/05-un-gain-a-zero-n-est-pas-un-arret.md)

# Leçon 02 — Ne pas relire une API qu'on vient de piloter

`gain.value` relu juste après `setValueAtTime(0, now)` renvoie encore l'ancienne
valeur : le fil audio n'a pas appliqué l'événement. Mesuré dans un vrai Chrome —
la valeur lue était `1.000` alors que zéro venait d'être planifié.

Pire, `cancelScheduledValues(t)` efface aussi un événement posé **exactement**
à `t`. Enchaîner deux fondus de la façon naïve annulait donc le premier, ce qui
désactivait silencieusement tous les fondus de l'application.

**En pratique.** Quand une API accepte des ordres différés, l'état courant se
**tient soi-même**, il ne se redemande pas. C'est le rôle de `GainRamp` : elle
sait où en est le gain, y compris en plein milieu d'un fondu, sans jamais
interroger le paramètre.

Voir [ADR 0004](../02-decisions/0004-fondus-pilotes-par-gainramp.md).

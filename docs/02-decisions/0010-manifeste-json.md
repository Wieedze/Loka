# ADR 0010 — Tout le contenu vient d'un manifeste JSON, sans backend

- **Statut** : accepté — 19/08/2026
- **Portée** : `public/manifest.json`, `src/content/`

## Contexte

Le client prévoit des extensions (nouvelles méditations, nouveaux mantras) après
la sortie du jeu. La V1 est en français, mais l'architecture doit rester
extensible. Personne ne veut redéployer du code pour ajouter une piste.

## Décision

Toutes les pistes et **toutes les variables de mixage** vivent dans
`public/manifest.json`. Ajouter une méditation = ajouter une entrée et un
fichier, zéro ligne de code.

```json
{
  "version": 1,
  "mix": { "duckLevel": 0.25, "duckInSec": 1.5, "duckOutSec": 4,
           "crossfadeSec": 3, "voiceFadeSec": 1 },
  "tracks": [ { "id": "tfe", "role": "ambiance", "file": "audio/tfe.m4a", "loop": true } ]
}
```

Pas de backend, donc **aucun secret dans le dépôt** : `.env.example` ne porte que
`VITE_AUDIO_BASE`.

## Conséquences

- Les réglages artistiques (durée des fondus, niveau du ducking) se règlent sans
  développeur — voir le tableau dans
  [conception / moteur audio](../01-conception/02-moteur-audio.md).
- Le manifeste doit être **validé au chargement** (`src/content/manifest.ts`) :
  c'est une entrée non typée.
- Le champ `version` sert de clé de cache pour le préchargement futur
  ([0012](0012-pwa-reportee.md)).

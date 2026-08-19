# La Loka — notes pour Claude Code

Application web compagnon sonore du jeu de plateau La Loka (client : Oddwave Studio).
Accès par QR code sur la boîte du jeu. Spec fonctionnelle : `docs/spec-v1.md`. Stack et
décisions techniques : `docs/architecture.md`.

## Règle d'environnement — droits des fichiers

La session Claude tourne en **root**, l'utilisateur travaille sous **max**. Tout fichier créé
appartient donc à root et devient inaccessible depuis son IDE.

**Après toute écriture de fichiers (y compris celles des sous-agents et des workflows) :**

```bash
chown -R max:max /home/max/Project/Loka
```

## Commandes

```bash
bun install
bash scripts/make-placeholders.sh   # sons de dev (ffmpeg)
bun run dev
bunx tsc --noEmit
bunx vitest run
```

## Contraintes structurantes du code

- **Deux types de lecteurs audio, ce n'est pas un doublon** : `StreamPlayer` (`<audio>` dans le
  graphe Web Audio) pour les pistes longues — décoder les 45 min de Terre-Feu-Eau en
  `AudioBuffer` ferait ~950 Mo de RAM et planterait le mobile. `BufferPlayer` pour les pistes
  courtes.
- **La boucle Terre-Feu-Eau se fait par deux lecteurs alternés en crossfade**, pas par
  `loop=true` (blanc audible sur certains navigateurs).
- **Toute lecture peut être refusée par iOS hors geste utilisateur** : `play()` renvoie une
  promesse, son échec doit toujours déclencher le même nettoyage que la fin naturelle — sinon
  le ducking reste bloqué ou l'ambiance meurt en silence.
- **Les fondus se pilotent par `GainRamp`, jamais en relisant `param.value`** : la valeur d'un
  `AudioParam` n'est pas relisible juste après une planification, et `cancelScheduledValues(now)`
  efface un événement posé exactement à `now`. Enchaîner deux `fadeTo` naïvement annule le
  premier — c'est ce qui avait silencieusement désactivé tous les fondus de l'app.
- Le moteur (`src/audio/`) et la machine d'état (`src/journey/`) sont du TypeScript pur, sans
  React ni DOM (hors `<audio>`) : c'est ce qui les rend testables.
- **Les 5 règles de mixage de `docs/spec-v1.md` sont couvertes une par une par
  `src/audio/engine.test.ts`**, qui rejoue les automations de gain sur un faux AudioContext et
  vérifie ce qui est réellement audible à un instant donné. Toute modification du mixage doit
  garder ces tests verts — ils sont la spec exécutable.
- Aucun secret dans ce projet (pas de backend). `.env.example` ne porte que `VITE_AUDIO_BASE`.

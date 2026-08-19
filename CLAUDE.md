# La Loka — notes pour Claude Code

Application web compagnon sonore du jeu de plateau La Loka (client : Oddwave Studio).
Accès par QR code sur la boîte du jeu.

**À lire avant de toucher au son : `docs/04-lecons/`** — les règles tirées des
pièges déjà rencontrés ; le récit détaillé est dans `docs/03-postmortems/`.
Plusieurs de ces bugs ont survécu à une suite de tests verte.

| Sujet | Document |
|---|---|
| Ce que l'app doit faire | `docs/00-produit/02-spec-v1.md` |
| Enchaînements sonores, variables temporelles, déclencheurs | `docs/01-conception/02-moteur-audio.md` |
| Stack et décisions techniques | `docs/01-conception/01-architecture.md` |
| Pourquoi tel choix technique | `docs/02-decisions/` |
| Ce qui a mal tourné, et la leçon | `docs/03-postmortems/`, `docs/04-lecons/` |
| Contexte daté et reste à faire | `docs/05-journal/` |
| La carte complète de la documentation | `docs/README.md` |
| Questions en attente côté client | `docs/00-produit/03-questions-ouvertes.md` |
| Vérifier un fondu pour de vrai | `tools/README.md` |

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
- **Les règles de mixage de `docs/00-produit/02-spec-v1.md` sont couvertes une par une par
  `src/audio/engine.test.ts`**, qui rejoue les automations de gain sur un faux AudioContext.
  Toute modification du mixage doit garder ces tests verts — ils sont la spec exécutable.
  **Mais ils ne prouvent pas que le son est bon** : ils vérifient ce qui est *planifié*, pas ce
  qui sort du haut-parleur. Pour ça, `tools/mesure-enveloppe.ts` ou la page `/diagnostic`.
- **Un fondu de sortie se termine toujours par une coupure réelle** (`fadeOutAndStop`), un
  ducking jamais (`updateDuck`). Ne pas confondre les deux : une piste laissée à gain zéro
  continue de tourner.
- **Les placeholders audio doivent être des tons tenus à volume constant.** Un placeholder qui
  pulse masque les fondus et rend toute écoute — et toute mesure — ininterprétable.
- Aucun secret dans ce projet (pas de backend). `.env.example` ne porte que `VITE_AUDIO_BASE`.

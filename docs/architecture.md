# La Loka — Stack & Architecture

Référence technique du projet. Périmètre fonctionnel : voir `spec-v1.md`.

## Révision — périmètre du scaffold initial (19/08/2026)

Simplifications actées après ré-examen, pour un début clair sans code dormant :

- **Pas de Zustand** : le moteur expose `subscribe()`/`getState()`, React s'y branche via `useSyncExternalStore`. Zéro dépendance d'état.
- **PWA / préchargement / service worker différés** (jalon 3). Aucune trace dans le scaffold ; la couture est `manifest.json`.
- **R2 / Pages Function différés** au déploiement. En dev l'audio vit dans `public/audio/` (placeholders ffmpeg).
- **2 écrans** (Accueil, Voyage) — l'écran Chargement arrive avec le préchargement.
- **Secrets : il n'y en a aucun** (pas de backend, pas de clé). Hygiène posée quand même : `.env.example` (`VITE_AUDIO_BASE`), `.env` gitignoré.

## Stack

| Brique | Choix | Pourquoi |
|---|---|---|
| Langage / UI | **TypeScript + React 19 + Vite** | Même socle que le site Oddwave. SPA une page, pas de SSG (rien à indexer, accès par QR). |
| Gestion de paquets | **bun** | Précédent OddwaveStudio (bun.lock). |
| Audio | **Web Audio API native** (pas de Howler) | On a besoin du graphe : bus de gain pour le ducking, rampes, crossfades. Howler masque justement ce dont on a besoin. |
| État UI | **Zustand** (léger) | Le moteur audio vit hors React ; Zustand fait le pont moteur → UI sans cérémonie. |
| Styles | **CSS vanilla + custom properties** | La charte sortira de Claude Design sous forme de tokens ; pas besoin de Tailwind pour 3 écrans. |
| PWA / offline | **vite-plugin-pwa** (app shell) + **Cache API manuelle** (audio) | Workbox précache le shell ; l'audio (~120 Mo) est téléchargé par notre PreloadManager avec barre de progression — Workbox ne sait pas faire ça proprement. |
| Tests | **Vitest** sur le moteur (AudioContext mocké) | La logique de mixage/machine d'état est testable sans navigateur. |
| Hébergement | **Cloudflare Pages + R2** | Fichier > 25 Mo impossible en asset Pages (la TFE fait ~43 Mo) → R2 obligatoire, servi same-origin via une Pages Function `/audio/*` → binding R2. Egress gratuit. |
| Encodage | **AAC (m4a) 128 kbps**, ffmpeg scripté | Support universel iOS/Android. Masters WAV livrés par Oddwave, script `scripts/encode.sh` reproductible. |

## La contrainte qui dicte tout : la mémoire

`decodeAudioData` charge le PCM décodé en RAM : la bande Terre-Feu-Eau de 45 min ≈ **950 Mo décodée** → crash mobile garanti. Donc **deux types de lecteurs** :

- **StreamPlayer** — `<audio>` + `MediaElementAudioSourceNode` branché dans le graphe : décodage en flux, RAM quasi nulle. Pour : ambiances TFE/Air/Renouveau, méditations (4 min ≈ 85 Mo décodées, trop pour en garder plusieurs).
- **BufferPlayer** — `AudioBuffer` classique : précis, léger. Pour les pistes courtes : jingle, mantras (30 s ≈ 10 Mo), ambiance Lucidité, Porte, clôture.

Les deux se branchent sur les mêmes bus, le reste du moteur ne voit pas la différence.

## Architecture du moteur audio

Deux plans, et un seul se baisse. Le **fond** — ambiances et mantras — s'efface
quand une voix parle ; la **voix** va droit à la sortie, puisque c'est elle que
le reste laisse passer.

```
  ambiances ─┐
             ├─► fond (le seul gain qui bouge) ─┐
  mantras ───┘                                  ├─► destination
                                                │
  méditations, jingle, Porte, clôture ──────────┘
```

Chaque lecteur porte en plus son propre gain, pour ses fondus d'entrée et de
sortie. Le bus du fond, lui, ne sert qu'au ducking.

- **Ducking** : une seule rampe, sur le fond, vers `duckLevel` en `duckInSec` ;
  retour en `duckOutSec` à la fin. Plusieurs voix peuvent se superposer :
  `updateDuck()` recalcule la cible à partir de l'état, donc la dernière voix à
  finir est celle qui relève le fond.
- **Fondu croisé** : l'ancienne piste descend pendant que la nouvelle monte,
  chacune sur son propre gain. Utilisé pour TFE → Air et mantra → mantra.
- **Boucle TFE sans couture** : deux StreamPlayers en alternance ; à l'approche
  de la fin du A, le B démarre en fondu croisé. `loop=true` natif a un blanc
  audible sur certains navigateurs.
- **Un fondu part quand le son sort**, jamais quand on le demande : la règle
  vit dans `FadingPlayer.play()`, un seul endroit pour tous les lecteurs.
- Le moteur est du **TypeScript pur, zéro React, zéro DOM direct sauf `<audio>`** → testable, et la charte/UI peut changer sans le toucher.

## Machine d'état du voyage

Phases (avancement principal, un bouton = une transition) :
`attente → commencement → voyage(TFE) → lucidite(Air) → finale(Porte→Renouveau) → cloture`

Overlays (superposés à la phase, ne la changent pas) : `meditation` (ducke l'ambiance), `mantra` (un seul à la fois ; exclusif avec méditation si Q4 = non).

Principe « tout est rattrapable » (B5) : la machine est **permissive** — chaque bouton reste actionnable pour relancer sa piste ; l'UI guide (met en avant la prochaine étape logique) mais ne verrouille pas.

## Contenu : le manifeste

Toute piste vient de `manifest.json` — ajouter une méditation d'extension = ajouter une entrée + un fichier, zéro code :

```json
{
  "version": 1,
  "mix": { "duckLevel": 0.25, "duckInSec": 1.5, "duckOutSec": 4, "crossfadeSec": 3 },
  "tracks": [
    { "id": "accueil",  "role": "jingle",     "file": "audio/accueil.m4a" },
    { "id": "tfe",      "role": "ambiance",   "file": "audio/terre-feu-eau.m4a", "loop": true },
    { "id": "air",      "role": "ambiance",   "file": "audio/air.m4a" },
    { "id": "med-01",   "role": "meditation", "title": "…", "file": "audio/meditations/01.m4a" },
    { "id": "mantra-01","role": "mantra",     "title": "…", "file": "audio/mantras/01.m4a" }
  ]
}
```

## Préchargement & offline

1. Premier lancement : `PreloadManager` télécharge chaque piste du manifeste → `caches.open('loka-audio-v1')`, progression réelle en octets (écran de chargement rituel).
2. Service worker : cache-first sur `/audio/*` (sert les `<audio>` hors-ligne) ; app shell précaché par vite-plugin-pwa.
3. Versionnage par le manifeste : nouvelle version → on ne retélécharge que les pistes nouvelles/modifiées.

## Système

- `wakeLock.ts` — Screen Wake Lock (iOS ≥ 16.4 ✓), ré-acquisition sur `visibilitychange`.
- `visibility.ts` — reprise de l'`AudioContext` si iOS l'a suspendu au retour d'onglet.
- Autoplay : aucun son avant le geste « Commencement » (résout la politique iOS/Android par design).

## Arborescence

```
src/
  audio/        # moteur pur TS : engine.ts, players.ts, buses, ducking
  journey/      # machine d'état des phases + overlays
  content/      # types + chargement du manifest.json
  preload/      # PreloadManager (Cache API, progression)
  system/       # wakeLock.ts, visibility.ts
  ui/
    screens/    # Chargement / Accueil / Voyage
    components/ # BoutonRituel, ChoixMeditation, …
  styles/       # tokens.css (charte Claude Design), base.css
public/
  manifest.json
  audio/        # placeholders en dev ; en prod servi par R2
audio-src/      # masters WAV (hors git)
scripts/
  encode.sh     # WAV → m4a (ffmpeg), placeholders de dev
functions/
  audio/[[path]].ts   # Pages Function → binding R2 (prod)
docs/
```

## Écrans (3 seulement)

1. **Chargement** — premier lancement : téléchargement avec progression ; ensuite instantané.
2. **Accueil** — bouton « Commencement » (spirale) : déclenche le jingle ET débloque l'audio.
3. **Voyage** — l'écran unique de jeu : les 6 boutons, indication discrète de ce qui joue, choix des 10 méditations en panneau (lotus).

## Risques identifiés & parades

| Risque | Parade |
|---|---|
| RAM mobile (pistes longues) | StreamPlayer (voir plus haut) — décision structurante déjà prise |
| iOS suspend l'AudioContext en arrière-plan | wake lock + resume sur visibilitychange + consigne UI |
| Blanc dans la boucle TFE | double StreamPlayer en crossfade |
| Fichier > 25 Mo sur Pages | R2 + Pages Function same-origin |
| Masters pas encore livrés | placeholders générés par ffmpeg (drones/bruits), le moteur se développe sans attendre |

## Jalons de dev

1. **Moteur** — scaffold + engine + placeholders : preuve du ducking/crossfade/boucle dans le navigateur.
2. **Voyage** — machine d'état + 3 écrans + 6 boutons (tokens provisoires).
3. **Terrain** — PWA, préchargement, wake lock ; tests sur vrais iPhone/Android.
4. **Habillage** — charte Claude Design + vrais masters + réponses Q1–Q6.
5. **Sortie** — Pages + R2, domaine, URL pérenne, QR code imprimeur.

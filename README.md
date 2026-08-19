# La Loka

Compagnon audio du jeu La Loka — web app mobile (React + Vite + Web Audio).
**Documentation** : <https://wieedze.github.io/Loka/> — ou [`docs/`](docs/) dans le dépôt.
À lire avant de toucher au son : [`docs/04-lecons/`](docs/04-lecons/).

## Prérequis

- [bun](https://bun.sh)
- ffmpeg (génération des placeholders audio de dev)

## Installer

```sh
bun install
```

## Générer les placeholders audio

Les masters ne sont pas encore livrés ; des sons de dev différenciés sont générés dans `public/audio/` (gitignoré) :

```sh
bash scripts/make-placeholders.sh
```

## Lancer

```sh
bun run dev
```

## Tester

```sh
bun run test        # vitest (machine d'état, rampes)
bun run typecheck   # tsc --noEmit
```

## Structure

```
src/audio     moteur Web Audio pur TS : bus, ducking, crossfades, boucle sans couture
src/journey   machine d'état des phases du voyage (reducer pur)
src/content   types + chargement/validation de public/manifest.json
src/system    wake lock
src/ui        écrans Accueil / Voyage, boutons rituels, hook useEngine
src/styles    tokens provisoires + base CSS mobile
scripts       make-placeholders.sh (ffmpeg)
public        manifest.json + audio/ (placeholders)
```

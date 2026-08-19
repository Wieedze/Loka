# Outils de vérification

## `mesure-enveloppe.ts` — mesurer un fondu pour de vrai

Rend l'audio dans un vrai Chrome via un `OfflineAudioContext`, avec le **vrai
code** de `src/audio/ramp.ts`, et renvoie l'enveloppe mesurée. C'est le seul
moyen de répondre à « est-ce que le fondu s'entend » sans se fier à un test qui
ne vérifie que la planification.

À utiliser quand un enchaînement sonore est suspect, avant de relire le code.

### S'en servir

Trois terminaux (ou trois tâches de fond) :

```bash
# 1. le serveur de développement
bunx vite --port 5191 --host 127.0.0.1

# 2. un Chrome piloté à distance
~/.cache/puppeteer/chrome-headless-shell/*/chrome-headless-shell-linux64/chrome-headless-shell \
  --no-sandbox --disable-gpu --remote-debugging-port=9223 \
  --autoplay-policy=no-user-gesture-required about:blank

# 3. la mesure
bun tools/mesure-enveloppe.ts 5191
```

Sortie : la crête par tranche de 0,5 s, en barres. Un fondu correct dessine une
pente régulière ; un fondu absent dessine une marche.

```
 0.0s | 0.006
 1.0s |█ 0.019
 2.0s |█ 0.031
 3.0s |██ 0.038   ← fondu d'entrée terminé
 4.5s |█ 0.027    ← creux normal au centre d'un fondu croisé
 6.5s |██ 0.038   ← la seconde piste a pris le relais
```

Le scénario mesuré est écrit en clair dans la constante `EXPRESSION` du script :
le modifier pour reproduire le cas suspect.

### Deux limites à connaître

- **L'horloge audio d'un `AudioContext` normal est gelée en headless** (pas de
  périphérique de sortie) : `currentTime` reste à 0. On ne peut donc mesurer que
  du rendu hors-ligne. Pour vérifier le trajet temps réel, il faut la page
  `/diagnostic` sur un vrai appareil.
- Un `OfflineAudioContext` ne sait pas lire un élément `<audio>` : le script
  décode les fichiers en mémoire. La chaîne de gain testée est en revanche
  exactement celle de l'application.

## `/diagnostic` — vérifier à l'oreille sur un appareil

`bun run dev` puis `/diagnostic`. Joue deux sons tenus (110 Hz et 330 Hz) avec le
vrai lecteur, trace le **niveau mesuré en sortie**, et affiche l'horloge audio et
l'état du contexte — utile pour repérer un `AudioContext` suspendu.

Boutons : entrée en fondu, croisement, **sortie** (fondu *puis coupure*),
**ducking** (baisse *puis remontée*, sans jamais couper). Durée réglable de 0,5
à 10 s.

La page reste hors du bundle de production : Vite ne construit que `index.html`.

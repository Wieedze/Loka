# Reste à faire — issu de la relecture du 19 août 2026

Deux relectures indépendantes du code, plus une vérification documentation ↔
code. Ce qui a été **corrigé le jour même** est en bas ; ce qui suit ne l'est
pas encore, classé par ce que ça coûte si on l'oublie.

---

## Ce qui casse une partie en cours

### 1. La rotation de boucle peut tuer l'ambiance définitivement

`engine.ts` — la rotation démarre à `duration - crossfadeSec`, soit **3 s** avant
la fin d'un fichier de 45 min. Le jumeau est un `<audio>` neuf : `play()` ne
résout qu'une fois assez de données en tampon. Si ça dépasse 3 s — réseau d'une
salle, fichier streamé — l'ancien lecteur émet `ended` pendant la fenêtre où il
porte encore son `onEnded` : l'ambiance meurt, définitivement.

Deux gestes, les deux nécessaires :
- amorcer le jumeau bien plus tôt (`crossfadeSec + 5 à 10 s`), muet, et ne lancer
  les deux rampes qu'une fois `play()` résolu ;
- rendre le gestionnaire de fin tolérant à une rotation en vol (`channel.rotating`
  → ne pas démonter le canal).

### 2. Après un appel téléphonique, l'ambiance est perdue et rien ne la ramène

`visibility.ts` ne fait que réveiller l'`AudioContext` ; **rien ne relance les
éléments `<audio>`** que le système a mis en pause. Pire, `playAmbiance` sort
immédiatement si l'ambiance demandée est déjà « en cours » — donc re-toucher
Terre, le seul recours, ne fait rien.

- `engine.restoreAfterInterruption()` au retour au premier plan : relancer les
  lecteurs en pause dont l'état dit qu'ils devraient jouer.
- Remplacer la garde par un test sur l'état **réel** du lecteur (`isPlaying`),
  pas sur l'identifiant affiché.

### 3. Le repli « iOS refuse la rotation » fuit une douzaine d'éléments média

Le compteur ne s'arrête pas : sur les 3 s restantes, ~12 `<audio>` + nœuds créés
et abandonnés, puis l'ambiance meurt quand même. iOS limite le nombre de
décodeurs simultanés : ces fuites finissent par empêcher les lectures légitimes.
Abandonner après un ou deux échecs, arrêter le poll, et assumer le silence en
remettant `ambianceId` à `null` pour que le bouton redevienne utilisable.

### 4. Une piste absente produit un silence total, sans aucun signal

`players.ts` : l'événement `error` appelle `onEnded`, exactement comme une fin
normale. Le moteur ne distingue pas « fini » de « n'existe pas ». Si `porte.m4a`
manque, l'ambiance a déjà été coupée, Renouveau ne démarre jamais : **la table
finit la partie en silence**, l'écran affiche « Silence ».

`onError` distinct dans `Player`, un champ d'erreur dans `EngineState`, un
affichage (« Piste indisponible — Porte »), et enchaîner Renouveau même si la
Porte échoue.

---

## Ce qui use la mémoire du téléphone

### 5. Le cache de buffers n'a aucune borne

`players.ts` — `bufferCache` n'est jamais purgé. Avec les 10 mantras de la V1 :
**~101 Mo de PCM décodé retenus toute la partie**, plus le jingle, la Porte,
Lucidité, la clôture. Sur un iPhone d'entrée de gamme, c'est la zone d'éviction
de l'onglet — en pleine partie collective.

Le plus simple est sans doute de passer les mantras en `StreamPlayer` : ils
entrent en fondu sur 3 s, la latence de démarrage n'a aucune importance pour eux,
contrairement au jingle et à la Porte.

### 6. Chaque lecture laisse un `<audio>` et un nœud source vivants

`createMediaElementSource` crée un nœud dont la référence est jetée. `stop()`
déconnecte le gain, pas la source, et ne libère pas l'élément. Stocker le nœud,
et dans `stop()` : `mediaSource.disconnect()`, `audio.removeAttribute('src')`,
`audio.load()`, plus retrait des écouteurs (`AbortController` sur
`addEventListener({ signal })`).

---

## Ce qui casse à la première extension

### 7. Identifiants de pistes en dur dans l'interface — *partiellement corrigé*

**Corrigé pour les quatre éléments** : leurs pistes viennent désormais du
manifeste, via les presets ([ADR 0017](../02-decisions/0017-pages-d-element-pilotees-par-preset.md)),
et `parseManifest` refuse un preset pointant vers une piste absente. Restent en
dur `'accueil'`, `'porte'`, `'renouveau'` et `'cloture'`, qui appellent le même
traitement.

`Voyage.tsx` connaît `'tfe'`, `'air'`, `'accueil'`, `'lucidite'`, `'porte'`,
`'renouveau'`, `'cloture'`. Renommer un identifiant dans le manifeste casse un
bouton **en silence** : `mustTrack` lève, l'exception remonte dans `onClick`, la
phase n'avance pas, aucun message. Ni le typage ni les tests ne le voient.

Une section `parcours` dans le manifeste qui relie chaque rôle fixe du voyage à
un identifiant, vérifiée dans `parseManifest`. L'interface ne connaît plus que
`parcours.voyage`. La *structure* du parcours reste en dur — c'est légitime ;
*quelle piste* joue à quel moment est du contenu.

### 8. `make-placeholders.sh` recopie le manifeste à la main

13 lignes en dur, et un compteur « 13 fichiers » en dur aussi. Ajouter `med-04`
au manifeste ne génère aucun placeholder : l'entrée apparaît dans le panneau,
l'appui ne produit rien, et on croit à un bug du moteur. Boucler sur
`tracks[]` du manifeste.

### 9. Le manifeste accepte des valeurs absurdes sans broncher

Seul `Number.isFinite` est vérifié. `"duckLevel": 25` au lieu de `0.25` passe,
puis est écrêté à 1 : **plus aucun ducking**, sans explication.
`"crossfadeSec": -3` passe aussi et produit un `setTimeout` négatif qui coupe la
piste net. Et `"lop"` au lieu de `"loop"` est ignoré en silence — la boucle de
Terre-Feu-Eau est désactivée, l'ambiance s'arrête au bout de 45 min.

`asRatio` (0 à 1) et `asDuration` (0 à 30 s) avec la plage dans le message, et
rejet des clés inconnues. C'est le fichier que le client éditera sans nous.

### 10. Le vocabulaire des rôles est éclaté sur quatre fichiers

`types.ts`, `manifest.ts`, `engine.ts` (`SPOKEN_ROLES`), `Voyage.tsx`. La liste
des rôles est de la structure, acceptable. Mais **« cette piste baisse le fond »
est un réglage artistique** : la question ouverte n°1 du client (l'ambiance
Lucidité doit-elle ducker ?) imposera aujourd'hui de modifier le moteur. Un champ
optionnel `"ducks"` sur la piste, défaut dérivé du rôle.

---

## Simplifications et cohérence

11. **`updateDuck` est réglé, mais `SPOKEN_ROLES` contient encore `'meditation'`**
    alors qu'aucune méditation ne passe par `playOneShot` : entrée morte, et la
    règle « qu'est-ce qui ducke » vit à deux endroits.
12. **`NEXT_EVENT` est entièrement dérivable de `RULES`** — trois tables pour une
    séquence, à garder cohérentes sans que rien ne le vérifie, alors que deux
    questions client encore ouvertes vont modifier cette séquence.
13. **`initialGain` ne décide de rien** : `play(fadeInSec)` fixe déjà le point de
    départ. Les sept sites de construction le passent de façon redondante.
14. **L'interface `Player` ne sert qu'à une méthode privée** ; partout ailleurs le
    moteur type en classes concrètes, et l'interface ne porte ni `pause`, ni
    `duration`, ni `currentTime` dont il a besoin. Choisir : la compléter et
    typer tous les champs avec, ou la supprimer.
15. **`EngineState` ignore les one-shots** : au tout début, le message d'accueil
    joue et l'écran affiche « Silence », la spirale ne s'allume pas — d'où le
    deuxième appui qui coupe le message qu'on voulait entendre.
16. **`voicePaused` + `voiceId`** encodent un état à trois valeurs sur deux
    champs, dont une combinaison incohérente est représentable.
17. **`version` est exigé, parsé, jamais lu.** Lui donner un rôle (clé de cache)
    ou l'admettre comme réservé.
18. **`visibility.ts` et `wakeLock.ts` réinventent chacun « au retour au premier
    plan »** : un seul `onForeground(cb)` suffirait.
19. **`cancelled` est irréversible et `stop()` déconnecte le gain** : un `play()`
    après `stop()` réussit en silence et n'est branché à rien. Rendre l'état
    terminal explicite plutôt que de compter sur le fait qu'aucun chemin ne
    l'atteint aujourd'hui.
20. **Le manifeste de test diverge du vrai** (11 pistes contre 13, chemins
    différents) et les valeurs de mix sont recopiées une troisième fois : les
    tests resteront verts quoi qu'il advienne du vrai contenu.
21. **`src/content/manifest.ts` n'a aucun test**, alors que c'est la pièce qui
    tient la promesse « le contenu évolue sans redéveloppement ».
22. **L'échec du wake lock est avalé sans un mot**, alors que la spec le déclare
    indispensable. Sur Android en économie de batterie, l'écran s'éteint et
    personne ne comprend pourquoi.
23. **Chaîne d'outils non figée** : `bun-version: latest` dans les deux workflows,
    aucun linter, la CI réécrit à la main ce que `bun run build` fait déjà, et
    `tools/` n'est ni typé ni couvert.
24. **Le glyphe `etoile` est défini et inutilisé**, alors que la spec décrit une
    étoile filante pour Lucidité. Code mort ou écart avec la spec — pas les deux.
25. **`public/manifest.json` porte le nom conventionnel du manifeste PWA**, prévu
    au jalon 3. Renommer coûte deux lignes maintenant.
26. **`/diagnostic` n'existe pas en production** ; le journal du 19 août le
    présente comme ouvrable par le client. Soit l'inclure au build, soit corriger
    la phrase.

---

## Corrigé le 19 août, après la relecture

- **Fondus exponentiels au lieu de linéaires.** L'oreille entend le volume de
  façon logarithmique : une rampe linéaire s'entend comme « rien ne change, puis
  ça disparaît d'un coup ». C'est très probablement ce que le client entendait
  depuis le début, malgré des mesures qui montraient une rampe correcte.
- **Le ducking pouvait rester bloqué à 25 % pour le reste de la partie** — un
  message non parlé remplaçant un message parlé ne relevait jamais le fond.
  `updateDuck()` déduit désormais cible **et** durée de l'état.
- **Une méditation en pause laissait l'ambiance étouffée** alors que plus rien ne
  parlait.
- **`navigator.audioSession.type = 'playback'`** : sans ça, l'interrupteur
  silencieux d'un iPhone coupe tout le son de la page. Le téléphone est posé sur
  une table, personne n'ira vérifier ce petit interrupteur.
- **Un échec de chargement se voit enfin** : état visible, message en français,
  ré-essai en re-touchant la spirale, et délai maximum de 8 s sur le manifeste.
- **Le manifeste est validé en CI** (`bun run check:contenu`) avec le vrai
  validateur, plus unicité des identifiants, existence des fichiers et présence
  des titres.

## Source

Cette liste vient de deux relectures indépendantes menées le 19 août 2026, et
d'un document de référence sur l'audio en PWA mobile fourni par max, dont sont
issus les fondus exponentiels, la session audio iOS, et l'avertissement sur le
stockage hors-ligne : préférer un Blob en IndexedDB lu via `blob:` URL au
Cache API, qui impose de répondre soi-même aux requêtes `Range` — Safari refuse
une réponse complète à une requête de plage sur du média, et l'audio reste muet
sans erreur. À reprendre au jalon 3.

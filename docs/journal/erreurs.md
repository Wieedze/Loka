# Erreurs commises et pourquoi

Le document le plus utile du dossier. Chaque entrée : ce qu'on a cru, ce qui
était vrai, et le signe qui aurait dû alerter plus tôt.

---

## 1. Croire qu'un test vert prouve que le son est bon

**Cru :** 38 tests passaient sur le moteur audio, donc les fondus marchaient.

**Vrai :** les tests vérifiaient que les bonnes automations étaient *planifiées*.
Ils ne pouvaient rien dire de ce qui sort réellement du haut-parleur. Trois
bugs distincts ont survécu à une suite verte pendant des heures, et c'est
l'oreille du client qui les a trouvés, trois fois de suite.

**Signe d'alerte :** « ça ne marche pas » répété alors que les tests sont verts.
La bonne réaction est de **mesurer**, pas de relire le code ni d'ajouter un test
de la même famille.

**Ce qu'on a mis en place :** `tools/mesure-enveloppe.ts`, qui rend vraiment
l'audio dans un Chrome et renvoie l'enveloppe mesurée ; et la page
`/diagnostic`, qui trace le niveau réel sur l'appareil de l'utilisateur.

---

## 2. Planifier un fondu avant que le son ne sorte

**Cru :** `play()` déclenche le son, donc on peut lancer la rampe juste avant.

**Vrai :** entre `play()` et le premier échantillon audible il y a le réseau, le
décodage, la mise en tampon. Le fondu s'écoulait **pendant le chargement**, en
silence, et la piste apparaissait à plein volume. Invisible en local (le fichier
est déjà là), flagrant sur un téléphone.

**Correction :** `play(fadeInSec)` attend la promesse de lecture, puis lance la
rampe à l'horloge audio de cet instant-là. Test de régression :
« attend le démarrage du fichier au lieu de s'écouler pendant le chargement ».

---

## 3. Relire `gain.value` pour savoir où en est un fondu

**Cru :** on peut lire la valeur courante d'un `AudioParam` pour enchaîner.

**Vrai :** juste après une planification, la valeur lue est encore l'ancienne —
le fil audio n'a pas appliqué l'événement. Mesuré dans un vrai Chrome : après
`setValueAtTime(0, t)`, `gain.value` renvoie toujours `1.000`.

**Et pire :** `cancelScheduledValues(t)` efface aussi un événement posé
*exactement* à `t`. Enchaîner `fadeTo(0, 0)` puis `fadeTo(1, 3)` annulait donc le
premier appel. **Tous les fondus de l'app étaient silencieusement désactivés.**

**Correction :** `GainRamp` (dans `src/audio/ramp.ts`) suit lui-même la valeur
courante et sait repartir du bon niveau, même en plein milieu d'un fondu.

---

## 4. Des placeholders qui pulsent

**Cru :** peu importe à quoi ressemblent les sons de test, on teste la mécanique.

**Vrai :** les placeholders étaient générés avec `tremolo=f=0.1:d=0.8` — le
volume variait de 80 % toutes les 10 secondes. **La source masquait complètement
les fondus**, rendant l'écoute chaotique et faussant jusqu'aux mesures (les
« enveloppes » relevées mesuraient le trémolo, pas le fondu).

**Correction :** des tons **tenus, à volume constant**, une hauteur par piste.
Un placeholder doit être ennuyeux pour que les enchaînements soient lisibles.

---

## 5. Trois boutons pour une seule bande-son

**Cru :** Terre, Feu et Eau peuvent tous ouvrir la bande-son du voyage, c'est
fidèle au son.

**Vrai :** les toucher l'un après l'autre empilait trois copies décalées de la
même piste en fondu croisé. C'est une grosse part du « chaotique ».

**Correction :** relancer une ambiance déjà en cours est sans effet
(`playAmbiance` sort tout de suite si `state.ambianceId === id`).

**À retenir plus largement :** dès que plusieurs commandes mènent au même son,
se demander ce que produit la répétition.

---

## 6. Un fondu de sortie qui ne coupe pas

**Cru :** descendre le gain à zéro suffit à arrêter une piste.

**Vrai :** la piste continue de tourner en silence, à consommer batterie et
réseau. Repéré à l'oreille par le client sur la page de diagnostic.

**Correction :** un fondu de sortie programme toujours l'arrêt réel une fois
écoulé (`fadeOutAndStop`). À ne pas confondre avec le **ducking**, qui descend
puis remonte et ne coupe jamais. Tableau comparatif dans `docs/son.md`.

---

## 7. Un workflow d'agents qui annonce une fausse convergence

**Cru :** la boucle revue → correction avait convergé à « zéro finding ».

**Vrai :** les agents de la ronde 2 avaient planté (crédits épuisés) et renvoyé
`null`. Le script filtrait les `null`, obtenait une liste vide, et concluait à la
convergence. **12 findings réels n'ont jamais été appliqués**, dont 3 bugs
sérieux.

**Correction :** le script distingue désormais « aucun finding » de « l'agent a
échoué » et s'arrête en signalant les relecteurs en échec.

**À retenir :** un résultat vide venant d'un agent n'est pas un résultat.

---

## 8. Écrire des fichiers en root

**Cru :** sans objet — simple inattention.

**Vrai :** la session tourne en `root`, l'utilisateur travaille en `max`. Le
premier scaffold lui a laissé **78 fichiers inaccessibles** depuis son éditeur,
et `git` refusait le dépôt (`dubious ownership`).

**Correction :** `chown -R max:max` après toute vague d'écriture, y compris
celles des sous-agents. Inscrit dans `CLAUDE.md` et dans les consignes des
workflows.

---

## Le motif commun

Cinq des huit erreurs viennent du même réflexe : **raisonner sur le code au lieu
de mesurer le réel.** Le code était juste, la planification était juste, les
tests étaient verts — et le son était faux. Quand un utilisateur dit « je
n'entends pas », la seule réponse utile est un instrument de mesure.

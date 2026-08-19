# La Loka — App compagnon sonore · Cadrage (version interne)

App web accessible via QR code sur la boîte du jeu. Héberge bandes-son, méditations, mantras et jalons sonores du voyage.

**Version client (à envoyer)** : https://claude.ai/code/artifact/ce9c412d-706d-42eb-b68f-786440150994
La version client ne contient ni la stack technique ni la section hébergement/QR (à notre charge, intégrée au devis).

## Déjà acquis

- **Audio** : produit et livré par Oddwave Studio, au format qu'on veut — probablement WAV. On gère l'encodage web.
- **URL / QR code / hébergement** : à nous de définir et de gérer → à chiffrer dans le devis (domaine, redirection pérenne, génération du QR, hébergement, mise en ligne).

## Déroulé sonore

1. **Accueil** — jingle/message de reliance (= le geste utilisateur qui débloque l'audio mobile)
2. **Voyage** — bande-son progressive Terre·Feu·Eau (~45 min)
3. **Méditations** — la bande-son baisse automatiquement (ducking), la voix passe devant, puis le fond remonte
4. **Mantras** — se superposent à la bande-son
5. **Lucidité** — le Gardien du Seuil lance l'ambiance de passage → le Voyageur active la bande-son Air (~20 min)
6. **Rituels** — bande-son générale seule
7. **La Porte** — ambiance dédiée → bruit de porte → univers « renouveau »
8. **Légende personnelle** — le Voyageur raconte son conte
9. **Clôture** — message audio d'intégration

## Questions envoyées au client

### A. Contenu audio
- **A1.** ⚠️ Inventaire complet : combien de méditations ? de mantras ? + pistes uniques (jingle accueil, Lucidité, Porte, renouveau, clôture). Durées ?
- **A2.** Les bandes-son (45 min / 20 min) sont-elles continues ? Bouclent-elles si la partie dure plus longtemps ?
- **A3.** Plusieurs mantras cumulables en même temps, ou un seul ?
- **A4.** Une méditation peut-elle être mise en pause / interrompue ?
- **A5.** Quel son pendant la légende personnelle — « renouveau » continue en fond ?
- **A6.** Français uniquement, ou multilingue à prévoir ?
- **A7.** Contenu figé à la sortie, ou ajouts prévus (extensions) ?

### B. Déroulé d'une partie
- **B1.** Qui manipule l'app ? Un seul téléphone pour la table ?
- **B2.** Tous les déclenchements sont manuels (pas de minuterie/séquence auto) ?
- **B3.** Méditations liées à des cases précises du plateau, ou choisies librement dans une liste ?
- **B4.** Lucidité : quand la bande-son Air démarre, Terre-Feu-Eau s'arrête (fondu enchaîné) ?
- **B5.** Durée totale d'une partie type ?
- **B6.** Faut-il pouvoir revenir en arrière / relancer une phase (erreur de manip) ?

### C. Design & interface
- **C1.** Au-delà de la charte : illustrations du jeu (cartes, plateau, univers) utilisables ?
- **C2.** Interface minimale (grands boutons, sobre) ou immersive/illustrée ?
- **C3.** Un visuel distinct par univers (Terre, Feu, Eau, Air) ?
- **C4.** Du texte dans l'app (fondements, mode d'emploi) ou uniquement du son ?

### D. Usage réel
- **D1.** Écoute type : haut-parleur du téléphone ou enceinte Bluetooth conseillée ?
- **D2.** Connexion internet garantie là où on joue ? (sinon → préchargement + offline, prévu dans la stack)

### E. Cadre du projet
- **E1.** ⚠️ Dates clés : impression des boîtes, sortie du jeu, jalons (salons, précommandes) ?
- **E2.** Budget envisagé ?
- **E3.** Droits musiques/voix : diffusion en ligne couverte par les contrats existants ?
- **E4.** Maintenance post-lancement : qui, sous quelle forme ?

⚠️ = bloquant (conditionne le démarrage ou une échéance irréversible)

## Stack (interne — validée, pas communiquée au client)

| Brique | Choix | Pourquoi |
|---|---|---|
| Front | React + TypeScript (Vite), SPA une page | Même socle que le site Oddwave |
| Audio | **Web Audio API** (mixage temps réel) | Ducking méditations, superposition mantras, crossfades — de simples `<audio>` ne suffisent pas |
| Hébergement | Cloudflare Pages + **R2** pour l'audio | Pas de frais d'egress sur les gros fichiers, infra identique au site |
| Offline | PWA, préchargement complet (~80–120 Mo estimés) | Jamais couper un voyage en cours |
| Veille | Wake Lock API | Écran allumé >1h, le son ne s'interrompt pas |
| Backend | Aucun — manifeste JSON des pistes | Ajouter du contenu sans redéployer le code |

## Points de vigilance (interne)

1. **URL du QR code irréversible** — la figer sur un domaine maîtrisé + redirection intermédiaire avant toute impression. La vraie deadline, c'est l'imprimeur (E1).
2. **Autoplay mobile interdit** — le bouton « Commencer le voyage » (jingle d'accueil) sert de geste déclencheur.
3. **Mise en veille = son coupé** (surtout iOS) — wake lock à tester tôt sur vrais appareils ; risque technique n°1.
4. **Premier chargement long** (~100 Mo) — écran de chargement soigné, à faire avant la partie ; lancements suivants instantanés.

## À chiffrer dans le devis (section E supprimée du doc client)

- Domaine + URL courte pérenne + redirection
- Génération du QR code (format imprimeur)
- Hébergement et coûts récurrents
- Décision à prendre nous-mêmes : app publique vs accès réservé (si le client n'en parle pas, partir sur public)
- Option : statistiques d'usage anonymes

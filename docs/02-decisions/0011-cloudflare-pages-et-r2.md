# ADR 0011 — Cloudflare Pages pour l'app, R2 pour l'audio

- **Statut** : accepté, **non encore mis en œuvre** — 19/08/2026
- **Portée** : hébergement, `.github/workflows/deploy.yml`

## Contexte

- Le contenu audio pèse ~110–130 Mo encodé, et la bande Terre-Feu-Eau seule fait
  ~43 Mo. **Un asset de plus de 25 Mo est impossible sur Cloudflare Pages.**
- Le site Oddwave tourne déjà sur cette infrastructure.
- Les frais de sortie de données seraient le premier poste de coût sur des
  fichiers de cette taille.

## Décision

- **Pages** pour l'app.
- **R2** pour l'audio, servi **same-origin** via une Pages Function
  `/audio/[[path]].ts` reliée au binding R2 — pour éviter le CORS sur les
  éléments `<audio>` et garder une seule origine à mettre en cache.
- Egress gratuit depuis R2.
- Encodage **AAC (m4a) 128 kbps**, support universel iOS/Android, produit par un
  `scripts/encode.sh` reproductible à partir des masters WAV livrés par Oddwave.

## Statut de mise en œuvre

`deploy.yml` existe et se déclenche sur `main`. Tant que les secrets
`CLOUDFLARE_API_TOKEN` et `CLOUDFLARE_ACCOUNT_ID` ne sont pas renseignés, l'étape
de publication est **ignorée sans faire échouer le workflow**. La Pages Function
et `audio-src/` n'existent pas encore.

## Conséquences

- Le point bloquant du projet n'est pas technique : c'est **l'URL du QR code**,
  irréversible une fois la boîte imprimée. Elle doit être figée sur un domaine
  maîtrisé, derrière une redirection, avant toute impression.

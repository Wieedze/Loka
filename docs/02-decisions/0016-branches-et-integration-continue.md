# ADR 0016 — Branches `main` / `dev` / `feat`, CI sur toutes les branches

- **Statut** : accepté — 19/08/2026
- **Portée** : `.github/workflows/`, `CONTRIBUTING.md`

## Contexte

Projet client avec une mise en ligne à terme derrière un QR code imprimé : ce
qui est publié doit être une décision explicite, jamais un effet de bord d'un
`git push`.

## Décision

- **`main`** — ce qui est en ligne. Ne reçoit que des fusions de `dev`.
- **`dev`** — intégration.
- **`feat/*`**, `fix/*`, `refactor/*`, `docs/*`, `chore/*` — parties de `dev`,
  fusionnées en `--no-ff` pour garder trace de la fonctionnalité.
- **`ci.yml`** — typage, tests, build sur **chaque push, quelle que soit la
  branche** (`branches: ['**']`). Une liste de préfixes finit toujours par
  oublier celui du jour, et une branche sans vérification ne sert à rien.
- **`deploy.yml`** — sur `main` uniquement, cf. [0011](0011-cloudflare-pages-et-r2.md).

## Conséquences

- La CI est le filet qui protège les cinq règles de mixage : `engine.test.ts`
  tourne sur chaque push.
- Le déploiement ne peut pas partir d'une branche de travail.

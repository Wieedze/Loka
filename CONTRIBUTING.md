# Organisation du dépôt

## Branches

| Branche | Rôle |
|---|---|
| `main` | Ce qui est en ligne. On n'y pousse jamais directement : elle ne reçoit que des fusions de `dev`. |
| `dev` | Intégration. Toutes les fonctionnalités y arrivent avant d'être publiées. |
| `feat/*` | Une fonctionnalité, partie de `dev` et fusionnée dans `dev`. |
| `fix/*`, `refactor/*`, `docs/*`, `chore/*` | Même circuit, préfixe assorti au type de travail. |

```bash
git switch dev
git switch -c feat/prechargement-offline
# … commits …
git switch dev
git merge --no-ff feat/prechargement-offline
```

La fusion en `--no-ff` garde une trace de la fonctionnalité dans l'historique.

## Mise en ligne

Fusionner `dev` dans `main` déclenche le déploiement.

```bash
git switch main
git merge --no-ff dev
git tag -a v0.2.0 -m "…"
git push origin main --tags
```

## Intégration continue

- **`.github/workflows/ci.yml`** — sur **chaque push, quelle que soit la
  branche**, et sur chaque pull request vers `main` ou `dev` : typage, tests,
  build. C'est le filet qui protège les règles de mixage (voir `CLAUDE.md`).
- **`.github/workflows/deploy.yml`** — sur `main` uniquement : build puis
  publication sur Cloudflare Pages. Tant que les secrets `CLOUDFLARE_API_TOKEN`
  et `CLOUDFLARE_ACCOUNT_ID` ne sont pas renseignés dans les réglages GitHub du
  dépôt, l'étape de publication est simplement ignorée — le workflow ne casse
  pas.

## Messages de commit

Préfixes : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.

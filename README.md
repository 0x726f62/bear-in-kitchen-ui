# Bear in the Kitchen

A Czech recipe website built with Astro 7, Tailwind CSS 4, and strict
TypeScript. Astro generates complete HTML pages and optimized responsive images;
Cloudflare Workers Static Assets serves the production build.

## Development

Use Node.js 24.13.0, as pinned in `.node-version`.

```sh
npm ci
npm run dev
```

Before publishing a change, run:

```sh
npm run check
npm test
npm run build
npm run test:build
```

Development includes draft recipes. Production builds publish only recipes with
`draft: false`. To inspect the generated draft pages explicitly:

```sh
INCLUDE_DRAFTS=true npm run build
INCLUDE_DRAFTS=true npm run test:build
```

## Project structure

```text
migrations/           Immutable D1 schema and deployment history
public/               Files served without processing
scripts/              D1 seed generation and optional R2 upload tools
src/
  assets/recipes/     Original recipe photographs
  components/         Reusable Astro components
  config/             Site identity and navigation
  content/recipes/    Validated recipe documents
  data/               Canonical ingredient catalog
  layouts/            Shared document layout
  lib/                Content queries and search logic
  pages/              Public routes
  styles/             Shared styles
tests/                Search and generated-site checks
```

Public routes are `/`, `/recipe/<id>/`, `/tricks-and-tips/`, `/about-me/`, and
`/404.html`. Search ignores Czech accents and combines text, category, and
ingredient filters. A recipe must contain every selected ingredient. Filters
remain in the URL so a result can be bookmarked or shared.

## Recipe content

Each file in `src/content/recipes/` defines one recipe. Its filename is the
stable recipe ID and URL segment. The schema in `src/content.config.ts` validates
all content and prevents an incomplete recipe from being published.

Each recipe ingredient references one entry in `src/data/ingredients.json` by
`ingredientId`. The recipe owns the quantity, unit, display wording, and order;
the catalog owns the canonical ingredient identity and searchable aliases. This
allows reliable reverse searches despite Czech grammatical forms.

To add a recipe:

1. Add its canonical ingredients to `src/data/ingredients.json` when necessary.
2. Create a JSON document in `src/content/recipes/`.
3. Put photographs in `src/assets/recipes/` and reference them relative to the
   recipe document.
4. Review the content, set `draft` to `false`, and run the validation commands.

Published recipe pages include Recipe JSON-LD. Draft pages use `noindex` and do
not emit structured recipe data.

## Cloudflare data

The `bear-in-kitchen` D1 database contains the normalized recipe model. The
`ingredients` table stores canonical ingredients once, and
`recipe_ingredients` stores recipe-specific amounts and wording.

The files in `migrations/` are immutable after they have been applied. For a
reviewable snapshot of current local content, generate `database/seed.sql`:

```sh
npm run db:generate-seed
```

After reviewing the generated SQL, update the remote database with:

```sh
npm run db:seed
```

Local content remains the static build source. D1 provides a normalized copy for
future server-side features while keeping current pages fast and reproducible.

R2 storage is optional. Once it is enabled for the account, upload the original
recipe photographs under the `recipes/` object prefix with:

```sh
npm run images:upload -- <bucket-name>
```

Until then, the optimized photographs are deployed with the static site.

## Deployment

Set `SITE_URL` in `.env` or the build environment. It enables canonical URLs and
the sitemap. Update it before attaching a custom domain.

```sh
npm run deploy
```

The command builds and publishes `dist/` using `wrangler.jsonc`. The current
deployment is <https://bear-in-kitchen.cloudflare-l1tkt.workers.dev/>.

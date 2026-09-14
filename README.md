# Bear in the Kitchen

A Czech recipe website built with Astro 7, Tailwind CSS 4, and strict
TypeScript. Cloudflare Workers renders the D1-backed recipe catalog and account
pages on demand; stable informational pages and assets are generated at build
time.

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

Run the local D1 migrations before opening database-backed pages. Draft recipes
are visible only while signed in as an editor or administrator.

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

## Accounts and roles

Visitors can register with an e-mail address and password. Registration creates
a D1 user with the `USER` role. Passwords are salted and hashed; plaintext
passwords are never stored. Roles are enforced in the Worker endpoints as well
as reflected in the UI:

- `USER` can read the site.
- `EDITOR` can open `/editor/` and add recipes, ingredients, and tags.
- `ADMIN` has editor access and can grant or remove `EDITOR` at `/admin/`.

The application never grants `ADMIN`. To bootstrap an administrator, sign in
once and then update that existing account manually:

```sh
npx wrangler d1 execute bear-in-kitchen --remote \
  --command "UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com'"
```

Apply the D1 migrations before first use:

```sh
npx wrangler d1 migrations apply bear-in-kitchen --remote
```

## Recipe content

The files in `src/content/recipes/` contain the original imported recipes. Their
filenames are stable recipe IDs, and the content schema validates this source
data during the build. Live recipe fields, ingredients, steps, and tags are read
from D1.

Each recipe ingredient references one entry in `src/data/ingredients.json` by
`ingredientId`. The recipe owns the quantity, unit, display wording, and order;
the catalog owns the canonical ingredient identity and searchable aliases. This
allows reliable reverse searches despite Czech grammatical forms.

Editors add recipes and catalog entries at `/editor/`. New recipes use a photo
placeholder for now; the local photographs under `src/assets/recipes/` remain
attached to the imported recipes. Published recipe pages include Recipe JSON-LD.
Draft pages use `noindex`, omit structured recipe data, and require editor access.

## Cloudflare data

The `bear-in-kitchen` D1 database contains the normalized recipe model. The
`ingredients` table stores canonical ingredients once, and
`recipe_ingredients` stores recipe-specific amounts and wording.

The files in `migrations/` are immutable after they have been applied. D1 is the
runtime source for the recipe catalog, recipe pages, users, roles, and editor
changes. The JSON documents and local photographs remain the reviewable source
for the original imported recipes and their optimized images.

To regenerate a reviewable SQL snapshot of the original local content, run:

```sh
npm run db:generate-seed
```

Do not execute that snapshot against a live authoring database: it intentionally
replaces recipe data. New environments receive the original content through the
checked-in migrations.

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

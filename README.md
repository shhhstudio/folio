# Folio

A small, open-source website builder by **Shhh Studio**. Write on the page, compose reusable sections, and keep your content in portable files.

Folio runs locally. Published sites are static HTML and CSS, without the editor or visitor JavaScript. There is no hosted editing service or account system in this version.

## Create a site

Requires Node.js 22.12+.

```sh
npx --package=https://github.com/shhhstudio/folio/releases/download/v0.1.1/shhh-studio-folio-0.1.1.tgz folio init my-site
cd my-site
npm install
npm run dev
```

Open http://127.0.0.1:4321/edit/. Click text to edit it; Markdown formatting stays visible while you write. Use the section inspector for layout, illustrations and link destinations. Save writes to the site's local files, with recoverable history.

```sh
npm run build     # generates dist/
npm run preview   # serves the generated site
```

The package is distributed through versioned, public GitHub release tarballs. It installs like an npm dependency, with a lockfile and integrity hash. No GitHub or npm account is required to install it. Registry publication can be added later without changing the content format.

## Two themes, one content format

**Neutral** is the default: white space, system typography and restrained colors. **Paper90** adds textured paper, tighter grotesque type, monospace text, blue/salmon/yellow inks and overlapping shapes. Indigo and orange are reserved for exceptional accents.

Choose `"theme": "neutral"` or `"theme": "paper90"` in `folio.config.json`. A page can override this in **Page / Header → Design theme**. Appearance (Light / Dark / System) is a separate setting. Switching themes preserves the page's content, photographs and sections.

All sections offer **Line / Color shapes / Photography / None**. Card items have the same choice. Photos inside an article remain part of its Markdown document.

## A site contains content, not a copy of the builder

```text
folio.config.json       # site identity, canonical URL, theme and local port
content/home.json       # homepage
content/pages/*.json    # additional pages
public/                 # images, favicon and other published files
package.json            # versioned Folio dependency
package-lock.json       # reproducible installation
netlify.toml            # static deployment configuration
```

The editor, renderer, themes, schema and Storybook belong to this repository. Each consuming site has its own Git repository. Site content and personal photographs are never needed by Folio itself.

Sections: Hero, Text & visual, Cards, Photo, Links and continuous Markdown Article. Shared choices: tone, layout, spacing, width, illustration, anchor and up to two calls to action. Text has a single editing surface, on the page; contextual panels edit structure and presentation.

## Deploy

The starter includes `netlify.toml`: build with `npm run build`, publish `dist/`. Connect the site's Git repository to your hosting provider. Keep `draft: true` until content is reviewed; this emits `noindex`.

An editor server must stay local. Deploy only `dist/`, which contains no API, account credentials, editor or content-history files.

For **Git LFS** sites, use `git lfs install` and `git lfs pull` after cloning. GitHub Actions must check out with `lfs: true`. On Netlify, set `GIT_LFS_ENABLED=true` in the project UI **before the first clone/build**; this variable is read before `netlify.toml`. Site build commands also run `git lfs pull`. Folio stops the build if an unresolved image pointer is detected, preserving the previous build.

## Receive updates from the central project

Releases publish an installable `.tgz` asset. The reusable workflow [update-site.yml](.github/workflows/update-site.yml) checks the latest stable release, changes only the site's Folio dependency and lockfile, builds the site, and opens an update PR. Content and images remain untouched. Updates are reviewed before merging; nothing force-updates a live website.

Consumers can call the workflow on a weekly schedule or manually:

```yaml
name: Update Folio
on:
  schedule:
    - cron: '0 8 * * 1'
  workflow_dispatch:
permissions:
  contents: write
  pull-requests: write
jobs:
  update:
    uses: shhhstudio/folio/.github/workflows/update-site.yml@v0.1.1
```

When the repository permits it, Actions opens a pull request. If an organization policy prevents that, the checked update branch is still pushed and the run summary provides a link to open its PR manually. No organization policy needs to be weakened. Dependabot can propose updates to the reusable workflow reference itself. See [architecture and compatibility](docs/architecture.md).

## Develop Folio

```sh
npm ci
npm run check
npm test
npm run dev              # neutral blank example
npm run storybook        # sections, themes and real editor controls
npm run build-storybook
npm pack
node scripts/smoke-package.mjs
```

`npm run build` produces the reusable ESM API, TypeScript declarations and a self-contained browser editor. The published package does not require consumers to compile JSX or copy engine source files.

The ESM API exports the page schema, components and presets:

```js
import {pageSchema,Section,sectionDefaults} from '@shhh-studio/folio';
```

## Status

An early local builder, used for Shhh Studio and a personal website. Contributions and real installation feedback are welcome. The scope is intentionally small: dependable composition, content ownership and a clean static export. Authentication, remote storage, simultaneous editing, commerce and cloud hosting are not implemented.

MIT licensed. The consuming sites and their photographs have their own ownership and permissions.

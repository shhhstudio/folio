# Architecture and compatibility

Folio is the central package. A site is a separate content repository with a pinned release URL. No workspace links or sibling folders are required to install or deploy a site.

- `bin/folio.mjs`: init / dev / build / preview CLI.
- `lib/`: configuration, local file store, static renderer and local server.
- `src/design-system/`: schema, reusable React components and Paper90 foundations.
- `themes/neutral.css`: default neutral design overrides.
- `src/editor/`: contextual inline editing, Markdown, lists, uploads and responsive previews.
- `dist/`: generated ESM library, declarations and self-contained browser editor; included in release packages, not committed.
- `template/`: neutral content-only starter.
- `examples/blank/`: isolated development example.
- `src/stories/`: section/theme documentation and real editor controls.

Each site owns its identity, canonical URL, theme choice, page data, images and any local extensions. The package owns shared behavior and theme changes. A page's explicit `designTheme` overrides the config default, independently of light/dark appearance.

Images live in each site's `public/` directory and can use Git LFS. Folio includes only a small grain texture and neutral demonstration SVGs. Uploads are local, converted to WebP, and must be committed/pushed with the site's content before a Git-based deployment sees them.

Saving uses optimistic revisions and an atomic file replacement. Previous values are copied into `.history`; deleted pages move into `.archive`. Neither folder is copied to public output. The dev API accepts writes only from the same local origin and requires an explicit request header. This is a local editing interface, not an authenticated cloud API.

Builds validate content and reject unresolved LFS pointers before replacing an existing output directory. They render HTML/CSS with React on the server and do not include browser hydration, the editor, or its API.

## Release policy

Use semantic versions. Keep existing content compatible in patch/minor updates. Format changes require a major version and explicit migration tooling; never silently discard content fields. New themes and components should have Storybook examples. Renderer changes need meaningful content/output tests and a fresh-package smoke test.

To release: update the package version, template dependency and documentation example; commit; tag `vX.Y.Z`; push the tag. CI verifies the version, tests and installs the packed artifact in a fresh project before publishing the GitHub release. Released tags and package assets must not be replaced. Fix forward with a new version.

Site update workflows install a stable release and verify its build before opening a PR. A PR from the workflow token may not trigger other GitHub Actions automatically, so the updater performs its own clean installation and build. Human merge triggers the normal main-branch workflow. No auto-merge is configured.

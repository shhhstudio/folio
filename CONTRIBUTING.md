# Contributing

Start with the neutral example and the Storybook. Keep site-specific content and photographs out of the engine. Run `npm ci`, `npm run check`, `npm test`, `npm run build-storybook`, `npm pack`, and `node scripts/smoke-package.mjs` before proposing a release.

Prefer extending existing section variants to adding unrelated controls. Text is edited on the page; property panels own structure and presentation. Public output must remain static. Preserve content compatibility, meaningful alternative text, keyboard access and both light/dark appearances.

Issues describing a real publishing or editing problem are useful. Include the package version and a minimal example without personal information.

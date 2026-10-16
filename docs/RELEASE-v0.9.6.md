# v0.9.6 — release checklist

The entire set of PNG animations, SVG buckets, source sheets, loaders, and tests has been committed directly to `release/v0.9.6`. The prior manual Termux ZIP importer is **no longer required** and must not be used.

- Run CI: `npm test`, `npm run qa:balance`, mobile Chromium Playwright.
- Verify original protected art files remain byte-identical. Existing layouts and fishing mechanics must be preserved.
- When CI passes, merge PR #4, tag the successful main SHA with `v0.9.6` and retain GitHub Actions ZIP artifact.
- For end users: `git clone https://github.com/Elusivedamir/hrabrolap.git` or `git pull --ff-only` on a clean clone.

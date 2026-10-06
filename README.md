# Realms of Fate Community

Static GitHub Pages site and wiki for the current **Delver Mod Classes prototype**.
The main documentation now describes the mod, not the separate engine fork.

## Current guide

- `wiki/index.html`: implemented features, limits and roadmap.
- `wiki/installation.html`: compatible JAR patch, mod installation, backup and restore.
- `wiki/spells.html`: individual JSON definitions, wand references, original PNG icons and migration.
- `wiki/systems.html`: classes, mana, movement, currencies, drops and shops.
- `wiki/editor.html`: editor themes and startup checks.
- `wiki/achievements.html`: explicitly archived engine-only documentation; not ported.
- `examples/mod/`: downloadable current JSON examples.
- `examples/achievements/`: retained legacy examples.

Checked against the prototype source on October 6, 2026. Mac/Linux, Workshop
publication, skill trees and permanent progression are not claimed
as implemented. The manual patch is version-specific; consult its guide/hash.

## Preview and validation

No package installation or build step is needed. Serve the repository root:

```sh
python -m http.server 8000
python tools/validate-wiki.py
```

Open http://localhost:8000. Local serving enables clipboard support; downloads
and text selection remain available when copying is blocked. The validator
checks links, anchors, JSON and agreement between copy blocks and downloads.
For new mod examples, provide `data-download` on the JSON code block and update
the expected example count. Keep examples aligned with the actual Java schema.

## Publishing

Publish the repository root via GitHub Pages. `.nojekyll` is included. All links
are relative for repository-path hosting. Do not publish developer backups,
game JARs, saves or credentials. `api/community_state.json` remains independent.

The homepage currently links to installation instructions rather than advertising
old engine builds as current mod downloads. The old `assets/downloads.js`,
`assets/releases.json` and `tools/check-downloads.cjs` remain for future release
integration but are not loaded by the homepage. No mod/patch binary is hosted by
this website change. Add explicit verified release assets when ready; do not
silently offer standalone engine releases as mod packages.

## Artwork

Use only project-owner-approved original artwork. Existing homepage artwork and
gameplay areas remain labeled CSS placeholders. Do not reuse the previously
removed Delver menu background or Hearthwater screenshot. The homepage uses
`assets/home.css`; the wiki uses `assets/wiki.css` and `assets/wiki.js`.

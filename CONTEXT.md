# Project context

A quick briefing on this repository for AI agents and new contributors. Read it before you change anything. For user-facing setup, see [README.md](README.md).

## What this project is

The **Conversational AI Design Framework** is a seven-phase method (Discover, Define, Model, Design, Validate, Deliver, Learn) for Product owner, Design, Development and Data Science teams that build conversational and generative AI products. Each phase ends with an exit-gate checklist. The team fills one **AI Use Case Canvas** as it goes. A running example, the *KPI investigation assistant*, goes through every phase.

The repository has two parts:

1. **The framework itself**, written as Markdown. This is the single source of truth for all content.
2. **The portal**, a static web reader for the framework. It's built from the Markdown and styled with the xDS design system.

Author: Amal Tapalov. Last updated: 25 November 2026.

## Repository map

| Path | Role |
| --- | --- |
| `Conversational AI Design Framework v1.2.md` | Current framework. Edit content here. |
| `Conversational AI Design Framework v1.1.md` | Previous version, kept for reference. Don't edit. |
| `DESIGN.md` | xDS design system reference (tokens, type, spacing, components, do/don't) |
| `portal/build.py` | Inlines the newest framework Markdown into `template.html` and writes `index.html` |
| `portal/template.html` | Page shell. Contains the `/*__FRAMEWORK_MD__*/` placeholder. |
| `portal/app.js` | Markdown renderer, chapters, hash routing, role panels, gate checklists, Mermaid, search. Exposes `window.CADF`. |
| `portal/workspace.js` | Fillable templates (canvas, evaluation sheet, critique questions), projects, export and import. Reads from `window.CADF`. |
| `portal/tldr.js` | The TL;DR deck (`#/tldr/<slide>`): the framework as five one-screen slides, navigated with tabs, buttons, ←/→ or PageUp/PageDown. Registered with `CADF.registerView()`. |
| `portal/styles.css` | All styling. xDS tokens for light and dark mode are at the top. |
| `portal/index.html` | **Generated, but committed.** Never edit by hand. |
| `skills/copywriting/` | Copywriting agent skill. `.claude/skills/copywriting/` is an identical copy for Claude Code. Keep both in sync. |
| `.claude/launch.json` | Launch configs: the portal on port 8123, plus two style and layout reference sites |

## How the pieces fit together

```text
Framework vX.Y.md ──build.py──▶ template.html + JSON-encoded Markdown ──▶ index.html
                                                                           │
                                     app.js (window.FRAMEWORK_MD) ─────────┤
                                     workspace.js (window.CADF) ───────────┘
```

- `build.py` picks the highest-numbered `Conversational AI Design Framework v*.md` by version number. It uses the Python standard library only.
- `app.js` parses the Markdown at runtime in the browser. Nothing is pre-rendered.
- **Chapters come from `## ` headings.** Leading numbers such as `6.` are ignored.
  - `Phase N · Name` headings become phase chapters automatically.
  - Other headings are matched against the `DEF` list near the top of `app.js` (Start here, Lifecycle, Roles, Rules, Templates, Adoption, About).
  - Headings that don't match go into "About this version", so content never disappears.
- `workspace.js` reads canvas fields, prompts, owners and examples from the canvas table in the Markdown. Input types for known fields are set in `specFor()`. Any other field gets a text box.
- The four roles are hard-coded in `ROLES` in `app.js`: `Product owner`, `Design`, `Development`, `Data Science`. Role tables use the `●` `◐` `○` symbols.

## Common tasks

| Task | What to do |
| --- | --- |
| Change framework content | Edit the newest `v*.md`, then run `python3 portal/build.py` and commit both the Markdown and `portal/index.html`. |
| Start a new framework version | Copy to `... v1.3.md`, update the title and date line, and add a "What changed in v1.3" section. The build picks it up automatically. |
| Add a new `## ` section | Make sure it matches a `DEF` entry in `app.js`, or add one. Otherwise it lands in "About this version". |
| Add or rename a canvas field | Update the canvas table in the Markdown. If it needs a structured input, add it to `specFor()` in `workspace.js`. |
| Change portal behaviour or style | Edit `app.js`, `workspace.js`, `styles.css` or `template.html`, then rebuild. |
| Preview | `python3 portal/build.py && python3 -m http.server 8123 --directory portal`, then open <http://localhost:8123/>. |

## Conventions and constraints

- **No dependencies and no tooling.** Plain HTML, CSS and vanilla JS (IIFE, `'use strict'`). No npm, bundler, framework or tests. Don't add any unless you're asked to.
- **The Markdown is the only content source.** Don't hard-code framework text in the portal. Derive it from the Markdown so content edits need only a rebuild. The one exception is `tldr.js`: it reads lists and tables from the Markdown, but its framing copy and diagram labels are hand-written, so review it when the framework changes.
- **Supported Markdown subset:** headings, paragraphs, lists, tables (with `:---:` centering), task lists (`- [ ]` become tickable gate checklists), blockquotes, `mermaid` code blocks, inline bold, italic, code and links. Check that anything else renders in the portal before you use it.
- **Browser storage keys** are versioned and prefixed `cadf.`: `cadf.checks.v1`, `cadf.theme.v1`, `cadf.projects.v1`, `cadf.canvasRole.v1` (the canvas owner filter in `workspace.js`). If you change a stored data shape, bump the version instead of breaking existing saved data.
- **Escape all user and Markdown text** with `esc()` / `inline()` before inserting it as HTML. Imports are capped (`MAX_IMPORT` 1 MB, `MAX_STR` 20,000 chars).
- **Styling follows xDS** ([DESIGN.md](DESIGN.md)). Use the CSS custom properties at the top of `styles.css`, not raw colour values. Support light and dark mode. Keep the portal keyboard accessible and print friendly.
- **Mermaid** loads from `portal/vendor/mermaid.esm.min.mjs` if present, then falls back to the jsDelivr CDN (Mermaid 11). Fonts load from `portal/fonts/`, with Arial as the fallback. Both folders are optional and not committed.
- **Writing style for the framework and docs:** plain English, short sentences, active voice, "the team" or "you". The latest rewrite deliberately shortened and simplified the text, so keep it that way. Use the `copywriting` skill for larger rewrites.

## Gotchas

- Forgetting to rebuild after editing the Markdown leaves `portal/index.html` stale.
- Renaming a `## ` heading can move it to a different chapter or into "About this version". Check the `DEF` matchers.
- Renaming headings changes section slugs, which breaks deep links.
- Saved checklist ticks are keyed by chapter plus a hash of the item text. Rewording an exit-gate item resets its saved tick for every reader.
- `DESIGN.md` describes xDS for a React + Tailwind stack. The portal applies the same tokens and rules in plain CSS. It doesn't use React or Tailwind.

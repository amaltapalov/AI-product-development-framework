# Framework portal

An interactive reading portal for the Conversational AI Design Framework, styled with the xDS design system (see `../DESIGN.md`).
Plain HTML, CSS and JavaScript: no framework, no npm, no build server.

## Files

| File | Purpose |
| --- | --- |
| `build.py` | Inlines the framework markdown into `template.html` and writes `index.html` |
| `template.html` | Page shell (header, sidebar, footer) |
| `styles.css` | All styling. xDS tokens (light and dark) are in the block at the top. |
| `app.js` | Markdown rendering, chapters, routing, role panels, gate checklists, diagrams, search |
| `workspace.js` | Fillable templates: AI Use Case Canvas, evaluation sheet, critique questions, projects, export and import |
| `index.html` | Generated output. Don't edit by hand. |
| `fonts/` | *Optional.* Put the xDS `VoltaModernDisplay-55Roman/65Medium/75Bold.woff2` files here. Without them, text uses Arial. |
| `vendor/` | *Optional.* Put `mermaid.esm.min.mjs` (Mermaid 11) here to draw diagrams without internet access. |

## Update the content

Edit the framework markdown in the parent folder, then rebuild:

```bash
python3 portal/build.py
```

The build picks the newest `Conversational AI Design Framework v*.md` automatically. To use a specific file: `python3 portal/build.py "path/to/file.md"`.

Chapters are assigned from the `## ` headings (numbers like `6.` are ignored):

- `Phase N · Name` headings become the phase chapters automatically.
- Other headings are grouped by the `DEF` list at the top of `app.js` (Start here, Lifecycle, Roles, Rules, Templates, Adoption, About).
- Any heading that doesn't match lands in "About this version", so new sections never disappear.

Markdown features used by the framework: tables (with `:---:` centering), task lists (`- [ ]`, rendered as tickable checklists), blockquotes, `mermaid` code blocks, and `●` `◐` `○` role symbols.

## View it

Open `portal/index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8123 --directory portal
```

## Publish

Upload `index.html`, `styles.css`, `app.js`, `workspace.js` (plus `fonts/` and `vendor/` if you have them) to any static host: Azure Static Web Apps, an Azure Storage static website, SharePoint or a Teams website tab.

Diagrams load Mermaid from `vendor/` first, then from the jsDelivr CDN. If neither is reachable, the diagram source is shown instead.

## Features

- Chapter cards, a numbered chapter sidebar and a contents list that follows your scrolling
- Role cards on the home page and a role panel on each phase showing who leads, contributes and reviews
- Exit-gate checklists you can tick; progress is saved in the browser
- Fillable templates, saved per named project in the browser (`cadf.projects.v1` in localStorage):
  - **AI Use Case Canvas** on the Templates page. Structured inputs where they help (interaction model, capabilities, boundaries, extra checks, metrics, release readiness); each row can be marked agreed and shows a worked example.
  - **Evaluation sheet** with pass/fail per criterion, critical failures, pass rate against the 90% or 95% threshold, a ship verdict and a capability × case type coverage grid.
  - **Critique questions** with Yes / No / Unsure and notes.
  - Export as Markdown (copy or download), JSON (backup, re-importable) or CSV (evaluation sheet).
  - Field names, prompts, owners and examples come from the canvas table in the markdown. Input types for known fields are set in `specFor()` in `workspace.js`; any other field gets a text box.
- Mermaid diagrams themed to xDS; phase boxes in diagrams link to their chapters
- Light and dark mode (follows the system setting, with a toggle)
- Full-text search (press `/`)
- Responsive, keyboard accessible, print friendly

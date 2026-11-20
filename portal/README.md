# Framework portal

An interactive reading portal for the Conversational AI Design Framework, styled with the xDS design system (see `../DESIGN.md`).
Plain HTML, CSS and JavaScript: no framework, no npm, no build server.

## Files

| File | Purpose |
| --- | --- |
| `build.py` | Inlines the framework markdown into `template.html` and writes `index.html` |
| `template.html` | Page shell (header, sidebar, footer) |
| `styles.css` | All styling. xDS tokens (light and dark) are in the block at the top. |
| `app.js` | Markdown rendering, chapters, routing, role picker, gate checklists, diagrams, search |
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

Upload `index.html`, `styles.css`, `app.js` (plus `fonts/` and `vendor/` if you have them) to any static host: Azure Static Web Apps, an Azure Storage static website, SharePoint or a Teams website tab.

Diagrams load Mermaid from `vendor/` first, then from the jsDelivr CDN. If neither is reachable, the diagram source is shown instead.

## Features

- Chapter cards, a numbered chapter sidebar and a contents list that follows your scrolling
- **My role** picker (header, home page role cards, or the panel on each phase): shows what your role does and hands over in each phase, and highlights your row or column in every role table
- Exit-gate checklists you can tick; progress is saved in the browser and shown on the cards
- Mermaid diagrams themed to xDS; phase boxes in diagrams link to their chapters
- Light and dark mode (follows the system setting, with a toggle)
- Full-text search (press `/`)
- Responsive, keyboard accessible, print friendly

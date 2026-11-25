# AI Product Development Framework

The **Conversational AI Design Framework** gives Product, Design, Development and Data Science a seven-step way to build conversational and generative AI products. The goal is products that solve a real problem, give correct answers and fail safely.

The repository has the framework itself (as Markdown) and an interactive web portal for reading it.

## What's in the repository

| Path | Contents |
| --- | --- |
| `Conversational AI Design Framework v1.2.md` | The framework (Markdown source) |
| `Conversational AI Design Framework v1.1.md` | Previous version |
| `DESIGN.md` | Reference for the xDS design system the portal is styled with |
| [`portal/`](portal/) | Interactive reading portal in plain HTML, CSS and JavaScript. See [portal/README.md](portal/README.md). |
| `skills/` | Agent skills (copywriting) |

## The framework at a glance

The framework has seven phases. Each phase ends with an exit-gate checklist: the team passes it, goes back or stops.

1. **Discover**: is the problem real?
2. **Define**: what will the AI do?
3. **Model**: how does the conversation flow?
4. **Design**: how does it look and behave?
5. **Validate**: does it work and is it right?
6. **Deliver**: can the team build it?
7. **Learn**: what did real use teach us?

The team fills one **AI Use Case Canvas** as it moves through the phases. Each phase spells out which roles lead, which contribute and what each role hands over. A running example (a *KPI investigation assistant*) goes through every phase.

## Run the portal

**Requirement:** Python 3. There's no npm and no build server.

### 1. Build the page

Run this from the repository root:

```bash
python3 portal/build.py
```

The script inlines the newest `Conversational AI Design Framework v*.md` into `portal/template.html` and writes `portal/index.html`. To build from a different file:

```bash
python3 portal/build.py "path/to/file.md"
```

Rebuild whenever you edit the framework Markdown.

### 2. Start the server

```bash
python3 -m http.server 8000 --directory portal
```

Then open <http://localhost:8000/> in a browser. If port 8000 is already in use, pick another one (for example `8123`). Press `Ctrl+C` to stop the server.

You can also open `portal/index.html` directly in a browser without a server.

### Optional assets

- `portal/fonts/`: the xDS `VoltaModernDisplay` `.woff2` files. Without them, the portal uses Arial.
- `portal/vendor/mermaid.esm.min.mjs`: Mermaid 11, for drawing diagrams offline. Without it, Mermaid loads from the jsDelivr CDN.

## Publish

Upload `portal/index.html`, `styles.css` and `app.js` to any static host, along with `fonts/` and `vendor/` if you have them. Azure Static Web Apps, an Azure Storage static website, SharePoint and a Teams website tab all work.

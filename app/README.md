# Vivinne portfolio — React source

- `npm install && npm run build` → writes the site to the repository root (`index.html` + `assets/`); `img/` is not touched. GitHub Pages serves the root of `main`.
- `npm run build:dev` → same, unminified with React warnings (for checking only; run `npm run build` before committing).
- `src/App.jsx` tabs, hash routing (#about, #works, #w01–#w07), language, theme · `src/Img.jsx` on-approach image loading through jsDelivr (local fallback) · `src/Lightbox.jsx` viewer.
- `src/About.jsx`, `src/WorksIndex.jsx`, `src/works/W01–W07.jsx` hold the page content (each work is its own chunk, loaded when opened). They were generated once from the earlier static page by `tools/dumpdom.py` + `tools/tojsx.py`; edit them directly now.
- Styles: `src/styles/site.css` (unchanged from the static page).

# Vivinne portfolio — Next.js + React + TypeScript

- Published by GitHub Actions (`.github/workflows/pages.yml`) to https://vivinne.github.io/portfolio/ on every push to `main`.
  One-time setting: Settings → Pages → Source: **GitHub Actions**.
- Local: `npm install`, then `npm run dev` (preview at http://localhost:3000/portfolio/) or `npm run build` (static files in `out/`). `npm run typecheck` for TypeScript.
- `src/app/` layout, page and CSS · `src/components/App.tsx` tabs, hash routing (#about, #works, #w01–#w07), language, theme ·
  `Img.tsx` on-approach image loading through jsDelivr (local fallback) · `Lightbox.tsx` viewer.
- `src/components/About.tsx`, `WorksIndex.tsx`, `works/W01–W07.tsx` hold the page content; each work is its own chunk, loaded when opened.
  They were generated once from the earlier static page (`tools/`); edit them directly now.
- Images: `public/img/`. Styles: `src/app/site.css` (unchanged from the static page).

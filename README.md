# Construction Measurement Calculator

A fast, **offline-first** measurement calculator for construction professionals.
Create projects, enter measurements like `8 x 2`, get instant totals, and export
polished PDF reports — all from your phone, even with no signal on site.

> Built as a personal tool. No login, no server, no internet required. Your data
> lives only on your device (and you can export a JSON backup any time).

## ✨ Features

- **Projects** — name, client, location, date, notes. Create / edit / delete / duplicate.
- **Sections / floors** — Ground Floor, Floor 1, Basement, Bathroom… add unlimited, or use one-tap presets.
- **Lightning measurement entry** — type `8x2`, `5,5 x 3`, even `8x2 + 3x4 - 1x2`. It calculates instantly.
- **Live totals** — section subtotals and a project grand total update in real time.
- **Descriptions** — optionally label each line (e.g. "Living room wall").
- **Professional PDF export** — branded header, per-section tables, subtotals and grand total.
- **History** — search, sort (recent / date / name / largest), duplicate.
- **Dashboard** — totals at a glance + recently updated projects.
- **Dark / Light / Auto** themes, premium glassmorphism UI, smooth animations.
- **PWA** — installable to the home screen, works fully offline.
- **Backup** — export / restore all data as a JSON file.

## 🧮 Measurement syntax

| You type        | Result | Notes                          |
| --------------- | ------ | ------------------------------ |
| `8 x 2`         | 16     | width × height                 |
| `8x2`           | 16     | spaces optional                |
| `5,5 x 3`       | 16.5   | decimal comma (Balkan style)   |
| `8x2 + 3x4`     | 28     | sum several areas on one line  |
| `8x2 - 1x2`     | 14     | subtract an opening (window)   |
| `2 x 8 x 2`     | 32     | quantity × width × height      |
| `(8+2) x 3`     | 30     | grouping with parentheses      |

## 🛠 Tech stack

- **React + TypeScript + Vite**
- **TailwindCSS** (custom token-based design system, dark/light)
- **Zustand** (state, persisted to `localStorage`)
- **framer-motion** (animations)
- **jsPDF + jspdf-autotable** (client-side PDF)
- **vite-plugin-pwa** (offline / installable)

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

Then host the `dist/` folder anywhere static (Vercel, Netlify, GitHub Pages,
or your own server). Open it on your phone and **Add to Home Screen**.

## 🗺 Architecture & future-ready notes

```
src/
  components/   reusable UI (Button, Card, Sheet, SectionCard, MeasurementInput…)
  pages/        Dashboard, Projects, ProjectDetail, Settings
  store/        Zustand stores (projects, settings, transient UI)
  lib/          calc engine, formatting, PDF, backup
  types.ts      domain model
```

The data model already reserves fields for planned features so the schema stays
stable as the app grows:

- `pricePerUnit` / `currency` on a project → **price per m², cost estimation**
- clean serializable `Project[]` → **cloud backup / sync** (drop in Supabase later
  without touching the UI: replace the persist layer in `store/useStore.ts`)
- per-section structure → **material & labor calculations**
- backup export/import → foundation for a future **client portal**

## 🔒 Privacy

100% local. Nothing is uploaded anywhere. Keep a backup (Settings → Export backup).

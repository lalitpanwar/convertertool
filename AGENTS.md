# AGENTS.md (read this first)

Project: free PDF tools website, traffic from Google SEO, targeting **user problem queries** (e.g. "compress pdf to 100kb", "photo ko pdf kaise banaye"), NOT brand keywords. First market India. Priorities: **speed > UX > SEO**.

Language: the owner writes Hinglish. Docs are Hinglish; code, identifiers and UI copy are English.

## Where things are

| Path | What |
|------|------|
| `docs/` | All planning. Start with `docs/10-final-decisions.md` (locked decisions), then `docs/11-dev-guide.md` (how to build) |
| `web/` | The Astro website (the only code so far) |
| `iLovePDF Tools Report.pdf` | Original market report (source of volume numbers) |

## Docs map

- `docs/02-PRD.md` requirements · `docs/09-tool-priority.md` which tools and why · `docs/10-final-decisions.md` **final stack, budgets, UX/SEO rules** · `docs/11-dev-guide.md` **conventions + "add a new tool" recipe** · `docs/12-status.md` **what is done / next** (update it when you finish work).
- Older docs (01, 03-08) are background. If they conflict with 10 or 11, **10 and 11 win**.

## Hard rules

1. Tools run **in the browser**; user files must not be uploaded (except Wave 2 server tools, see docs/04).
2. Do not add a heavy dependency to the initial page JS. Heavy engines load via dynamic `import()` on user intent. Budget: docs/10 section 4.
3. Colors only via tokens in `web/src/styles/global.css`. Light theme only (no dark mode). Brand red `#d00000` (`brand`) = logo, primary buttons, links, selected states. White cards on light grey page (clean utility-site look). Do not hardcode hex in components.
4. Tool content (title, H1, steps, FAQ, guide) lives in `web/src/lib/tools/defs/`, never inside components.
5. Every new page needs unique title (<=60), description (<=155), one H1, FAQ, related links (docs/10 section 6). No thin/duplicate programmatic pages.
6. Do not claim volumes/rankings that are not in the report or verified. Mark guesses as "validate".
7. Brand name/domain are placeholders (`web/src/config/site.ts`, `astro.config.mjs`).

## Commands (run from the project root; root package.json forwards to `web/`)

```
npm run setup      # once: installs web/ dependencies
npm run dev        # dev server
npm run check      # type check, must be 0 errors
npm run build      # static build to web/dist/, must pass
```

(Inside `web/` the same work as `npm install`, `npm run dev`, `npx astro check`, `npm run build`.)

Before saying a task is done: `astro check` + `npm run build` pass, and for a tool, test it in a real browser (see docs/11 "Testing").

# 11. Dev Guide (conventions + recipes)

Audience: any developer or AI agent continuing this project. Read [10-final-decisions.md](10-final-decisions.md) first.

## 1. Stack

Astro 7 (static output) · Preact islands (`@astrojs/preact`) · TypeScript strict · Tailwind CSS v4 (`@tailwindcss/vite`) · pdf-lib · `@astrojs/sitemap`. Node >= 22.

## 2. Folder structure (`web/src`)

```
config/site.ts            brand name, url, tagline (PLACEHOLDERS)
styles/global.css         design tokens (colors) + Tailwind theme mapping
layouts/
  BaseLayout.astro        <html>, SEO head, Header/Footer, slot "head"
  ToolLayout.astro        tool page: H1, intro, tool island, steps, guide, FAQ, related, JSON-LD
components/
  layout/                 Header, Footer (static .astro, zero JS)
  seo/                    Seo.astro (meta/canonical/OG), JsonLd.astro
  content/                Steps, Faq, Guide, ToolCard, RelatedTools (static .astro)
  tool/                   Preact islands: Dropzone, FileList, OptionGroup, ProgressBar,
                          ResultCard, ErrorNotice  (REUSABLE building blocks)
                          <Name>Tool.tsx (one per tool, composes the blocks)
                          ToolIsland.astro (maps tool.island key -> component)
lib/
  tools/types.ts          ToolDef type
  tools/registry.ts       TOOLS list, getTool, liveTools, relatedTools
  tools/defs/*.ts         one file per tool: all SEO content + metadata
  pdf/*.ts                pure engine functions (no UI), lazy-imported by islands
  utils.ts, download.ts   small helpers
pages/
  index.astro             home (tool grid from registry)
  [slug].astro            generates a page per LIVE tool in registry
  robots.txt.ts           robots + sitemap pointer
```

Path alias: `@/` = `src/`.

## 3. Conventions

- **Layout widths:** header and tool workspace are FLUID (full width, `px-4 sm:px-6`); informational content below the tool is `mx-auto max-w-6xl`; list-style tools (Merge) keep their island at `max-w-2xl`.
- **Static first:** `.astro` for anything without interaction. Preact only for the tool UI. Hydrate with `client:visible`.
- **Engine separate from UI:** PDF logic in `lib/pdf/<tool>.ts` (input: `File[]`/bytes + options, output: bytes). UI in `components/tool/<Name>Tool.tsx`. Never import pdf-lib in a component statically; use `const loadEngine = () => import('@/lib/pdf/...')` and call it on `onIntent` (hover/focus/drop) to prefetch.
- **Reuse tool blocks.** A new tool should be mostly composition of Dropzone + FileList + OptionGroup + ProgressBar + ResultCard + ErrorNotice. If a block needs a change, change it once for all tools.
- **Touch targets >= 44px**, labels/aria on controls, keyboard works, errors via `ErrorNotice` in plain language.
- **No inline colors, light theme only (no dark mode).** Brand red `#d00000`. Use Tailwind classes backed by tokens: `bg-brand text-on-brand hover:bg-brand-hover` (primary buttons), `text-brand`/`text-link` (links, selected), `bg-brand-soft` (tints), `bg-surface` (white cards), `bg-surface-2`, `text-muted`, `border-border`.
- **Result screen:** every tool ends with `ResultCard` (green check, scroll-into-view, Download focused). Do not build a custom result UI. Green is only for success (`success` tokens).
- **Attention ripple:** add class `ripple-pulse` to a primary button to get the endless ripple (used only on Download). Do not use it on more than one button per screen.
- **Reordering must work on phones:** never rely on drag alone. Lists of files need (a) a big touch drag handle, (b) a tap-to-move option (`MoveDialog`), and optionally sort. Photo grid is 2 columns on phones.
- **Two views:** `PageGrid` has `view='grid'|'list'`; any new image/page tool should reuse it and `ViewToggle` (phones default to list). New row/card controls must be 44px on touch and must not make the list wider than its box (use `grid-cols-[minmax(0,1fr)]`).
- **Scroll areas:** never add `overscroll-contain` to an inner scroll box (it traps the user inside). Default chaining lets the page scroll once the box ends.
- **Feedback after actions:** use the toast (`Toast.tsx`) for add/move results and the `flash` highlight in `PageGrid` for the affected cards. Loading items show a spinner (preview missing = loading).
- **Colors for controls:** brand red = primary action, links, option tiles, highlights. Secondary controls (toggle selected state, order badge, hovers) use gray (`neutral`, `surface-2`). Use button size `sm` for toolbars.
- **Never lose the user's work:** tools that take files must save a draft (`lib/storage/draft.ts`: `saveDraft/loadDraft/clearDraft`, key = tool slug) and restore it on load with a visible note + "Start fresh". Do not save before the restore attempt finished (see `draftReady` in JpgToPdfTool). Clear the draft on reset. Drafts expire after 24h and never leave the browser.
- **Busy states:** use `BusyDialog` (centered, modal, with progress) plus `holdUntil(t0, 800)` so tiny jobs do not flash.
- **Global listeners (window/document):** the function passed to `removeEventListener` must be the SAME function that was added. Never define it inside a component body (new identity every render => listener stays forever, e.g. the page froze after a drag). Use module-level functions or refs, and add a failsafe cleanup. Test: do the action, then check the page still scrolls.
- **Draft lifecycle:** saved while the user works (expires 15 min after the last change) -> restored on refresh with a self-hiding note (`useAutoDismiss`) -> marked as downloaded when the result is downloaded (`useDraftWipe(draftKey)` + `ResultCard onDownload/afterDownload`) -> never restored again and deleted after 60 s -> any later edit cancels the wipe. The save that a restore itself causes must be skipped (`skipNextSave`) or the 15-minute clock restarts. IDs: every added file gets a fresh random id; one draft per tool key, newest save wins. New draft tools must follow all of this (see docs/12).
- **Heavy engines stay out of the page's JS:** put types/defaults the UI needs in a tiny dependency-free module (`lib/pdf/text-config.ts`, `page-config.ts`) and import the engine only with `import()` on demand. Fonts are `?url` assets fetched only when a document needs them (`lib/pdf/fonts.ts`: Hindi/extra-Latin only if the text has such characters).
- **Hindi/Devanagari in PDFs:** needs `import 'regenerator-runtime/runtime.js'` before fontkit (already in `fonts.ts`), and a font chain per style (first font that has the character wins). Always check new text features by rendering the PDF to an image and looking at it.
- **Errors must say WHICH file and WHY, and go away with the data:** decode through `lib/image/decode.ts` (typed `ImageError`), mark the bad item in the UI, block the action until it is removed, and clear the error whenever the user removes data. Never show a generic "something failed" for a file the user can fix. Red = problem only (new/moved highlight is green).
- **Dev server gotchas:** (1) after `npm install` of new packages ALWAYS restart `npm run dev` (a running Vite dev server then serves `504 Outdated Optimize Dep` and every lazy engine import fails: "convert does nothing"); if it still misbehaves delete `web/node_modules/.vite`, restart, hard-refresh the browser. (2) Heavy lazily imported dependencies must be listed in `vite.optimizeDeps.include` in `astro.config.mjs`. (3) Test in dev mode too, not only on `astro preview`. (4) Another project on this machine may own `localhost:4321` (IPv6): open `http://127.0.0.1:<port>` or the Network URL.
- **Settings UI rules:** extra settings = `SettingsStrip` + `ChipGroup`/`ToggleChip` (icon + short labels, one row, scrolls sideways); the PDF page settings = `<PdfPageOptions>` ONLY (never hand-build size/orientation/margin controls; the four margin names are the same in every tool). Prefer one-tap pills/tiles over dropdowns. Anything absolutely positioned inside a scroll strip needs a `relative` ancestor INSIDE the strip, or it stretches the page sideways.
- **Which control for which setting:** many choices (font, size, spacing, DPI, quality) = `SelectChip` dropdown; on/off (Markdown) = `ToggleChip`; PDF page settings = `PdfPageOptions` tiles. Never a long row of pills for 5+ choices.
- **Where things go (final):** extra settings = horizontal strip directly above the work area on EVERY screen size; PDF page options = `PdfPageOptions` (below the work area on phones, wide card on top on tablets, right panel on desktop); Convert = `action`. Do not stack settings vertically in the desktop panel.
- **Tool page layout = `ToolWorkspace` only.** Never hand-write the work-area + side-panel grid. Put extra settings (not about the PDF page) in `settings`, anything about the output PDF page in `options`, the Convert button in `action`. On phones settings come first, PDF options last (never put extra settings under the work area). Tablet: side by side on top. Desktop: right panel.
- **Cursor:** clickable things get the hand automatically (global rule in global.css, because Tailwind v4 uses the arrow on buttons). Do not add `cursor-pointer` per element; only override for special cases like `cursor-grab`.
- **Buttons:** never hand-write button classes. Use `components/ui/Button.tsx` (islands) or `Button.astro` (static), or `buttonClass()` from `lib/ui/button.ts` for label/span lookalikes. Radius tokens: `rounded-ctl` (4px) for controls, `rounded-card` (6px) for cards; do not use `rounded-xl/lg/full`.
- **No shadcn/Radix.** Own small components only (speed budget). Image tools use `PageGrid` (scrolls inside `max-h-[70vh]`, auto-scroll while dragging, rotate button via `onRotate`/`canRotate`), `DuplicateDialog` (duplicate = same name+size+lastModified, see `keyOf` in JpgToPdfTool), `lib/image/thumb.ts` (`makeThumb(file, rotation)` small preview + natural size) and `PageGrid` (sortable thumbnail grid, live page preview via a `look(item)` callback, drag with mouse anywhere / touch via grip, keyboard via grip + arrows) and `AddFilesButton`; page geometry for BOTH preview and engine comes from `lib/pdf/page-config.ts` (keep it dependency-free so pdf-lib stays lazy). `sortByName`/`moveItem` live in `lib/utils`. File lists (PDF rows, e.g. Merge): `FileList` supports drag (grip handle) + arrows; pass `onMove`, `onReorder` (use `moveItem` from `lib/utils`), `onRemove`. Option controls: `TileGroup` (icon tiles), `SelectField` (dropdown), `OptionGroup` (pills). Icons: tool icons in `lib/tools/icons.ts`, option icons in `components/tool/tile-icons.tsx`.
- **Copy:** UI text English, simple words. Hindi pages come in the SEO phase (add `hi` to `SITE.locales` and astro `i18n`, then per-tool Hindi defs).
- Keep components small, one responsibility, typed props.

## 4. Recipe: add a new tool

1. **Engine:** `src/lib/pdf/<tool>.ts` exporting an async function (pure, takes files + options, returns `Uint8Array`/Blob data, optional `onProgress`).
2. **UI:** `src/components/tool/<Name>Tool.tsx` composing the shared blocks (copy `JpgToPdfTool.tsx` as the template). Load the engine lazily.
3. **Island key:** add `'<Name>'` to `IslandKey` in `lib/tools/types.ts`; add import + `{island === '<Name>' && <NameTool client:visible />}` in `components/tool/ToolIsland.astro` (static import is required by Astro).
4. **Content:** create `lib/tools/defs/<slug>.ts` (copy `jpg-to-pdf.ts`): title (<=60), description (<=155), h1 (the user's problem), intro, 3 steps, 6-10 FAQs, related slugs, 2+ guide sections with unique text. `status: 'live'`, `island: '<Name>'`.
5. **Register:** add to `TOOLS` in `lib/tools/registry.ts` and remove its stub from `defs/planned.ts`.
6. **Verify:** `npx astro check`, `npm run build`, then browser test (section 6). Update `docs/12-status.md`.

Tip: `ToolDef.fileNoun` ('photos' default) changes the wording in the tool UI (e.g. 'images') without copying the component.

## 5. Recipe: add a problem/use-case page (e.g. compress-pdf/100kb)

Not built yet. Plan: route `pages/[slug]/[useCase].astro` driven by a `useCases` array on the ToolDef (preset options + unique intro + FAQ). Each page needs unique helpful content; the tool island receives a preset (e.g. target size). See docs/05 and docs/09 for the draft query list. Validate query volumes first.

## 6. Testing

- `npx astro check` (0 errors) and `npm run build` must pass.
- Real-browser test for every tool: serve `dist` with `npx astro preview`, drive it with Chrome (puppeteer-core + installed Chrome). Check: result file downloads and opens, no console errors, no horizontal scroll at 390px width.
- Test edge cases per tool: large image, sideways phone photo, wrong file type, corrupt file, 20+ files.
- Performance: initial JS stays small; heavy chunks only load on intent. Run Lighthouse mobile before launch (target docs/10 section 4).

## 7. Known limitations / TODO (tracked in docs/12-status.md)

- Processing runs on the main thread (JPG to PDF is light). Move heavy engines (compress, PDF to JPG) to a Web Worker.
- Only English. Hindi + `hreflang` pending.
- No favicon/logo/OG image yet; brand name + domain are placeholders.
- No analytics, ads, cookie banner, privacy/terms pages yet.
- No Lighthouse CI yet.
- Cloudflare Pages deploy not configured (build command `npm run build`, output `dist`, root `web`).


## Rich text editor and settings placement (Text to PDF)

- Extra settings live INSIDE the work area (a `SettingsStrip embedded` above the editor / page grid). `ToolWorkspace` has no settings slot; only `options` (PdfPageOptions, one setting per row on every screen) and `action`.
- Text to PDF passes the editor's HTML to `buildTextPdf(html, opts, 'html')`. Use `RichToolbar` buttons (never steal focus: `onMouseDown preventDefault`). Plain/Markdown files are converted to HTML with `lib/pdf/rich-html.ts`.
- Site settings (name, url, SEO defaults, robots, verification) are only in `config/site.ts`; schema.org builders in `lib/seo/schema.ts`.


## Blog

- Posts are markdown in `web/src/content/blog/<lang>/`. Frontmatter: `title` (H1), `seoTitle` (<=60), `description` (<=155), `lang`, `translationKey`, `date`, `keywords`, `tool` (slug, shows a Try-it box and a link from the tool page).
- FAQ at the end of a post: one line per question, `**Question?** Answer`. These lines also become FAQPage schema.
- Link to tools with relative paths (`/jpg-to-pdf/`), never a full domain.
- Per-language texts of the blog (title, description, path) are in `config/site.ts` (`SITE.blog`).
- After adding the first content collection, restart `astro dev`.

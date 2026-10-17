# PDF Tools Project: Docs Index

Goal: iLovePDF jaisi free online PDF tools website banana, jiska traffic **SEO (Google organic)** se aaye. Pehla target market: **India** (phir Indonesia, Brazil).

## Kahan se shuru karein

1. [`../AGENTS.md`](../AGENTS.md): hard rules (2 min)
2. [10-final-decisions.md](10-final-decisions.md): jo final ho chuka hai (stack, speed budget, UX, SEO rules)
3. [11-dev-guide.md](11-dev-guide.md): code kaise likhna hai, naya tool kaise add karna hai
4. [12-status.md](12-status.md): ab tak kya bana, kya baaki, kya atka hai

Baaki files (01-09) background/planning hain. Agar 10 ya 11 se conflict ho to **10 aur 11 jeette hain**.

## Index: kis file mein kya hai

| # | File | Kya milega | Kab padhein |
|---|------|------------|-------------|
| 01 | [01-market-analysis.md](01-market-analysis.md) | PDF report ka analysis, opportunity, competitors | market/volume ka sawal ho |
| 02 | [02-PRD.md](02-PRD.md) | Product requirements, goals, users | feature ka scope jaanna ho |
| 03 | [03-tech-stack.md](03-tech-stack.md) | Stack options aur reasons | "yeh stack kyun" |
| 04 | [04-architecture.md](04-architecture.md) | Architecture, client vs server tools, Wave 2 server plan | server tool (Word/PDF) banana ho |
| 05 | [05-seo-strategy.md](05-seo-strategy.md) | Page structure, keywords, schema, internal linking | naya page / content likhna ho |
| 06 | [06-tool-specs.md](06-tool-specs.md) | Har tool ka spec (library, difficulty, phase) | naya tool shuru karna ho |
| 07 | [07-roadmap.md](07-roadmap.md) | Phase-wise plan aur milestones | planning |
| 08 | [08-risks-and-open-questions.md](08-risks-and-open-questions.md) | Risks, licences, pending decisions | kuch decide karna ho |
| 09 | [09-tool-priority.md](09-tool-priority.md) | Pehle kaunse tools, problem-query approach | tool order ka sawal |
| 10 | [10-final-decisions.md](10-final-decisions.md) | **FINAL**: stack, launch tools, speed budget, UX/SEO rules | hamesha pehle |
| 11 | [11-dev-guide.md](11-dev-guide.md) | **Dev guide**: folders, conventions, naya tool recipe, testing, rich editor aur settings placement | code likhne se pehle |
| 12 | [12-status.md](12-status.md) | **Status log**: done, next, known gaps, blocked; SEO foundation, rich text editor | har session ke start/end par |

## Sawal -> jawab kahan

| Sawal | Jawab |
|-------|-------|
| Naya tool kaise add karun? | 11 section 4 |
| Colors / buttons / layout ke rules? | 11 section 3 aur AGENTS.md hard rules |
| Site name, domain, SEO defaults, robots kahan badlein? | `web/src/config/site.ts` (11 + 12 "SEO foundation") |
| Schema (JSON-LD) kahan banta hai? | `web/src/lib/seo/schema.ts` |
| Nayi blog post kaise daalein? | 11 "Blog" section, files `web/src/content/blog/` |
| Kaunsa tool pehle? | 09 aur 10 section 7 |
| Speed budget? | 10 section 4 |
| Abhi kya baaki hai? | 12 "Next" aur "Blocked" |
| Server tools (PDF to Word)? | 04 |

## Code map (`web/src`)

| Path | Kya hai |
|------|---------|
| `config/site.ts` | Site-wide settings (name, url, SEO, robots, social) |
| `pages/` | Routes: `index`, `[slug]` (tool pages), `robots.txt.ts`, `manifest.webmanifest.ts` |
| `layouts/` | `BaseLayout` (head, header, footer), `ToolLayout` (tool page + schema) |
| `components/seo/` | `Seo.astro` (meta/OG), `JsonLd.astro` |
| `components/layout/`, `components/content/` | Header, Footer, Breadcrumbs; Steps, FAQ, Guide, RelatedTools |
| `components/tool/` | Tool UIs (Preact islands) + shared parts: `ToolWorkspace`, `PdfPageOptions`, `SettingChips`, `RichEditor`, `Dropzone`, `PageGrid`... |
| `components/ui/` | Button etc. |
| `lib/tools/` | `registry.ts`, `types.ts`, `defs/*` (tool content: title, H1, steps, FAQ, guide) |
| `lib/pdf/` | PDF engines (lazy): `text-to-pdf`, `jpg-to-pdf`, `merge`, `pdf-to-jpg`, `fonts`, `rich-html`, configs |
| `lib/seo/` | Schema builders |
| `content/blog/`, `lib/blog/`, `components/blog/`, `pages/blog`, `pages/hi/blog` | Blog (English + Hindi posts, RSS) |
| `lib/storage/` | Draft save/restore (IndexedDB) |
| `styles/global.css` | Design tokens (colors only here) |

## Short summary (TL;DR)

- **Stack:** Astro (static) + Preact islands + TypeScript + Tailwind, Cloudflare Pages par deploy. Zyada tar tools **browser ke andar (client-side, WASM)** chalenge, sirf Word/PPT/Excel conversion ke liye chhota **server (Gotenberg/LibreOffice)**.
- **Kyun:** client-side = server cost lagbhag zero, privacy ("file upload nahi hoti") ek selling point, aur static pages = fast = SEO ke liye accha.
- **Strategy:** brand keyword par nahi, **user ki problem query** par rank karna ("pdf 100kb kaise kare").
- **Wave 1 tools (sab browser-only):** JPG to PDF, Compress PDF (target KB), Merge PDF, PDF to JPG, Split/Remove/Extract pages. PDF to Word aur Word to PDF Wave 2 mein (server chahiye). Detail: [09](09-tool-priority.md).
- **SEO:** har tool ka alag landing page, content + FAQ + schema, Hindi aur English dono, problem-based long-tail pages.

## Source aur bharosa

Numbers sirf `iLovePDF Tools Report.pdf` se hain (15 Oct 2026). Wo numbers **competitor sites ke India keyword data ka estimate** hain, iLovePDF ka apna usage nahi. Live keyword/SERP verification abhi baaki hai (OpenRush ke credits khatam the). Dekho [08](08-risks-and-open-questions.md).

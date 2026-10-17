# 10. Final Decisions (Locked)

Priority order: **1) Speed, 2) User experience, 3) SEO.** Teeno ek doosre ko support karte hain: fast + clean page = Google bhi pasand karta hai.

Date: 17 Oct 2026. Badlav tabhi jab data/test se kuch galat nikle.

## 1. Strategy

- Brand keyword par nahi, **user ki problem query** par rank karna ("pdf 100kb kaise kare").
- Pehla market India, languages: English + Hindi.
- Tools browser mein chalenge (file upload nahi hoti), server sirf Wave 2 mein.

## 2. Launch tools (Wave 1, 7 pages)

| # | Tool | Slug |
|---|------|------|
| 1 | JPG to PDF | `/jpg-to-pdf` |
| 2 | Compress PDF (50KB/100KB/200KB/1MB targets) | `/compress-pdf` (+ use-case pages) |
| 3 | Merge PDF | `/merge-pdf` |
| 4 | PDF to JPG | `/pdf-to-jpg` |
| 5 | Split / Remove pages / Extract pages | `/split-pdf`, `/remove-pages`, `/extract-pages` |

Wave 2 (server): PDF to Word, Word to PDF. Detail: [09](09-tool-priority.md).

## 3. Final tech stack

| Layer | Choice | Speed/UX/SEO reason |
|-------|--------|---------------------|
| Framework | **Astro** (static output, TypeScript) | Default zero JS, best Core Web Vitals |
| Tool UI | **Preact islands** (`client:visible`) | React se bahut halka (~4KB vs ~40KB), same component style |
| Styling | **Tailwind CSS** (purged), shadcn nahi | Chhota CSS, extra component weight nahi |
| Content | Astro content collections (MDX), en + hi | Tool copy/FAQ ek jagah |
| PDF engine | pdf-lib, pdf.js, fflate (zip) | Browser mein, MIT/Apache |
| Heavy work | **Web Worker**, WASM lazy-load | UI kabhi freeze nahi hoga |
| Fonts | Self-hosted, system font stack + Noto Sans Devanagari (subset) | Koi third-party font request nahi |
| Hosting | **Cloudflare Pages** | Free commercial use, India edge, no bandwidth bill |
| Analytics | Plausible (ya GA4 lite) + Search Console | Halka script |
| Ads | Result ke baad / page ke neeche, lazy | Speed aur UX bachaye |
| Wave 2 server | Alag API (Gotenberg + Fastify/FastAPI) VPS par | Site static hi rahegi |

## 4. Speed budget (har page par lagu)

| Metric | Target |
|--------|--------|
| LCP (mobile 4G) | ≤ 2.0s |
| INP | ≤ 150ms |
| CLS | 0 (≤ 0.05) |
| JS before interaction | ≤ 60KB gzip (engine ke bina) |
| Total page weight | ≤ 250KB (ads ke bina) |
| Lighthouse mobile | ≥ 95 (Performance + SEO + Accessibility) |

Rules:
1. HTML poora static, content JS ke bina dikhe.
2. PDF/WASM engine **tabhi load** jab user dropzone par hover kare ya file chune; idle par prefetch.
3. Processing Web Worker mein, progress bar ke saath.
4. Images sirf WebP/AVIF/SVG, icons inline SVG.
5. Koi third-party script (ads/analytics) pehle render ko block na kare; ads user ke result ke baad ya fold ke neeche, fixed height slot (CLS 0).
6. Cloudflare par aggressive caching, Brotli, HTTP/3.
7. Link par hover prefetch (Astro prefetch) se agla page instant lage.
8. CI mein Lighthouse CI check: budget tootne par build fail.

## 5. UX principles

1. **Page khulte hi tool dikhe** — H1 ke neeche seedha dropzone, scroll nahi.
2. **3 step flow:** file chuno -> (options, optional) -> Download. Signup nahi, popup nahi.
3. **Mobile first:** bade touch targets (≥ 44px), gallery/camera se file, "Files" app se bhi.
4. **Turant feedback:** thumbnail/preview, file size, progress, "kaam ho gaya" + bada Download button.
5. **Compress mein target size:** "100 KB tak" preset buttons, result mein before/after size.
6. **Privacy line dikhao:** "Aapki file aapke device se bahar nahi jaati."
7. **Saaf errors:** password-wali PDF, corrupt file, bahut badi file ke liye seedhi bhasha mein (Hindi mein bhi).
8. **Result ke baad:** related tool suggest ("ab merge karna hai?").
9. **Sirf light theme (dark mode nahi).** Brand color red `#d00000` (owner decision): logo, primary buttons, links, selected states. White cards, light grey page, dark text (`#33333b`). Layout utility-site jaisa: centered hero, tool card grid, bada red CTA. Tokens: `web/src/styles/global.css`. Accessibility: keyboard, labels, contrast.
10. Clutter nahi: ek page par ek kaam.

## 6. SEO rules (non-negotiable)

1. Ek tool/problem = ek URL, clean slug (`/compress-pdf/100kb`).
2. Har page: unique title (≤ 60), description (≤ 155), H1 = problem/keyword, 3-step how-to, FAQ (8–10), 6–8 related links, 400–800 word unique guide.
3. Schema: `WebApplication`, `FAQPage`, `HowTo`, `BreadcrumbList` (rich result ki guarantee nahi).
4. `sitemap.xml` (Astro integration), `robots.txt`, canonical, hreflang (en/hi).
5. Programmatic pages tabhi jab har page par **unique useful content**; thin pages nahi.
6. Brand keyword ya competitor naam par page nahi.
7. Search Console + Bing Webmaster launch din se; weekly check.
8. Internal linking tool registry se auto-generate.

## 7. Dev plan (build order)

1. Astro scaffold + Tailwind + Preact + Cloudflare Pages deploy + Lighthouse CI.
2. Tool registry, Layout, ToolShell, Dropzone, Worker setup.
3. JPG to PDF (pehla end-to-end, template ban jaata hai).
4. Merge, PDF to JPG.
5. Compress (target size) — sabse mehnat wala, test files ke saath.
6. Split/Remove/Extract.
7. SEO copy en + hi, use-case pages, sitemap, schema.
8. QA (mobile low-end, slow 3G), launch, Search Console submit.

## 8. Abhi bhi verify karna hai (blocker nahi, par launch se pehle)

- Top problem queries ka volume + SERP (Keyword Planner/Ahrefs; OpenRush credits refill).
- Compress quality: browser mein image re-encode se 100KB target kitne % files par pahunchta hai.
- Brand name + domain.
- Preact compat: pdf-lib/pdf.js par koi issue nahi hona chahiye (ye UI libs nahi hain); UI mein sirf simple components.

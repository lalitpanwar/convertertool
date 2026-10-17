# 03. Tech Stack Decision

## 1. Decision (recommended)

| Layer | Choice | Kyun |
|-------|--------|------|
| Framework | **Astro (static output) + Preact islands + TypeScript** (final: [10](10-final-decisions.md)) | Default zero JS = best Core Web Vitals; content collections (MDX); built-in i18n routing; sitemap integration; Cloudflare par seedha static deploy. Tool UI sirf React island (`client:visible`) |
| Styling | **Tailwind CSS** (+ shadcn/ui components) | Tez development, chhota CSS |
| i18n | **Astro built-in i18n routing** | en/hi/id/pt-BR routing; hreflang manually/integration se |
| Client PDF engine | **pdf-lib** (MIT) + **pdf.js** (Apache-2.0) | Merge/split/rotate/watermark/page numbers/JPG→PDF + PDF render/PDF→JPG |
| Compress | PDF.js render + re-encode images (JS) pehle; baad mein **qpdf-wasm / Ghostscript-wasm** (licence check) | Basic compress browser mein |
| OCR | **tesseract.js** (Apache-2.0), lazy-loaded | Browser OCR |
| Office → PDF | **Gotenberg** (Docker, LibreOffice) | Word/PPT/Excel→PDF ke liye production-proven, simple HTTP API |
| PDF → Word | Server worker (pdf2docx ya paid API, **licence/quality test baaki**) | Browser mein achhi quality nahi mil sakti |
| Server API | **Node.js (Fastify) ya Python (FastAPI)** chhota service, sirf conversions | Gotenberg ko proxy + validation + cleanup |
| Hosting (web) | **Cloudflare Pages** (ya Vercel) | Global CDN, India mein fast, sasta/free tier |
| Hosting (server tools) | **VPS (Hetzner/DigitalOcean/AWS Mumbai)** Docker compose | Predictable cost; India latency ke liye Mumbai/Singapore |
| Storage | Temp disk / R2 with 1h TTL | Sirf server-tools |
| Analytics | Plausible ya GA4 + Google Search Console | |
| Ads | Google AdSense → baad mein Ezoic/Mediavine (traffic ke hisaab se) | |
| Payments (P2) | Razorpay (India) + Stripe | |
| CI/CD | GitHub Actions | |
| Monitoring | Sentry + UptimeRobot | |

## 2. Core architecture idea: "Client-first, server-only-when-needed"

- Zyada tar tools browser mein chalenge. Fayde:
  - **Cost:** user ke device ka CPU use hota hai, hamara server bill ~0.
  - **Privacy:** "Aapki file kahin upload nahi hoti." SEO landing copy aur trust ke liye bada point.
  - **Speed:** upload/download wait nahi, India ke slow network par bhi accha.
  - **Scale:** viral traffic spike se server nahi girta.
- Server sirf wahan jahan browser mein quality kharab ho: Word/PPT/Excel→PDF, PDF→Word/PPT/Excel, (baad mein) heavy OCR/AI.

## 3. Alternatives jo consider kiye

| Option | Faisla | Wajah |
|--------|--------|-------|
| **Astro + React islands** (chosen) | ✅ | Content-heavy SEO pages + halka JS + simple static deploy. Kamzori: Phase 3 mein login/dashboard ke liye alag app ya Astro SSR |
| Next.js | 🟡 second | Bada ecosystem, par har page par zyada JS aur Cloudflare par extra setup. Agar shuru se accounts/dashboard heavy ho to behtar |
| Nuxt / SvelteKit | ❌ | Chalega, par PDF libs ka React/TS ecosystem aur hiring pool chhota |
| WordPress + plugins | ❌ | Tool UI customisation aur performance mushkil |
| Pure server-side processing (sab upload) | ❌ | Cost zyada, privacy weak, scale mehnga |
| Python Django/Flask full stack | ❌ | SEO pages ke liye theek, par rich client UI ke liye alag frontend chahiye hi |
| Rust/Go backend | ❌ (abhi) | Over-engineering; zaroorat ho to baad mein |

## 4. Library licence summary (production se pehle verify karo)

| Library | Licence | Note |
|---------|---------|------|
| pdf-lib | MIT | Safe |
| pdf.js | Apache-2.0 | Safe |
| tesseract.js | Apache-2.0 | Safe |
| Gotenberg | MIT | LibreOffice (MPL) engine, theek |
| MuPDF (mupdf.js) | **AGPL / commercial** | Closed source site ke liye commercial licence chahiye |
| Ghostscript | **AGPL / commercial** | Same, WASM build bhi AGPL. Alternative: image re-encode approach ya qpdf |
| pdf2docx | **GPL-3.0** (check) | Server par network use ke liye alag clauses; legal review ya paid API |
| qpdf | Apache-2.0 | Safe |

> Yeh meri jaankari ke hisaab se hai. Final licence har library ke latest repo se confirm karna.

## 5. Performance rules (SEO ke liye zaroori)

1. Tool pages **statically generated**; HTML mein poora content (JS ke bina bhi dikhe).
2. PDF/WASM bundles **dynamic import** (file select ke baad hi load).
3. Heavy work **Web Worker** mein, UI thread free.
4. Images WebP/AVIF, fonts self-hosted + `font-display: swap`.
5. Ads lazy-load, fixed height placeholders (CLS = 0).

## 6. Team / skill fit

- Ek full-stack TS developer MVP sambhal sakta hai.
- Server hissa chhota hai (Docker compose: Gotenberg + 1 API).

## 7. Estimated monthly cost (rough, **validate karo**)

| Item | MVP |
|------|-----|
| Cloudflare Pages / Vercel | $0 – $20 |
| 1 VPS (4GB RAM) for Gotenberg + API | $10 – $25 |
| Domain | ~$1 |
| Monitoring/Analytics | $0 – $10 |
| **Total** | **~$15 – $55** |

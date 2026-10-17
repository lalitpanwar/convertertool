# 04. Architecture

## 1. High-level

```
User Browser
 ├─ Astro static pages (CDN: Cloudflare)           <- SEO content + React tool island
 ├─ Web Worker + WASM (pdf-lib, pdf.js, tesseract) <- client-side tools (file device se bahar nahi jaati)
 └─ fetch() -> api.example.com                     <- sirf server-side tools
                 │
          Reverse proxy (Caddy/Nginx, rate limit, TLS)
                 │
          API service (Fastify/FastAPI)
           ├─ validate (size, magic bytes, mime)
           ├─ Gotenberg (LibreOffice)  -> Office -> PDF
           ├─ PDF -> Word worker       -> pdf2docx / paid API
           └─ temp storage (TTL 1h) + cleanup cron
```

## 2. Tool processing map

| Tool | Where | Engine |
|------|-------|--------|
| JPG to PDF | Client | pdf-lib (+ canvas for rotate/resize) |
| PDF to JPG | Client | pdf.js render -> canvas -> JPEG, zip via fflate |
| Merge PDF | Client | pdf-lib |
| Split / Extract / Remove / Organize / Rotate | Client | pdf-lib |
| Page numbers / Watermark / Crop | Client | pdf-lib |
| Compress PDF | Client (V1), Server option later | Image re-encode via pdf.js+pdf-lib; qpdf for structure |
| Protect / Unlock | Client (qpdf-wasm) ya Server | qpdf |
| Sign (basic image/draw) | Client | pdf-lib |
| OCR | Client (small), Server (big) | tesseract.js |
| **Word / PPT / Excel to PDF** | **Server** | Gotenberg |
| **PDF to Word / PPT / Excel** | **Server** | pdf2docx / vendor API (test) |
| HTML to PDF | Server | Gotenberg (Chromium) |
| Repair, PDF/A, Compare, Redact | Server / mixed | qpdf, Ghostscript (licence!), custom |
| AI tools | Server | LLM API (later) |

## 3. Frontend structure (planned)

```
/src
  /pages
    /index.astro, /hi/index.astro          home (en default, hi prefix)
    /[tool].astro                          tool landing (getStaticPaths)
    /[tool]/[useCase].astro                problem pages (e.g. compress-pdf/100kb)
    /blog/[slug].astro
  /components
    *.astro  : Layout, FAQ, RelatedTools, AdSlot (static, zero JS)
    *.tsx    : ToolShell, Dropzone, FileList, Progress, ResultCard (React islands, client:visible)
/lib
  tools/registry.ts                single source of truth (slug, name, seo, engine)
  pdf/*.ts                         pure functions per tool (run in worker)
  workers/*.worker.ts
/content
  tools/<slug>.<locale>.mdx        SEO copy per tool & language
```

**Tool registry** ek hi jagah: slug, title, description, category, locale-wise copy, engine (client/server), related tools. Isse sitemap, internal links, schema sab auto-generate hote hain.

## 4. API (server tools)

| Endpoint | Input | Output |
|----------|-------|--------|
| `POST /v1/convert/office-to-pdf` | file (docx/pptx/xlsx) | PDF stream |
| `POST /v1/convert/pdf-to-word` | PDF | docx |
| `GET /healthz` | – | ok |

Rules: max size 25MB (starting), timeout 60s, per-IP rate limit, magic-byte check, container mein no-network + read-only fs, files turant delete ya TTL 1h, logs mein filename nahi.

## 5. Data / state

- V1 mein **database ki zaroorat nahi** (no accounts).
- Phase 2 (premium): Postgres (users, subscriptions), Razorpay/Stripe webhooks.

## 6. Deployment

- Web: Cloudflare Pages (Git push -> build). Preview per PR.
- API: Docker compose on VPS (Mumbai/Singapore). Gotenberg container + API container + Caddy.
- Env separation: dev / staging / prod.
- Backups: kuch nahi chahiye (stateless) V1 mein.

## 7. Security checklist

- File type validation, size cap, timeouts
- Gotenberg ko public expose mat karo (sirf internal network)
- CORS sirf apne domain
- CSP header, no inline script (ads ke liye allowlist)
- Abuse: Cloudflare Turnstile server tools par

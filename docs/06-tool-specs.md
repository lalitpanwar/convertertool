# 06. Tool Specs

Legend: **C** = client-side (browser), **S** = server. Difficulty: 1 (easy) – 5 (hard). Volume: report (India, approx.), "–" = report mein nahi.

> **Update:** build order ab [09-tool-priority.md](09-tool-priority.md) ke hisaab se hai. Wave 1 = JPG to PDF, Compress, Merge, PDF to JPG, Split/Remove/Extract. PDF to Word aur Word to PDF Wave 2. Neeche ki "MVP" table purani volume-order thi.

## MVP (Phase 1) — purani list, 09 dekho

| # | Tool | Slug | Vol | Where | Engine | Diff | Notes |
|---|------|------|-----|-------|--------|------|-------|
| 1 | JPG to PDF | `/jpg-to-pdf` | 4.8M | C | pdf-lib | 1 | Reorder, page size (A4/Letter/fit), orientation, margin; PNG/WebP/HEIC bhi (HEIC: heic2any). EXIF rotation handle |
| 2 | PDF to Word | `/pdf-to-word` | 4.0M | S | pdf2docx / API | 5 | Sabse mushkil quality. Scanned PDF ko OCR chahiye. Pehle quality benchmark |
| 3 | PDF to JPG | `/pdf-to-jpg` | 3.4M | C | pdf.js + fflate zip | 2 | DPI option (72/150/300), all pages / selected |
| 4 | Word to PDF | `/word-to-pdf` | 2.5M | S | Gotenberg | 2 | docx, doc, odt. Fonts install karo (Hindi/Devanagari fonts: Noto) |
| 5 | Merge PDF | `/merge-pdf` | 1.7M | C | pdf-lib | 2 | Reorder, page-level preview, encrypted PDF error |
| 6 | Compress PDF | `/compress-pdf` | 1.6M | C -> S | image re-encode (+qpdf) | 4 | Levels: low/medium/high + "target size" (100KB etc.) — India SEO ka key |

## Phase 2

| Tool | Slug | Where | Engine | Diff |
|------|------|-------|--------|------|
| Split PDF | `/split-pdf` | C | pdf-lib | 2 |
| Remove pages | `/remove-pages` | C | pdf-lib | 2 |
| Extract pages | `/extract-pages` | C | pdf-lib | 2 |
| Organize PDF | `/organize-pdf` | C | pdf-lib + pdf.js thumbs | 3 |
| Rotate PDF | `/rotate-pdf` | C | pdf-lib | 1 |
| Page numbers | `/add-page-numbers` | C | pdf-lib | 2 |
| Watermark | `/watermark-pdf` | C | pdf-lib | 2 |
| Crop PDF | `/crop-pdf` | C | pdf-lib | 3 |
| PowerPoint to PDF | `/powerpoint-to-pdf` | S | Gotenberg | 2 |
| Excel to PDF | `/excel-to-pdf` | S | Gotenberg | 2 |
| Protect PDF | `/protect-pdf` | C/S | qpdf | 3 |
| Unlock PDF | `/unlock-pdf` | C/S | qpdf (sirf jab user ke paas password; crack nahi) | 3 |
| Sign PDF | `/sign-pdf` | C | pdf-lib (draw/type/image) | 3 |

## Phase 3

| Tool | Where | Engine | Diff |
|------|-------|--------|------|
| OCR PDF | C/S | tesseract.js / ocrmypdf | 4 |
| PDF to PowerPoint | S | vendor/LibreOffice | 5 |
| PDF to Excel | S | tabula-like / vendor | 5 |
| HTML to PDF | S | Gotenberg (Chromium) | 2 |
| Repair PDF | S | qpdf | 3 |
| PDF to PDF/A | S | Ghostscript (AGPL!) / veraPDF | 4 |
| Compare PDF | C/S | text diff | 4 |
| Redact PDF | C | pdf-lib (real redaction, text hataana zaroori) | 4 |
| Scan to PDF | C | camera + pdf-lib | 2 |

## Phase 4

AI Summarizer, Translate PDF, PDF to Markdown (naye, report mein usage data nahi), PDF Forms, Edit PDF (full editor — premium in iLovePDF).

## Build order rationale

1. 1, 3, 5 pehle (client-side, fast, bina server): jaldi launch + SEO test.
2. 6 ke baad 4 (server setup ek baar).
3. 2 (PDF to Word) tab jab quality benchmark pass ho, warna users bad review denge. Chahe to launch mein "beta" label.

## Acceptance (har tool)

- 5 mobile + 5 desktop test files par kaam kare (chhoti, badi, Hindi text, encrypted, corrupt)
- 50MB file par browser crash na ho (worker + chunking)
- Result download name sensible (`merged.pdf`)
- Tool page Lighthouse mobile ≥ 90 (SEO + Performance)

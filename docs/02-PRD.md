# 02. Product Requirements Document (PRD)

Version 0.1 · 17 Oct 2026 · Status: Draft (planning)

## 1. Vision

Sabse tez, saaf aur private free PDF tools website, jo Google search se milne wale users (pehle India) ko 1 click mein unka kaam karwa de, bina signup, bina bhaari ads.

## 2. Goals

| # | Goal | Metric |
|---|------|--------|
| G1 | SEO se traffic lana | 6 mahine: 50K organic sessions/month; 12 mahine: 500K (**target hai, guarantee nahi; baseline ke baad revise karo**) |
| G2 | Tool use asaan ho | Tool page par upload se download tak < 30 sec, 3 clicks se kam |
| G3 | Fast pages | Core Web Vitals "Good" (LCP < 2.5s, INP < 200ms, CLS < 0.1) mobile par |
| G4 | Kam infra cost | Server-processed jobs total jobs ka < 25% |
| G5 | Revenue | Phase 1 ads, Phase 2 premium |

## 3. Non-goals (V1)

- Mobile / desktop app
- User accounts, workflows, e-sign, Edit PDF (full editor)
- AI tools (data nahi, baad mein)

## 4. Target users

1. **India ka student / job applicant**: form upload ke liye photo ko PDF banana, size chhota karna. Mobile par, slow network.
2. **Office / freelancer**: Word↔PDF, merge, sign.
3. **Indonesia / Brazil users**: Phase 3 mein local language pages.

## 5. Functional requirements

### 5.1 Tool page (har tool ke liye same template)
- FR1: Drag-drop + file picker + mobile camera/gallery select.
- FR2: Multiple files (jahan relevant), reorder (merge, JPG to PDF).
- FR3: Progress bar; processing client-side jahan possible.
- FR4: Result page: Download button, "file delete ho gayi" note, related tools suggestions.
- FR5: Error states saaf: password-protected PDF, corrupt file, size limit.
- FR6: Options panel (jaise compress level, page size, orientation, margin).
- FR7: Drive/Dropbox import: Phase 2.

### 5.2 Content (SEO)
- FR8: Har tool page par: H1, short intro, "How to" 3 steps, features, FAQ (FAQ schema), related tools, long-form guide.
- FR9: Home page par categories ke saath saare tools.
- FR10: Blog / guides section.
- FR11: Language switch: English + Hindi (V1), baaki baad mein.

### 5.3 Platform
- FR12: Sitemap.xml auto-generate, robots.txt, canonical, hreflang.
- FR13: Analytics (Plausible/GA4) + Search Console.
- FR14: Cookie / privacy banner (DPDP Act India, GDPR agar EU traffic).
- FR15: Ads slots (lazy-load, CLS safe).

## 6. Non-functional requirements

| Area | Requirement |
|------|-------------|
| Performance | Tool page JS initial < 150KB; heavy WASM tabhi load jab file select ho |
| Privacy | Client-side tools ki file server tak nahi jaati. Server tools ki file max 1 ghante mein delete |
| Limits | Free: 100MB per file (client-side), server tools 25MB (adjust after cost) |
| Browser | Latest Chrome, Safari (iOS), Firefox, Edge, Android Chrome |
| Accessibility | WCAG 2.1 AA basic: keyboard, labels, contrast |
| Reliability | 99.9% static pages (CDN), server tools graceful fallback message |
| Security | Upload validation (magic bytes), rate limit, no file execution, isolated converter container |

## 7. Tool scope by phase

| Phase | Tools |
|-------|-------|
| **MVP (P1)** | JPG to PDF, PDF to JPG, Merge PDF, Compress PDF, Word to PDF, PDF to Word |
| **P2** | Split, Remove pages, Extract pages, Rotate, Page numbers, Watermark, Crop, Organize, PowerPoint to PDF, Excel to PDF, Protect, Unlock, Sign (basic) |
| **P3** | OCR, PDF to PowerPoint, PDF to Excel, HTML to PDF, Repair, PDF/A, Compare, Redact, Scan to PDF |
| **P4** | AI Summarizer, Translate, PDF to Markdown, PDF Forms, Edit PDF |

Detail: [06-tool-specs.md](06-tool-specs.md)

## 8. Success metrics (KPIs)

- Organic sessions, impressions, avg position (Search Console)
- Indexed pages vs submitted
- Tool completion rate (upload → download)
- Bounce / engagement time
- Core Web Vitals pass %
- RPM aur revenue/1000 sessions
- Server job cost per 1000 jobs

## 9. Assumptions

- A1: Report ke volume numbers estimate hain (competitors se) aur India ke hain.
- A2: Browser-side quality (compress, JPG to PDF) users ko kaafi lagegi.
- A3: Google "AI overviews" kuch simple queries ka traffic kam kar sakte hain; tool queries mein user ko tool hi chahiye, to impact kam hone ki ummeed hai (**monitor karo**).

## 10. Open questions

[08-risks-and-open-questions.md](08-risks-and-open-questions.md) dekho.

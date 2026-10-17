# 08. Risks & Open Questions

## Risks

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R1 | Report ke volumes competitor-site data ke estimate hain, actual market size alag ho sakta hai | Prioritisation galat | Phase 0 mein Keyword Planner/Ahrefs/Semrush se verify |
| R2 | Head keywords par iLovePDF/Smallpdf/pdf24 ki authority | Slow ranking | Long-tail + India use-case + Hindi se shuru, authority banao |
| R3 | PDF to Word quality kharab | Bad reviews, bounce | Benchmark, beta label, paid API fallback |
| R4 | AGPL/GPL libraries (MuPDF, Ghostscript, pdf2docx) | Legal / source-disclosure | Licence review; MIT/Apache alternatives; commercial licence |
| R5 | Google AI Overviews / algorithm update | Traffic dip | Tool-intent queries relatively safe; diversify (Bing, direct, social, brand) |
| R6 | Thin/duplicate programmatic pages | Google penalty | Har page par unique content, quality over count |
| R7 | Server abuse (malware upload, spam) | Cost / security | Rate limit, Turnstile, sandboxed containers, TTL delete |
| R8 | Ads revenue India mein kam (low RPM) | Profit chhota | Premium plan, global languages (id, pt-BR), low infra cost se margin |
| R9 | Large file par browser memory crash | Bad UX | Web Worker, size warning, server fallback |
| R10 | Trademark ("ilovepdf" jaisa naam) | Legal | Original brand name |
| R11 | Privacy laws (DPDP India, GDPR) | Compliance | Privacy policy, consent banner, no file retention |

## Open questions (user ko decide karna hai)

1. **Brand name / domain** kya hoga?
2. **Languages:** V1 mein sirf English + Hindi theek hai, ya Indonesian/Portuguese bhi?
3. **Monetization:** sirf ads, ya premium plan bhi Phase 2 mein?
4. **Budget:** monthly infra (~$15–55 MVP) aur paid PDF-to-Word API ka budget?
5. **Team:** kaun banayega (dev kitne, content/SEO writer)?
6. **PDF to Word:** MVP mein beta ke saath launch ya baad mein?
7. **Hosting preference:** Cloudflare Pages vs Vercel, VPS region (Mumbai vs Singapore)?
8. **Keyword tool access:** OpenRush credits refill karoge ya Ahrefs/Semrush use karoge?

## Jo is analysis mein verify NAHI hua

- Live keyword volumes, difficulty, SERP competitors (OpenRush ne 402 / insufficient credits diya)
- Hindi/regional keywords ki demand aur competition
- Library licences ki latest status
- Hosting/API ki exact pricing

Ye sab Phase 0 mein confirm karna hai.

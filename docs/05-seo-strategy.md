# 05. SEO Strategy

Goal: tools pages se Google organic traffic. Report ke hisaab se competitors ka ~46% traffic organic hai, aur top keywords conversion tools ke hain.

> Yeh plan strategy hai. Live keyword volume/difficulty/SERP abhi verify nahi hui (OpenRush credits khatam). **Page banane se pehle top 50 keywords validate karo.**

**Approach (user decision):** brand keywords ("ilovepdf") par rank nahi karna. Sirf **user ki problem queries** par rank karna hai. Tool order: [09-tool-priority.md](09-tool-priority.md).

## 1. Site structure

```
/                          home (saare tools, categories)
/jpg-to-pdf                tool page (en)
/hi/jpg-to-pdf             Hindi version
/compress-pdf
/compress-pdf/100kb        programmatic use-case pages
/blog/...                  guides
```

- Flat, short, keyword-based URLs: `/merge-pdf`, `/pdf-to-word`.
- Ek tool = ek primary URL (cannibalization nahi). Variants (use-case pages) alag intent par.
- hreflang har language pair par, self-referencing canonical.

## 2. Page template (har tool page)

1. `<title>`: "JPG to PDF Converter: Free, No Signup | Brand" (≤ 60 chars)
2. Meta description (≤ 155 chars) + CTA
3. H1 = primary keyword
4. Tool UI above the fold (user ko turant kaam dikhe)
5. "Kaise karein" 3 steps (HowTo schema)
6. Features / Privacy note ("file upload nahi hoti")
7. FAQ (8–10 sawaal, FAQPage schema), real People-Also-Ask se
8. Related tools (internal links, 6–8)
9. Long-form guide neeche (400–800 words), duplicate nahi, unique
10. Schema: `SoftwareApplication` / `WebApplication`, `HowTo`, `FAQPage`, `BreadcrumbList`

> Note: Google ne HowTo/FAQ rich results kaafi seemit kar diye hain, schema ab bhi helpful hai par SERP mein dikhne ki guarantee nahi.

## 3. Keyword plan (hypothesis, validate karna hai)

### Tier 1: head keywords (report volumes, India)
jpg to pdf (4.8M), pdf to word (4.0M), pdf to jpg (3.4M), word to pdf (2.5M), merge pdf (1.7M), compress pdf (1.6M)

Inme turant rank mushkil. Pehle Tier 2/3 se authority banao.

### Tier 2: modifiers
"free", "online", "without watermark", "no signup", "on mobile", "offline", "in hindi"

### Tier 3: India use-case long-tail (best starting point)
- compress pdf to 50kb / 100kb / 200kb / 500kb / 1mb / 2mb
- jpg to pdf 100kb / photo to pdf for form
- aadhaar card pdf compress, marksheet pdf, resume pdf
- "pdf ko jpg me kaise badle", "photo ko pdf kaise banaye" (Hindi/Hinglish)
- merge pdf for upsc / ssc / bank forms (**validate**)

Programmatic pages tabhi banao jab har page par **unique, useful** content ho (sirf title badal kar 500 pages = thin content / spam risk).

## 4. Content plan

| Type | Example | Maqsad |
|------|---------|--------|
| Tool pages | 6 MVP -> 30+ | Primary traffic |
| Use-case pages | compress-pdf/100kb | Long-tail |
| Guides | "PDF ka size kaise kam karein" | Informational + internal links |
| Hindi pages | Har tool ka Hindi | India traffic, kam competition (**validate**) |

Cadence: MVP launch pe 6 tools + 20 use-case pages; phir har hafte 2–3 tools/guides.

## 5. Technical SEO checklist

- [ ] SSG/ISR, poora HTML crawlable
- [ ] Core Web Vitals green (mobile)
- [ ] `sitemap.xml` (tool registry se auto), submit in Search Console + Bing
- [ ] `robots.txt`, canonical, hreflang
- [ ] Clean internal linking: har tool page se 6–8 related tools, home se sab
- [ ] Breadcrumbs
- [ ] OG/Twitter images
- [ ] 404/redirect hygiene, HTTPS, www vs non-www ek hi
- [ ] Structured data test (Rich Results Test)
- [ ] Log/Search Console monitoring har hafte
- [ ] Ads se CLS/INP na bigde

## 6. Off-page / authority

- Product Hunt, Reddit (r/IndiaTech jaisi communities, spam nahi), indie directories
- "Free tools" directories, AlternativeTo
- Browser-based/privacy angle par blogs/newsletters ko pitch
- HARO-style / data-driven post ("India mein sabse zyada kaunse PDF tools search hote hain")
- Backlink gap analysis competitors ke saath (OpenRush `compare_backlink_gap`, credits ke baad)

## 7. AI search (AEO/GEO)

- Short, direct answers FAQ mein (AI overviews/ChatGPT ke citations ke liye)
- Clear brand + "kya karta hai" statement home par
- Later: `inspect_ai_visibility` se track

## 8. Measurement

| KPI | Tool | Target (revise after baseline) |
|-----|------|---------|
| Indexed pages | Search Console | 90%+ of submitted |
| Impressions / clicks / CTR / position | Search Console | weekly growth |
| Top keyword rank | Rank tracker | Tier 3 top 10 in 3–4 months |
| Organic sessions | Plausible/GA4 | 50K/mo @ month 6 (stretch) |
| Tool completion | custom event | > 60% |

## 9. Timeline realism

New domain ko Google par trust banne mein typically **3–6 mahine** lagte hain. Tier 3 long-tail se pehle 2–3 mahine mein traction mil sakta hai; head keywords 12+ mahine. Ye anumaan hai, guarantee nahi.

## 10. Decision: separate pages for "jpg to pdf" and "image to pdf"

Owner wants both keywords. Decision: **two pages, one engine.**

- `/jpg-to-pdf` targets the exact, high-volume query (report: 4.8M, India). Copy is JPG/phone-photo focused.
- `/image-to-pdf` targets the broader query (JPG, PNG, WebP, screenshots, mixed formats). Copy covers formats, transparency, screenshots, mixing.
- Rules to avoid cannibalization / duplicate content: different title, H1, intro, FAQ and guide on each page; each page has its own self-canonical (never canonical one to the other); the two pages link to each other (related tools + a guide paragraph); same tool UI/island is fine.
- Same pattern for other sibling queries later (png-to-pdf, photo-to-pdf...): only add a page if the copy can be genuinely different and useful.
- NOT verified: the SERPs for both queries (OpenRush credits were empty). If Google shows the same results for both queries, the intent is the same. After 2-3 months check Search Console: if both pages compete for the same queries and swap rankings, merge them (301 the weaker one to the stronger).

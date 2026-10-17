# 09. Tool Priority: Pehle kaunse tools banayein

Approach: hum brand/head keyword ("ilovepdf", "pdf converter") par rank nahi karenge. Hum **user ki problem wali queries** par rank karenge, jaise "pdf ka size 100kb kaise kare", "photo ko pdf kaise banaye", "2 pdf ko ek kaise karein".

> Honest note: report ke volume (4.8M, 4.0M...) head keywords ke hain. Problem-query ka alag volume mere paas verified nahi hai (OpenRush credits khatam). Neeche ka scoring **meri reasoning** hai. Launch se pehle top problem queries ko Keyword Planner/Ahrefs se check karna hai.

## 1. Tool chunne ke 5 criteria

| # | Criteria | Matlab |
|---|----------|--------|
| 1 | **Problem ka dard** | User ke paas deadline/form/exam hai, kaam na ho to atak jaata hai (compress for 100KB upload). Aise users download karke wapas aate hain |
| 2 | **Long-tail ki sankhya** | Ek tool ke neeche kitne alag problem queries ban sakte hain (50KB/100KB/200KB, Aadhaar, marksheet...) |
| 3 | **Demand** | Report ka volume (head term, proxy ke taur par) |
| 4 | **Build cost / risk** | Browser mein ho sakta hai ya server + quality risk |
| 5 | **Competition ki kamzori** | Competitors ke generic pages vs hamara specific page. (Meri guess, SERP check baaki) |

## 2. Scoring (1–5, zyada = behtar; cost ke liye 5 = sasta)

| Tool | Dard | Long-tail | Demand | Cost | Comp. | **Total /25** |
|------|:---:|:---:|:---:|:---:|:---:|:---:|
| **Compress PDF** (target KB) | 5 | 5 | 3 (1.6M) | 3 | 4 | **20** |
| **JPG to PDF** (photo/form) | 5 | 4 | 5 (4.8M) | 5 | 3 | **22** |
| **Merge PDF** | 4 | 3 | 3 (1.7M) | 5 | 3 | **18** |
| **PDF to JPG** | 3 | 3 | 4 (3.4M) | 5 | 3 | **18** |
| **Split / Remove / Extract pages** | 4 | 4 | – | 5 | 4 | **17+** |
| **PDF to Word** | 5 | 4 | 4 (4.0M) | 1 | 2 | **16** |
| **Word to PDF** | 2 | 2 | 3 (2.5M) | 3 | 2 | **12** |
| Unlock PDF (password pata ho) | 4 | 3 | – | 3 | 4 | 14+ |
| Sign PDF | 4 | 3 | – | 4 | 3 | 14+ |
| Rotate / Page numbers / Watermark | 3 | 2 | – | 5 | 3 | 13+ |
| OCR | 4 | 3 | – | 2 | 3 | 12+ |
| AI tools | ? | ? | ? | 2 | ? | skip |

"–" = report mein volume nahi, isliye is column ka score ek andaza hai.

## 3. Faisla

### Wave 1: pehle launch (sab browser mein, server ki zaroorat nahi)

1. **JPG to PDF** — sabse zyada demand (4.8M), asaan, aur "photo ko pdf kaise banaye", "form ke liye photo pdf" jaisi problem queries.
2. **Compress PDF (target size ke saath)** — India ki sabse specific problem: 50KB / 100KB / 200KB / 500KB / 1MB upload limit. Yahi hamara sabse bada SEO moka hai.
3. **Merge PDF** — "2 pdf ko ek kaise karein", asaan, accha demand.
4. **PDF to JPG** — 3.4M demand, browser mein hota hai.
5. **Split + Remove pages + Extract pages** — ek hi engine (pdf-lib), 3 alag problem pages ("pdf se page delete", "pdf ka ek page alag karo"). Kam mehnat, zyada pages.

Kyun: 5 tools ke 7 pages, sab client-side, ek hi code base. Server cost zero. Jaldi launch, jaldi Google ko data milega.

### Wave 2: jab server aur quality ready ho

6. **PDF to Word** — demand aur dard dono bade ("pdf edit kaise karein"), par sabse mushkil. Pehle 20 files par quality benchmark, phir beta label ke saath.
7. **Word to PDF** — demand hai (2.5M) par problem kam hai (Word mein "Save as PDF" hota hai), is liye 4 se neeche. Server (Gotenberg) chahiye.
8. Sign PDF, Unlock PDF, Rotate, Page numbers, Watermark.

### Wave 3: baaki

OCR, PPT/Excel conversions, Protect, Compare, Redact, HTML to PDF...

### Skip abhi

AI Summarizer/Translate/PDF to Markdown (report ke mutabiq usage data nahi hai).

## 4. Pichle plan se kya badla

| Pehle (doc 06/07) | Ab |
|-------------------|-----|
| MVP = report ke top 6 by volume, Word to PDF aur PDF to Word shamil | MVP = 5 browser-only tools. Word to PDF aur PDF to Word Wave 2 mein |
| Server pehle hafte se | Server Wave 2 tak nahi chahiye |
| Compress ka rank 6 | Compress ka rank 2, aur **sabse bada SEO bet** |

## 5. Har Wave-1 tool ke problem-query pages (draft, validate karna hai)

**Compress PDF**
- pdf ka size kam kaise kare / reduce pdf file size
- compress pdf to 50kb, 100kb, 200kb, 500kb, 1mb, 2mb
- pdf size kam karo bina quality kharab kiye
- aadhaar / marksheet / resume pdf compress karo
- whatsapp / email ke liye pdf chhota karo

**JPG to PDF**
- photo ko pdf kaise banaye / mobile mein photo se pdf
- multiple photos ko ek pdf mein
- jpg to pdf under 100kb / 200kb
- signature / photo ko pdf mein convert karo form ke liye
- png / heic to pdf

**Merge PDF**
- 2 pdf ko ek kaise karein / combine pdf files
- multiple pdf ko ek pdf mein jodo
- merge pdf in mobile / without software

**PDF to JPG**
- pdf ko photo mein kaise badle
- pdf page ko image mein save karo
- pdf to jpg high quality

**Split / Remove / Extract**
- pdf se ek page kaise nikale / extract page
- pdf ke pages delete kaise karein
- pdf ko alag alag files mein todo

> Rule: Har page par unique, helpful content aur real tool. Sirf title badal kar pages banana = thin content, penalty ka risk.

## 5b. Owner ne baad mein add kiye (Wave 1b)

- **Text to PDF** (`/text-to-pdf`): problem queries jaise "txt file ko pdf kaise banaye", "hindi text to pdf", "text ko pdf me convert karo", "notes ka pdf banao". Browser-only, Hindi support ke saath. Build ho chuka hai, dekho docs/12.

## 6. Agla kadam

1. In ~25 problem queries ka volume + SERP check (Keyword Planner ya OpenRush refill ke baad).
2. Jo queries mein SERP par generic/purane pages rank karte hain, unhe pehle banao.
3. Phir Wave 1 ka build shuru.

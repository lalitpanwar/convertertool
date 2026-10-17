import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { detectNeeds, embedFontChains, type FontChains, type StyleKey } from './fonts';
import type { TextMargin, TextPageSize, TextPdfOptions } from './text-config';

export type { TextAlign, TextMargin, TextOrientation, TextPageSize, TextPdfOptions } from './text-config';
export { DEFAULT_TEXT_OPTIONS } from './text-config';

const PAGE_PT: Record<TextPageSize, [number, number]> = { a4: [595.28, 841.89], letter: [612, 792] };
const MARGIN_PT: Record<TextMargin, number> = { none: 0, small: 40, normal: 60, big: 80 };
/** Noto font metrics (em): ascent, and ascent + descent */
const ASCENT = 1.069;
const CONTENT = 1.362;
const HEADING_SCALE = [1.9, 1.55, 1.3, 1.15, 1.05, 1];
const INK: [number, number, number] = [0.09, 0.09, 0.11];
const QUOTE_INK: [number, number, number] = [0.33, 0.33, 0.38];

// ---------------------------------------------------------------- blocks

interface Span {
  text: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
  underline?: boolean;
  strike?: boolean;
}

interface Block {
  spans: Span[];
  size: number;
  lineH: number;
  /** left edge of the text, measured from the margin */
  indent: number;
  /** bullet or number drawn to the left of the text */
  marker?: string;
  markerX?: number;
  gapBefore: number;
  gapAfter: number;
  keepWithNext?: boolean;
  quote?: boolean;
  code?: boolean;
  forceBold?: boolean;
  /** may be justified (not for headings and code) */
  justify?: boolean;
  color?: [number, number, number];
  /** this paragraph's own alignment (from the editor); otherwise the document default */
  align?: 'left' | 'center' | 'right' | 'justify';
}

type Item = { kind: 'block'; block: Block } | { kind: 'blank'; h: number } | { kind: 'hr'; h: number };

const plain = (text: string): Span[] => [{ text, bold: false, italic: false, code: false }];

/** Inline Markdown: `code`, **bold**, __bold__, *italic*, _italic_. Unclosed markers stay as typed. */
function parseInline(src: string, base: { bold: boolean; italic: boolean }): Span[] {
  const out: Span[] = [];
  let buf = '';
  let i = 0;
  const flush = () => {
    if (buf) out.push({ text: buf, bold: base.bold, italic: base.italic, code: false });
    buf = '';
  };
  const findClose = (m: string, from: number) => {
    for (let j = from; j < src.length; j++) {
      if (!src.startsWith(m, j)) continue;
      const prev = src[j - 1];
      const next = src[j + m.length];
      if (!prev || /\s/.test(prev)) continue;
      if (m[0] === '_' && next && /[A-Za-z0-9]/.test(next)) continue;
      if (m === '*' && next === '*') continue;
      return j;
    }
    return -1;
  };
  const tryMarker = (): boolean => {
    for (const m of ['**', '__', '*', '_']) {
      if (!src.startsWith(m, i)) continue;
      const prev = src[i - 1];
      const next = src[i + m.length];
      if (!next || /\s/.test(next)) return false; // an opening marker must touch the text
      if (m[0] === '_' && prev && /[A-Za-z0-9]/.test(prev)) return false; // snake_case
      const j = findClose(m, i + m.length);
      if (j <= i + m.length) return false;
      flush();
      out.push(...parseInline(src.slice(i + m.length, j), m.length === 2 ? { ...base, bold: true } : { ...base, italic: true }));
      i = j + m.length;
      return true;
    }
    return false;
  };
  while (i < src.length) {
    const c = src[i];
    if (c === '\\' && i + 1 < src.length && '\\`*_#-+>[]()'.includes(src[i + 1])) {
      buf += src[i + 1];
      i += 2;
      continue;
    }
    if (c === '`') {
      const j = src.indexOf('`', i + 1);
      if (j > i + 1) {
        flush();
        out.push({ text: src.slice(i + 1, j), bold: base.bold, italic: base.italic, code: true });
        i = j + 1;
        continue;
      }
    }
    if ((c === '*' || c === '_') && tryMarker()) continue;
    buf += c;
    i++;
  }
  flush();
  return out;
}

function parsePlain(text: string, size: number, spacing: number): Item[] {
  const lineH = size * spacing;
  return text.split('\n').map((line): Item =>
    line.trim() === ''
      ? { kind: 'blank', h: lineH }
      : { kind: 'block', block: { spans: plain(line), size, lineH, indent: 0, gapBefore: 0, gapAfter: 0, justify: true } },
  );
}

function parseMarkdown(text: string, size: number, spacing: number): Item[] {
  const lineH = size * spacing;
  const items: Item[] = [];
  let inCode = false;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      const cs = size * 0.9;
      items.push({ kind: 'block', block: { spans: [{ text: raw, bold: false, italic: false, code: true }], size: cs, lineH: cs * 1.4, indent: 8, gapBefore: 0, gapAfter: 0, code: true } });
      continue;
    }
    if (line.trim() === '') {
      items.push({ kind: 'blank', h: lineH });
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      items.push({ kind: 'hr', h: lineH });
      continue;
    }
    let m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) {
      const hs = size * HEADING_SCALE[m[1].length - 1];
      items.push({
        kind: 'block',
        block: { spans: parseInline(m[2], { bold: true, italic: false }), size: hs, lineH: hs * 1.3, indent: 0, gapBefore: hs * 0.7, gapAfter: hs * 0.25, keepWithNext: true, forceBold: true },
      });
      continue;
    }
    m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (m) {
      const level = Math.min(4, Math.floor(m[1].replace(/\t/g, '  ').length / 2));
      const markerX = level * 20;
      const marker = /\d/.test(m[2]) ? m[2] : '•';
      // room for the marker: at least 18 pt, more for numbers like "10." (about 0.62 em per character)
      const hang = Math.max(18, marker.length * size * 0.62 + 6);
      items.push({
        kind: 'block',
        block: {
          spans: parseInline(m[3], { bold: false, italic: false }),
          size,
          lineH,
          indent: markerX + hang,
          marker,
          markerX,
          gapBefore: 0,
          gapAfter: 0,
          justify: true,
        },
      });
      continue;
    }
    m = /^>\s?(.*)$/.exec(line);
    if (m) {
      items.push({
        kind: 'block',
        block: { spans: parseInline(m[1], { bold: false, italic: true }), size, lineH, indent: 18, gapBefore: 0, gapAfter: 0, quote: true, color: QUOTE_INK },
      });
      continue;
    }
    items.push({ kind: 'block', block: { spans: parseInline(line, { bold: false, italic: false }), size, lineH, indent: 0, gapBefore: 0, gapAfter: 0, justify: true } });
  }
  return items;
}

const styleKeyOf = (sp: Span, forceBold?: boolean): StyleKey =>
  (sp.bold || forceBold) && sp.italic ? 'boldItalic' : sp.bold || forceBold ? 'bold' : sp.italic ? 'italic' : 'regular';

/** Which font styles / mono / characters a document uses (so only the needed fonts are loaded). */
function scanItems(items: Item[]) {
  const styles = new Set<StyleKey>(['regular']);
  let mono = false;
  let probe = '';
  for (const it of items) {
    if (it.kind !== 'block') continue;
    const b = it.block;
    if (b.code) mono = true;
    if (b.marker) probe += b.marker;
    for (const sp of b.spans) {
      styles.add(styleKeyOf(sp, b.forceBold));
      if (sp.code) mono = true;
      probe += sp.text;
    }
  }
  return { styles: [...styles], mono, probe };
}

// ---------------------------------------------------------------- rich text (the editor's HTML)

interface InlineStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  code: boolean;
}

const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'HR']);

function alignOf(el: HTMLElement): Block['align'] {
  const a = (el.style?.textAlign || el.getAttribute('align') || '').toLowerCase();
  if (a === 'center' || a === 'right' || a === 'justify') return a;
  if (a === 'left' || a === 'start') return 'left';
  return undefined;
}

/** The text of one block split into lines (a <br> starts a new line), each line a list of styled spans. */
function inlineLines(parent: Node, base: InlineStyle): Span[][] {
  const lines: Span[][] = [[]];
  const walk = (node: Node, c: InlineStyle) => {
    if (node.nodeType === 3) {
      const t = (node.textContent ?? '').replace(/\u00a0/g, ' ').replace(/[\r\n\t]+/g, ' ');
      if (t) lines[lines.length - 1].push({ text: t, bold: c.bold, italic: c.italic, underline: c.underline, strike: c.strike, code: c.code });
      return;
    }
    if (node.nodeType !== 1) return;
    const e = node as HTMLElement;
    const tag = e.tagName;
    if (tag === 'BR') {
      lines.push([]);
      return;
    }
    const n = { ...c };
    if (tag === 'B' || tag === 'STRONG') n.bold = true;
    if (tag === 'I' || tag === 'EM') n.italic = true;
    if (tag === 'U') n.underline = true;
    if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL') n.strike = true;
    if (tag === 'CODE' || tag === 'TT') n.code = true;
    const st = e.style;
    if (st) {
      const fw = st.fontWeight;
      if (fw === 'bold' || fw === 'bolder' || Number(fw) >= 600) n.bold = true;
      if (st.fontStyle === 'italic') n.italic = true;
      const td = st.textDecorationLine || st.textDecoration || '';
      if (td.includes('underline')) n.underline = true;
      if (td.includes('line-through')) n.strike = true;
    }
    e.childNodes.forEach((ch) => walk(ch, n));
  };
  parent.childNodes.forEach((ch) => walk(ch, base));
  return lines;
}

const blankLine = (ln: Span[]) => ln.every((sp) => sp.text.trim() === '');

/**
 * Turn the editor's HTML (p, div, h1-h3, ul/ol/li, blockquote, pre, hr, br, b/i/u/s/code, text-align)
 * into the same blocks the plain and Markdown parsers make.
 */
function parseHtml(html: string, size: number, spacing: number): Item[] {
  if (typeof DOMParser === 'undefined') return parsePlain(html, size, spacing);
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${html}</body>`, 'text/html');
  const root = doc.body;
  const lineH = size * spacing;
  const items: Item[] = [];
  const base: InlineStyle = { bold: false, italic: false, underline: false, strike: false, code: false };

  const para = (spans: Span[], extra: Partial<Block> = {}): Block => ({ spans, size, lineH, indent: 0, gapBefore: 0, gapAfter: 0, justify: true, ...extra });
  const quoteExtra: Partial<Block> = { indent: 18, quote: true, color: QUOTE_INK, justify: false };

  /** emit one block per line; empty lines become vertical space */
  const emit = (container: Node, make: (spans: Span[]) => Block, ctx: InlineStyle) => {
    let lines = inlineLines(container, ctx);
    if (lines.length > 1 && blankLine(lines[lines.length - 1])) lines = lines.slice(0, -1); // the editor's trailing <br>
    for (const ln of lines) {
      if (blankLine(ln)) items.push({ kind: 'blank', h: lineH });
      else items.push({ kind: 'block', block: make(ln) });
    }
  };

  const heading = (el: HTMLElement, level: number) => {
    const hs = size * HEADING_SCALE[Math.min(level, 6) - 1];
    const align = alignOf(el);
    emit(
      el,
      (spans) => ({ ...para(spans), size: hs, lineH: hs * 1.3, gapBefore: hs * 0.7, gapAfter: hs * 0.25, keepWithNext: true, forceBold: true, justify: false, align }),
      { ...base, bold: true },
    );
  };

  const list = (el: HTMLElement, depth: number) => {
    const ordered = el.tagName === 'OL';
    let n = 0;
    el.childNodes.forEach((ch) => {
      if (ch.nodeType !== 1) return;
      const li = ch as HTMLElement;
      if (li.tagName === 'UL' || li.tagName === 'OL') {
        list(li, depth + 1);
        return;
      }
      if (li.tagName !== 'LI') return;
      n++;
      const markerX = Math.min(depth, 4) * 20;
      const marker = ordered ? `${n}.` : '\u2022';
      const hang = Math.max(18, marker.length * size * 0.62 + 6);
      const content = li.cloneNode(true) as HTMLElement;
      content.querySelectorAll('ul,ol').forEach((x) => x.remove());
      const align = alignOf(li) ?? alignOf(el);
      let first = true;
      emit(content, (spans) => {
        const mk = first ? marker : undefined;
        first = false;
        return para(spans, { indent: markerX + hang, marker: mk, markerX, align });
      }, base);
      li.querySelectorAll(':scope > ul, :scope > ol').forEach((sub) => list(sub as HTMLElement, depth + 1));
    });
  };

  const block = (el: HTMLElement, quote: boolean) => {
    const tag = el.tagName;
    if (tag === 'UL' || tag === 'OL') return list(el, 0);
    if (tag === 'HR') {
      items.push({ kind: 'hr', h: lineH });
      return;
    }
    if (tag === 'PRE') {
      const cs = size * 0.9;
      for (const line of (el.textContent ?? '').replace(/\n$/, '').split('\n')) {
        items.push({ kind: 'block', block: { spans: [{ text: line, bold: false, italic: false, code: true }], size: cs, lineH: cs * 1.4, indent: 8, gapBefore: 0, gapAfter: 0, code: true } });
      }
      return;
    }
    if (tag === 'BLOCKQUOTE') return walk(el, true);
    if (/^H[1-6]$/.test(tag)) return heading(el, Number(tag[1]));
    if ([...el.children].some((c) => BLOCK_TAGS.has(c.tagName))) return walk(el, quote); // a div holding blocks
    const align = alignOf(el);
    emit(el, (spans) => para(spans, { ...(quote ? quoteExtra : {}), align }), base);
  };

  const walk = (container: Element, quote: boolean) => {
    let buf: Node[] = [];
    const flush = () => {
      if (!buf.length) return;
      const tmp = doc.createElement('div');
      buf.forEach((n) => tmp.appendChild(n.cloneNode(true)));
      buf = [];
      emit(tmp, (spans) => para(spans, quote ? quoteExtra : {}), base);
    };
    container.childNodes.forEach((node) => {
      if (node.nodeType === 1 && BLOCK_TAGS.has((node as Element).tagName)) {
        flush();
        block(node as HTMLElement, quote);
      } else if (node.nodeType === 3 && !(node.textContent ?? '').trim() && buf.length === 0) {
        /* whitespace between blocks */
      } else buf.push(node);
    });
    flush();
  };

  walk(root, false);
  return items;
}

// ---------------------------------------------------------------- measuring and breaking

interface Run {
  text: string;
  font: PDFFont;
  width: number;
}

interface Token {
  /** original text (needed to split an over-long word) */
  text: string;
  space: boolean;
  size: number;
  chain: PDFFont[];
  runs: Run[];
  width: number;
  underline?: boolean;
  strike?: boolean;
}

interface Line {
  tokens: Token[];
  width: number;
}

class Measurer {
  replaced = 0;
  private ids = new WeakMap<PDFFont, number>();
  private nextId = 1;
  private sets = new WeakMap<PDFFont, Set<number>>();
  private widths = new Map<string, number>();

  private id(f: PDFFont) {
    let v = this.ids.get(f);
    if (v === undefined) {
      v = this.nextId++;
      this.ids.set(f, v);
    }
    return v;
  }

  private has(f: PDFFont, cp: number) {
    let s = this.sets.get(f);
    if (!s) {
      s = new Set(f.getCharacterSet());
      this.sets.set(f, s);
    }
    return s.has(cp);
  }

  width(font: PDFFont, text: string, size: number) {
    const key = `${this.id(font)}|${size}|${text}`;
    let w = this.widths.get(key);
    if (w === undefined) {
      w = font.widthOfTextAtSize(text, size);
      this.widths.set(key, w);
    }
    return w;
  }

  /** Split text into runs, one font per run, choosing the first font in the chain that has each character. */
  runs(text: string, chain: PDFFont[], size: number): Run[] {
    const runs: Run[] = [];
    for (const ch of text) {
      let cp = ch.codePointAt(0)!;
      if (cp === 0xa0) cp = 0x20;
      if (cp < 0x20 || cp === 0x200b || cp === 0xfeff) continue;
      let out = String.fromCodePoint(cp);
      let font: PDFFont | undefined = cp === 0x20 ? chain[0] : chain.find((f) => this.has(f, cp));
      if (!font) {
        if (cp === 0x200c || cp === 0x200d) continue; // joiners are invisible: drop when no font has them
        font = chain[0];
        out = '?';
        this.replaced++;
      }
      const last = runs[runs.length - 1];
      if (last && last.font === font) last.text += out;
      else runs.push({ text: out, font, width: 0 });
    }
    for (const r of runs) r.width = this.width(r.font, r.text, size);
    return runs;
  }
}

function makeToken(m: Measurer, text: string, space: boolean, chain: PDFFont[], size: number, deco?: { underline?: boolean; strike?: boolean }): Token {
  const runs = m.runs(text, chain, size);
  return { text, space, size, chain, runs, width: runs.reduce((a, r) => a + r.width, 0), underline: deco?.underline, strike: deco?.strike };
}

/** Cut a word that is wider than a whole line into pieces (first piece fits `firstAvail`, the rest fit `maxW`). */
function splitWord(m: Measurer, t: Token, firstAvail: number, maxW: number): Token[] {
  const pieces: Token[] = [];
  let avail = Math.max(firstAvail, 1);
  let cur = '';
  for (const ch of t.text) {
    const test = cur + ch;
    const w = makeToken(m, test, false, t.chain, t.size).width;
    if (w > avail && cur !== '') {
      pieces.push(makeToken(m, cur, false, t.chain, t.size, t));
      cur = ch;
      avail = maxW;
    } else {
      cur = test;
    }
  }
  if (cur) pieces.push(makeToken(m, cur, false, t.chain, t.size, t));
  return pieces;
}

function breakLines(m: Measurer, tokens: Token[], maxW: number): Line[] {
  const lines: Line[] = [];
  let cur: Token[] = [];
  let w = 0;
  let first = true;
  const flush = () => {
    while (cur.length && cur[cur.length - 1].space) w -= cur.pop()!.width;
    lines.push({ tokens: cur, width: w });
    cur = [];
    w = 0;
    first = false;
  };
  for (const t of tokens) {
    if (t.space) {
      if (cur.length === 0 && !first) continue; // no indentation on wrapped lines
      cur.push(t);
      w += t.width;
      continue;
    }
    if (w + t.width <= maxW + 0.01) {
      cur.push(t);
      w += t.width;
      continue;
    }
    if (cur.some((x) => !x.space)) flush(); // wrap
    if (t.width <= maxW - w + 0.01) {
      cur.push(t);
      w += t.width;
      continue;
    }
    const pieces = splitWord(m, t, maxW - w, maxW);
    pieces.forEach((p, idx) => {
      cur.push(p);
      w += p.width;
      if (idx < pieces.length - 1) flush();
    });
  }
  if (cur.length || lines.length === 0) flush();
  return lines;
}

// ---------------------------------------------------------------- the document

export interface TextPdfResult {
  bytes: Uint8Array;
  pageCount: number;
  /** characters no font could draw (emoji, rare scripts); they became "?" */
  replaced: number;
}

/** 'text' = plain text (or Markdown when opts.markdown), 'html' = the rich-text editor's HTML */
export type TextKind = 'text' | 'html';

export async function buildTextPdf(input: string, opts: TextPdfOptions, kind: TextKind = 'text'): Promise<TextPdfResult> {
  const isHtml = kind === 'html';
  const text = isHtml ? input : input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
  const title = opts.title.trim();
  const size = opts.fontSize;

  // 1) the document as blocks
  const items: Item[] = [];
  if (title) {
    const ts = size * 1.9;
    items.push({ kind: 'block', block: { spans: [{ text: title, bold: true, italic: false, code: false }], size: ts, lineH: ts * 1.3, indent: 0, gapBefore: 0, gapAfter: ts * 0.2, forceBold: true } });
    items.push({ kind: 'hr', h: size * opts.lineSpacing });
  }
  items.push(...(isHtml ? parseHtml(text, size, opts.lineSpacing) : opts.markdown ? parseMarkdown(text, size, opts.lineSpacing) : parsePlain(text, size, opts.lineSpacing)));

  // 2) only the fonts it needs (Hindi / symbols / bold / italic / mono)
  const used = scanItems(items);
  const doc = await PDFDocument.create();
  const needs = detectNeeds(used.probe);
  const main: FontChains = await embedFontChains(doc, opts.font, { ...needs, styles: used.styles });
  // inline `code` and code blocks use the monospace family, whatever the body font is
  const mono: FontChains = opts.font === 'mono' ? main : used.mono ? await embedFontChains(doc, 'mono', { ...needs, styles: ['regular', 'bold'] }) : main;

  const [bw, bh] = PAGE_PT[opts.pageSize];
  const [pageW, pageH] = opts.orientation === 'landscape' ? [bh, bw] : [bw, bh];
  const margin = MARGIN_PT[opts.margin];
  const contentW = pageW - margin * 2;

  const m = new Measurer();
  const baseLineH = size * opts.lineSpacing;

  let page: PDFPage = doc.addPage([pageW, pageH]);
  let y = pageH - margin;
  let atTop = true;
  const newPage = () => {
    page = doc.addPage([pageW, pageH]);
    y = pageH - margin;
    atTop = true;
  };

  const styleOf = styleKeyOf;

  const tokenize = (b: Block): Token[] => {
    const tokens: Token[] = [];
    for (const sp of b.spans) {
      const st = styleOf(sp, b.forceBold);
      const chain = sp.code ? mono[st] : main[st];
      const tsize = sp.code && !b.code ? b.size * 0.92 : b.size;
      for (const part of sp.text.split(/(\s+)/)) {
        if (part === '') continue;
        tokens.push(makeToken(m, part, /^\s+$/.test(part), chain, tsize, { underline: sp.underline, strike: sp.strike }));
      }
    }
    return tokens;
  };

  const drawLine = (tokens: Token[], x: number, baseline: number, extraPerSpace: number, color: [number, number, number]) => {
    let cx = x;
    let pending: { text: string; font: PDFFont; size: number; x: number } | null = null;
    const emit = () => {
      if (pending) page.drawText(pending.text, { x: pending.x, y: baseline, size: pending.size, font: pending.font, color: rgb(...color) });
      pending = null;
    };
    const rule = (x1: number, x2: number, yy: number, tsize: number) =>
      page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: Math.max(0.6, tsize * 0.05), color: rgb(...color) });
    for (const t of tokens) {
      const start = cx;
      for (const r of t.runs) {
        if (pending && extraPerSpace === 0 && pending.font === r.font && pending.size === t.size) pending.text += r.text;
        else {
          emit();
          pending = { text: r.text, font: r.font, size: t.size, x: cx };
        }
        cx += r.width;
      }
      if (t.space && extraPerSpace > 0) {
        emit();
        cx += extraPerSpace;
      }
      if (t.underline) rule(start, cx, baseline - t.size * 0.13, t.size);
      if (t.strike) rule(start, cx, baseline + t.size * 0.3, t.size);
    }
    emit();
  };

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];

    if (it.kind === 'blank') {
      if (y - it.h < margin) newPage();
      else if (!atTop) y -= it.h;
      continue;
    }
    if (it.kind === 'hr') {
      if (y - it.h < margin) newPage();
      page.drawLine({ start: { x: margin, y: y - it.h / 2 }, end: { x: margin + contentW, y: y - it.h / 2 }, thickness: 0.8, color: rgb(0.75, 0.75, 0.78) });
      y -= it.h;
      atTop = false;
      continue;
    }

    const b = it.block;
    const lines = breakLines(m, tokenize(b), contentW - b.indent);
    if (!atTop) y -= b.gapBefore;
    const need = b.lineH * (b.keepWithNext ? lines.length : 1) + (b.keepWithNext ? baseLineH : 0);
    if (!atTop && y - need < margin) newPage();

    const x0 = margin + b.indent;
    const color = b.color ?? INK;
    lines.forEach((ln, li) => {
      if (y - b.lineH < margin) newPage();
      const baseline = y - (b.lineH - CONTENT * b.size) / 2 - ASCENT * b.size;
      if (b.code) page.drawRectangle({ x: margin, y: y - b.lineH, width: contentW, height: b.lineH, color: rgb(0.95, 0.95, 0.96) });
      if (b.quote) page.drawRectangle({ x: margin + 4, y: y - b.lineH, width: 2.5, height: b.lineH, color: rgb(0.78, 0.78, 0.82) });
      if (li === 0 && b.marker) {
        const mk = makeToken(m, b.marker, false, main.regular, b.size);
        drawLine([mk], margin + (b.markerX ?? 0), baseline, 0, color);
      }
      // alignment: this paragraph's own choice, else the document default (headings stay left)
      const align = b.align ?? (b.justify ? opts.align : 'left');
      const avail = contentW - b.indent;
      let shift = 0;
      let extra = 0;
      if (align === 'center') shift = Math.max(0, (avail - ln.width) / 2);
      else if (align === 'right') shift = Math.max(0, avail - ln.width);
      else if (align === 'justify' && !b.code && li < lines.length - 1) {
        // justify every line of a paragraph except its last
        const firstWord = ln.tokens.findIndex((t) => !t.space);
        const gaps = ln.tokens.slice(firstWord + 1).filter((t) => t.space).length;
        const slack = avail - ln.width;
        if (gaps > 0 && slack > 0 && slack / gaps < b.size * 1.2) extra = slack / gaps;
      }
      drawLine(ln.tokens, x0 + shift, baseline, extra, color);
      y -= b.lineH;
      atTop = false;
    });
    y -= b.gapAfter;
  }

  if (opts.pageNumbers) {
    const pages = doc.getPages();
    const font = main.regular[0];
    pages.forEach((p, i) => {
      const label = `${i + 1} / ${pages.length}`;
      const w = font.widthOfTextAtSize(label, 9);
      p.drawText(label, { x: (pageW - w) / 2, y: Math.max(14, margin / 2 - 3), size: 9, font, color: rgb(0.45, 0.45, 0.5) });
    });
  }

  doc.setTitle(title || 'Text document');
  const bytes = await doc.save();
  return { bytes, pageCount: doc.getPageCount(), replaced: m.replaced };
}

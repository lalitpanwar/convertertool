/**
 * Light helpers for the text editor (they do NOT pull in the PDF engine):
 *  - textToHtml: plain text -> paragraphs
 *  - markdownToHtml: a .md file -> the same rich formatting the editor shows
 */
export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** each line becomes a paragraph, empty lines stay as empty paragraphs */
export function textToHtml(text: string): string {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '    ')
    .split('\n')
    .map((l) => (l.trim() === '' ? '<p><br></p>' : `<p>${escapeHtml(l)}</p>`))
    .join('');
}

/** `code`, **bold**, __bold__, *italic*, _italic_ -> tags (input is escaped first) */
function inlineMd(raw: string): string {
  const parts = raw.split('`');
  return parts
    .map((seg, i) => {
      const t = escapeHtml(seg);
      if (i % 2 === 1 && i < parts.length - 1 + (parts.length % 2 === 0 ? 0 : 0)) return `<code>${t}</code>`;
      return t
        .replace(/\*\*(?=\S)(.+?)(?<=\S)\*\*/g, '<b>$1</b>')
        .replace(/__(?=\S)(.+?)(?<=\S)__/g, '<b>$1</b>')
        .replace(/(?<![*\w])\*(?=[^\s*])(.+?)(?<=[^\s*])\*(?![*\w])/g, '<i>$1</i>')
        .replace(/(?<![\w_])_(?=[^\s_])(.+?)(?<=[^\s_])_(?![\w_])/g, '<i>$1</i>');
    })
    .join('');
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/\t/g, '  ').split('\n');
  let html = '';
  let inCode = false;
  let code: string[] = [];
  // open lists: one tag per nesting level; the last <li> stays open so a deeper list can nest in it
  const open: string[] = [];
  const closeLists = (to = 0) => {
    while (open.length > to) {
      html += `</li></${open.pop()}>`;
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (/^\s*```/.test(line)) {
      closeLists();
      if (inCode) {
        html += `<pre>${escapeHtml(code.join('\n'))}</pre>`;
        code = [];
      }
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(raw);
      continue;
    }
    const li = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) {
      const level = Math.min(4, Math.floor(li[1].length / 2));
      const tag = /\d/.test(li[2]) ? 'ol' : 'ul';
      if (open.length === level + 1) html += '</li>';
      else if (open.length > level + 1) closeLists(level + 1), (html += '</li>');
      while (open.length < level + 1) {
        html += `<${tag}>`;
        open.push(tag);
      }
      html += `<li>${inlineMd(li[3])}`;
      continue;
    }
    closeLists();
    if (line.trim() === '') {
      html += '<p><br></p>';
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      html += '<hr>';
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = Math.min(3, h[1].length);
      html += `<h${lvl}>${inlineMd(h[2])}</h${lvl}>`;
      continue;
    }
    const q = /^>\s?(.*)$/.exec(line);
    if (q) {
      html += `<blockquote>${inlineMd(q[1])}</blockquote>`;
      continue;
    }
    html += `<p>${inlineMd(line)}</p>`;
  }
  if (inCode && code.length) html += `<pre>${escapeHtml(code.join('\n'))}</pre>`;
  closeLists();
  return html;
}

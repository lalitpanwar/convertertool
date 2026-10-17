import type { ToolDef } from '../types';

export const textToPdf: ToolDef = {
  slug: 'text-to-pdf',
  name: 'Text to PDF',
  category: 'convert',
  status: 'live',
  engine: 'client',
  island: 'TextToPdf',
  title: 'Text to PDF: Convert Text to PDF Free, No Signup',
  description:
    'Turn typed or pasted text into a clean PDF. Choose font, size, margins and page numbers, with Hindi support. Free and private.',
  h1: 'Convert text to a neatly formatted PDF',
  intro:
    'Type or paste your text, or upload a .txt file. Pick the font, spacing and margins, check the live preview and download a clean PDF. Hindi and other languages work too.',
  steps: [
    'Type, paste or upload your text.',
    'Choose font, size, margins and page numbers.',
    'Check the preview, then download your PDF.',
  ],
  faqs: [
    {
      q: 'How do I convert text to PDF?',
      a: 'Type or paste your text on this page, adjust the options on the right if you like, and tap Convert to PDF. Your PDF downloads right away.',
    },
    {
      q: 'Can I convert a .txt file to PDF?',
      a: 'Yes. Tap Upload text file and choose a .txt (or .md) file. The text appears in the editor so you can fix it before converting.',
    },
    {
      q: 'Does it work with Hindi text?',
      a: 'Yes. Hindi (Devanagari) text is drawn with a proper font, including joined letters and matras. You can mix Hindi and English in one document.',
    },
    {
      q: 'Can I make headings, lists and bold text?',
      a: 'Turn on Format Markdown. Then lines starting with # become headings, lines starting with - or 1. become lists, and **bold**, *italic* and `code` are styled.',
    },
    {
      q: 'How do I change the font, size and margins?',
      a: 'Use the options panel: three font styles, sizes from 10 to 18 pt, four line spacings, A4 or Letter pages, portrait or landscape, and small, normal or big margins.',
    },
    {
      q: 'Can I see the PDF before I download it?',
      a: 'Yes. Open the Preview tab to see the exact pages. It updates as you change the options.',
    },
    {
      q: 'Is my text uploaded or stored on a server?',
      a: 'No. The PDF is made inside your browser, so your text never leaves your device.',
    },
    {
      q: 'Why did some characters turn into question marks?',
      a: 'Emoji and a few rare symbols are not in the fonts used for the PDF, so they are shown as a question mark. Letters of English, Hindi and most European languages work normally.',
    },
  ],
  related: ['jpg-to-pdf', 'merge-pdf', 'pdf-to-jpg', 'compress-pdf'],
  guide: [
    {
      heading: 'Tips for a PDF that looks good',
      body: 'For letters and notes, 12 pt text with normal line spacing and normal margins is easy to read. Use Justified alignment for long paragraphs, and add a title so the document is easy to recognise. Always check the Preview tab before you download.',
    },
    {
      heading: 'Writing in Hindi',
      body: 'You can type Hindi straight into the editor or paste it from your phone. Mixed lines such as a Hindi sentence with an English name work fine. The rupee sign and common punctuation are supported as well.',
    },
  ],
};

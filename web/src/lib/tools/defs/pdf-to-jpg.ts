import type { ToolDef } from '../types';

export const pdfToJpg: ToolDef = {
  slug: 'pdf-to-jpg',
  name: 'PDF to JPG',
  category: 'convert',
  status: 'live',
  engine: 'client',
  island: 'PdfToJpg',
  title: 'PDF to JPG: Convert PDF to JPG Free, No Signup',
  description:
    'Save PDF pages as JPG images. Pick the pages, choose the quality and download. Free, private, and your PDF never leaves your device.',
  h1: 'Convert PDF pages to JPG images',
  intro:
    'Choose a PDF, tick the pages you want and download them as JPG pictures. One page gives a single JPG, several pages come as one ZIP file.',
  steps: [
    'Choose your PDF file.',
    'Tick the pages you want and pick the quality.',
    'Tap Convert and download the JPG or ZIP.',
  ],
  faqs: [
    {
      q: 'How do I convert a PDF to JPG?',
      a: 'Choose your PDF on this page, select the pages you need and tap Convert. A single page downloads as a JPG, several pages download as a ZIP of JPG files.',
    },
    {
      q: 'Can I save only one page of a PDF as an image?',
      a: 'Yes. Tap the pages you want, or use Select none and tick just one page. You will get a single JPG file.',
    },
    {
      q: 'Which quality should I choose?',
      a: '150 DPI is a good standard for screens and sharing. Use 300 DPI when you plan to print, and 72 DPI when you need small files.',
    },
    {
      q: 'Is my PDF uploaded to a server?',
      a: 'No. The pages are drawn in your browser, so your PDF stays on your device.',
    },
    {
      q: 'Why does it say my PDF is password protected?',
      a: 'Locked PDFs cannot be read here. Remove the password in the app where you opened the PDF, then add the file again.',
    },
    {
      q: 'Can I turn the JPG files back into a PDF?',
      a: 'Yes. Use our JPG to PDF tool, drag the images into the order you want and download one PDF.',
    },
    {
      q: 'Is there a page limit?',
      a: 'No fixed limit, but very long PDFs at 300 DPI need a lot of memory. If your browser slows down, convert fewer pages at a time or use a lower quality.',
    },
  ],
  related: ['jpg-to-pdf', 'merge-pdf', 'compress-pdf', 'split-pdf'],
  guide: [
    {
      heading: 'When to turn a PDF into JPG',
      body: 'Images are easy to post in chats, add to slides or upload where PDF is not accepted. Converting a page to JPG also lets you crop it, mark it up or share a preview without sending the whole document.',
    },
    {
      heading: 'Choosing the right resolution',
      body: 'Resolution is measured in DPI. 72 DPI gives a small file that looks fine on a phone. 150 DPI is sharp on most screens. 300 DPI keeps fine text and details for printing, but the files are much larger.',
    },
  ],
};

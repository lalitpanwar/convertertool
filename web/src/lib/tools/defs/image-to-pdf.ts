import type { ToolDef } from '../types';

/**
 * Broad-intent sibling of /jpg-to-pdf. SAME engine/island, DIFFERENT content.
 * Keep the copy different from jpg-to-pdf.ts (SEO: avoid duplicate pages) and
 * keep both pages linking to each other. See docs/05-seo-strategy.md.
 */
export const imageToPdf: ToolDef = {
  slug: 'image-to-pdf',
  name: 'Image to PDF',
  category: 'convert',
  status: 'live',
  engine: 'client',
  island: 'JpgToPdf',
  fileNoun: 'images',
  title: 'Image to PDF: Convert Image to PDF Free, No Signup',
  description:
    'Convert any image (JPG, PNG or WebP) into a PDF. Mix formats, set page size and margin, free and private. Nothing is uploaded.',
  h1: 'Convert any image to PDF',
  intro:
    'Add JPG, PNG or WebP images, mix them in one go, check the live page preview and download a single PDF. Your images stay on your device.',
  steps: [
    'Add images in any supported format.',
    'Drag to reorder, then set page size and margin.',
    'Download one PDF with every image as a page.',
  ],
  faqs: [
    {
      q: 'Which image formats can I convert to PDF?',
      a: 'JPG, JPEG, PNG and WebP. You can add different formats together and they all end up in the same PDF.',
    },
    {
      q: 'Can I combine a PNG and a JPG in one PDF?',
      a: 'Yes. Mixed formats are fine. Each image becomes its own page, in the order shown on screen.',
    },
    {
      q: 'What happens to transparent PNG images?',
      a: 'Transparent areas are filled with white, like paper, so the page looks clean when you print or share it.',
    },
    {
      q: 'Can I turn a screenshot into a PDF?',
      a: 'Yes. Screenshots are PNG or JPG files, so add them like any other image. Use Fit page size to keep the exact shape of the screenshot.',
    },
    {
      q: 'How do I control the order of pages?',
      a: 'Drag the images, or use Sort by name to arrange them by file name. The number on each thumbnail is its page number.',
    },
    {
      q: 'Does the quality of my images drop?',
      a: 'Images are placed at high quality. Only very large photos are scaled down to keep your browser fast.',
    },
    {
      q: 'Is it free and private?',
      a: 'Yes. There is no signup, and the conversion runs in your browser, so your images are never uploaded.',
    },
  ],
  related: ['jpg-to-pdf', 'merge-pdf', 'compress-pdf', 'pdf-to-jpg'],
  guide: [
    {
      heading: 'Pick the right page size',
      body: 'Use A4 or US Letter when the PDF will be printed or submitted as a document. Choose Fit when you want every page to match its image exactly, which works well for screenshots, receipts and designs.',
    },
    {
      heading: 'Mixing photos, screenshots and scans',
      body: 'Many people have a mix of phone photos, screenshots and scanned pages. Add them all together, drag them into the order you need and convert once. If you only have JPG photos, our JPG to PDF page covers tips that are specific to phone cameras.',
    },
  ],
};

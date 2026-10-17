import type { ToolDef } from '../types';

export const mergePdf: ToolDef = {
  slug: 'merge-pdf',
  name: 'Merge PDF',
  category: 'organize',
  status: 'live',
  engine: 'client',
  island: 'MergePdf',
  title: 'Merge PDF: Combine PDF Files into One, Free',
  description:
    'Combine two or more PDFs into a single file. Reorder them, merge in seconds, no signup, and files never leave your device.',
  h1: 'Merge PDF',
  intro:
    'Combine PDF files into one document. Add your PDFs, see a preview of each, put them in the right order and download a single file. Everything happens in your browser, so nothing is uploaded.',
  steps: [
    'Choose two or more PDF files.',
    'Check the previews and drag to set the order.',
    'Tap Merge PDF and download.',
  ],
  faqs: [
    {
      q: 'How do I combine two PDF files into one?',
      a: 'Select both PDFs on this page, check the order, then tap Merge PDF. The combined file downloads right away.',
    },
    {
      q: 'Can I change the order of the files?',
      a: 'Yes. Drag a PDF to a new place (on a phone, press and hold it first), or tap its number and pick a position. The final PDF follows the same order from first to last.',
    },
    {
      q: 'Can I merge PDFs on my phone?',
      a: 'Yes. It works in the browser on Android and iPhone. Choose files from your phone storage or from the Files app.',
    },
    {
      q: 'Are my PDFs uploaded anywhere?',
      a: 'No. Merging runs on your device, so your documents stay private.',
    },
    {
      q: 'Why does it say a file is password protected?',
      a: 'Locked PDFs cannot be merged. Remove the password in the app you used to create it, then add the file again.',
    },
    {
      q: 'Will the merged PDF be too big for a form upload?',
      a: 'The size is roughly the sum of your files. If a site has a size limit, use our Compress PDF tool on the merged file.',
    },
  ],
  related: ['compress-pdf', 'split-pdf', 'jpg-to-pdf', 'pdf-to-jpg'],
  guide: [
    {
      heading: 'When to merge PDFs',
      body: 'Job and exam portals often ask for all documents in one file: ID proof, certificates and a resume. Merging them into one PDF keeps everything together and avoids multiple uploads.',
    },
    {
      heading: 'Tips for a tidy merged file',
      body: 'Put the most important document first, name your files clearly before adding them, and check the page count after merging. If you only have photos of documents, turn them into a PDF with the JPG to PDF tool first.',
    },
  ],
};

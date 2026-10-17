import type { ToolDef } from '../types';

export const jpgToPdf: ToolDef = {
  slug: 'jpg-to-pdf',
  name: 'JPG to PDF',
  category: 'convert',
  status: 'live',
  engine: 'client',
  island: 'JpgToPdf',
  title: 'JPG to PDF: Convert JPG to PDF Free, No Signup',
  description:
    'Turn photos into one PDF in seconds. Works on mobile, no signup, and your images never leave your device.',
  h1: 'Convert JPG photos to PDF',
  intro:
    'Select your photos, put them in order and download a single PDF. It runs inside your browser, so your images are never uploaded.',
  steps: [
    'Choose your photos from gallery, camera or files.',
    'Arrange the order and pick page size.',
    'Tap Convert and download your PDF.',
  ],
  faqs: [
    {
      q: 'How do I convert a photo to PDF on my phone?',
      a: 'Open this page in your phone browser, tap Choose photos, select one or more images, then tap Convert to PDF. The PDF downloads to your phone.',
    },
    {
      q: 'Can I combine multiple photos into one PDF?',
      a: 'Yes. Add as many photos as you like, reorder them with the arrow buttons, and they become pages of a single PDF.',
    },
    {
      q: 'Are my photos uploaded to a server?',
      a: 'No. The conversion happens in your browser, so your photos stay on your device.',
    },
    {
      q: 'Which image formats are supported?',
      a: 'JPG, JPEG, PNG and WebP images work. Photos taken sideways on a phone are rotated correctly.',
    },
    {
      q: 'How do I keep the PDF small for a form upload?',
      a: 'Convert first, then use our Compress PDF tool and choose a target size such as 100 KB or 200 KB.',
    },
    {
      q: 'Is there a limit on the number of photos?',
      a: 'There is no fixed limit. Very large batches depend on your device memory, so split big batches if your browser slows down.',
    },
  ],
  related: ['image-to-pdf', 'compress-pdf', 'merge-pdf', 'pdf-to-jpg'],
  guide: [
    {
      heading: 'When do you need to convert JPG to PDF?',
      body: 'Many online forms, job portals and exam sites accept documents only as a PDF. If you have a photo of a certificate, ID or signed page, converting it to PDF makes it easy to upload and share.',
    },
    {
      heading: 'Tips for a clean PDF',
      body: 'Take photos in good light and keep the page flat. Choose A4 page size for documents, or Fit to image to keep the original shape. If a form asks for a small file, compress the PDF after converting.',
    },
    {
      heading: 'Have PNG or WebP files too?',
      body: 'JPG is the format most phone cameras use, but PNG screenshots and WebP images also work here. For a mix of formats, see the Image to PDF page.',
    },
  ],
};

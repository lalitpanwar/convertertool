/** One file in a tool's list (photos, PDFs). */
export interface Item {
  id: string;
  file: File;
  /** object URL for the thumbnail (optional) */
  preview?: string;
  /** natural size / shape, filled in after the preview is made */
  w?: number;
  h?: number;
  /** clockwise rotation chosen by the user (images only) */
  rotation?: 0 | 90 | 180 | 270;
  /** number of pages (PDFs only) */
  pages?: number;
}

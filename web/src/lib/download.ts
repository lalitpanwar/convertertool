/** Create an object URL for bytes. Caller must URL.revokeObjectURL when done. */
export function bytesToUrl(bytes: Uint8Array, type = 'application/pdf'): string {
  return URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
}

/**
 * Converts a base64-encoded WAV byte string (from the API) into a browser
 * Blob object URL suitable for `<audio>` elements or downloads.
 * Caller is responsible for calling `URL.revokeObjectURL(url)` when done.
 */
export function base64ToAudioUrl(base64: string): string {
  const bytes = Uint8Array.from(atob(base64), (c) => c.codePointAt(0) ?? 0);
  const blob = new Blob([bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/**
 * Triggers a browser download of an audio Blob URL under the given filename.
 */
export function downloadWav(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

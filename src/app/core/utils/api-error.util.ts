/**
 * Extract a human-readable message from an Angular HttpClient error
 * or any other unknown value.
 *
 * Our Express routes return `{ error: string }` bodies on failure, so
 * the lookup order is:
 *   err.error.error  → inner server message
 *   err.message      → HttpErrorResponse / JS Error message
 *   fallback         → caller-supplied default
 */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err !== null && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const inner = e['error'];
    if (inner !== null && typeof inner === 'object') {
      const msg = (inner as Record<string, unknown>)['error'];
      if (typeof msg === 'string' && msg) return msg;
    }
    if (typeof e['message'] === 'string' && e['message']) return e['message'];
  }
  return fallback;
}

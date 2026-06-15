/**
 * Strips leading/trailing whitespace and removes common XSS vectors.
 * All user-supplied strings MUST pass through this before DB calls.
 */
export function sanitize(input: string): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/['"`;\\]/g, '')      // strip SQL-adjacent chars (belt-and-suspenders)
    .slice(0, 2000);               // hard max length
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 320);
}

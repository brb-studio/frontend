/** The API's own rule: only phone characters means "search the phone's digits". */
const PHONE_LIKE = /^[\d\s()+-]+$/;

/** Wait after the last key before searching, so typing a name costs a couple of requests, not one per letter. */
export const SEARCH_DELAY_MS = 400;

/**
 * What is worth sending while typing: at least 2 letters, or 3 digits for a phone.
 * Anything shorter lists everyone instead of matching half the shop.
 */
export function searchTerm(draft: string) {
  const q = draft.trim().replace(/\s+/g, " ");
  if (PHONE_LIKE.test(q)) return q.replace(/\D/g, "").length >= 3 ? q : "";
  return q.length >= 2 ? q : "";
}

/** `text` cut where it matches `q` (case-insensitive, accents count), to mark the match. */
export function splitMatch(text: string, q: string) {
  if (!q) return [{ text, hit: false }];
  const at = text.toLocaleLowerCase().indexOf(q.toLocaleLowerCase());
  if (at < 0) return [{ text, hit: false }];
  return [
    { text: text.slice(0, at), hit: false },
    { text: text.slice(at, at + q.length), hit: true },
    { text: text.slice(at + q.length), hit: false },
  ].filter((part) => part.text !== "");
}

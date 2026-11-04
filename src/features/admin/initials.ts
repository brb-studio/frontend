/** Up to two initials for an avatar: "Ana López" → "AL", "cliente de paso" → "CD", "" → "?". */
export function initials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter((word) => /\p{L}/u.test(word))
    .slice(0, 2)
    .map(
      (word) => [...word.normalize("NFC")].find((c) => /\p{L}/u.test(c)) ?? "",
    );
  const text = letters.join("").toLocaleUpperCase();
  return text || "?";
}

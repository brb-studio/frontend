type ByMethod = { cashMinor: number; cardMinor: number; transferMinor: number };

/** Everything a row collected, whatever the method. */
export const totalOf = (row: ByMethod) =>
  row.cashMinor + row.cardMinor + row.transferMinor;

/** Who received the most first; ties keep the API's order. */
export const byCollected = <P extends ByMethod>(people: P[]) =>
  people
    .map((person, i) => ({ person, i, total: totalOf(person) }))
    .sort((a, b) => b.total - a.total || a.i - b.i)
    .map(({ person, total }) => ({ ...person, totalMinor: total }));

/** A part of the day as a whole percentage (0 when the day is empty). */
export const shareOf = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

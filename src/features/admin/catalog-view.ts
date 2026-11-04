/** Lengths offered as one tap; any other is typed. */
export const DURATION_PRESETS = [15, 30, 45, 60, 90] as const;

/** "45 min", "1 h", "1 h 30 min". */
export function formatDuration(
  minutes: number,
  text: { minutes: string; hours: string; hoursMinutes: string },
) {
  if (minutes < 60) return text.minutes.replace("{m}", String(minutes));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0
    ? text.hours.replace("{h}", String(h))
    : text.hoursMinutes.replace("{h}", String(h)).replace("{m}", String(m));
}

/** How many active barbers offer the service (a service nobody does can't be booked). */
export const offeredBy = (
  serviceId: string,
  barbers: { active: boolean; serviceIds: string[] }[],
) => barbers.filter((b) => b.active && b.serviceIds.includes(serviceId)).length;

/** What a package saves against its services bought one by one (0 when it saves nothing). */
export const savingsOf = (pkg: {
  priceMinor: number;
  listPriceMinor: number | null;
}) =>
  pkg.listPriceMinor === null
    ? 0
    : Math.max(0, pkg.listPriceMinor - pkg.priceMinor);

export type StatusFilter = "active" | "inactive" | "all";

const fold = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase();

/** The list as filtered on the device: by status and by name (accents ignored, "corte" finds "Córte"). */
export function filterCatalog<
  I extends {
    active: boolean;
    name: { es?: string | undefined; en?: string | undefined };
  },
>(items: I[], status: StatusFilter, query: string) {
  const q = fold(query.trim());
  return items.filter(
    (item) =>
      (status === "all" || item.active === (status === "active")) &&
      (!q || fold(`${item.name.es ?? ""} ${item.name.en ?? ""}`).includes(q)),
  );
}

/**
 * Moving one item up or down the customers' order: the positions to save. Positions are renumbered
 * 0..n-1 in the current order first, so equal or missing positions never stall the move.
 */
export function moveTo<I extends { id: string; position: number }>(
  items: I[],
  id: string,
  direction: -1 | 1,
) {
  const ordered = [...items].sort((a, b) => a.position - b.position);
  const from = ordered.findIndex((item) => item.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ordered.length) return [];
  const moved = [...ordered];
  const [item] = moved.splice(from, 1);
  if (!item) return [];
  moved.splice(to, 0, item);
  return moved
    .map((entry, position) => ({ id: entry.id, position }))
    .filter(({ id: key, position }) => {
      const before = items.find((entry) => entry.id === key);
      return before?.position !== position;
    });
}

/** Sum of the chosen services, to show a package's length and its "bought separately" price live. */
export function packageTotals(
  picked: string[],
  services: { id: string; durationMin: number; priceMinor: number }[],
) {
  const chosen = services.filter((s) => picked.includes(s.id));
  return {
    durationMin: chosen.reduce((sum, s) => sum + s.durationMin, 0),
    listPriceMinor: chosen.reduce((sum, s) => sum + s.priceMinor, 0),
  };
}

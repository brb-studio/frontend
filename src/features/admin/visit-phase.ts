type Visit = { id: string; status: string; startAt: string; endAt: string };

/**
 * Where a visit of today stands right now: still ahead, being attended, over but not closed
 * (completed / no-show not recorded yet), or closed.
 */
export type Phase = "upcoming" | "inProgress" | "toClose" | "closed";

export function phaseOf(a: Visit, now: number): Phase {
  if (a.status !== "confirmed" && a.status !== "pending_payment")
    return "closed";
  if (Date.parse(a.startAt) > now) return "upcoming";
  if (a.status === "pending_payment") return "upcoming";
  return Date.parse(a.endAt) > now ? "inProgress" : "toClose";
}

/** Today's own cuts: open ones on top, the one being attended and the next one to start. */
export function splitMyDay<T extends Visit>(appointments: T[], now: number) {
  const open = appointments.filter((a) => phaseOf(a, now) !== "closed");
  return {
    current: open.find((a) => phaseOf(a, now) === "inProgress"),
    next: open.find(
      (a) => a.status === "confirmed" && phaseOf(a, now) === "upcoming",
    ),
    active: open,
    done: appointments.filter((a) => phaseOf(a, now) === "closed"),
  };
}

/** The next confirmed visit that hasn't started yet (one being attended isn't "next"). */
export const nextToStart = <T extends Visit>(list: T[], now: number) =>
  list
    .filter((a) => a.status === "confirmed" && Date.parse(a.startAt) > now)
    .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0];

/** The shop's clock, only when it differs from this device's (e.g. owner in another zone). */
export function shopClock(timeZone: string, locale: string, now = new Date()) {
  const format = (zone?: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      ...(zone ? { timeZone: zone } : {}),
    }).format(now);
  const shop = format(timeZone);
  return shop === format() ? null : shop;
}

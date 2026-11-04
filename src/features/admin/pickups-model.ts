type Expiring = { expiresAt: string };

/** The ones about to expire first: those are the ones to hand over (or chase) before they lapse. */
export const bySoonest = <P extends Expiring>(list: P[]) =>
  [...list].sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));

const dayOf = (at: Date) =>
  `${at.getFullYear()}-${at.getMonth()}-${at.getDate()}`;

/** Whether it lapses today, on this device's calendar. */
export const expiresToday = (expiresAt: string, now = new Date()) =>
  dayOf(new Date(expiresAt)) === dayOf(now);

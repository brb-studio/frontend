const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export type NoticeDay = "today" | "yesterday" | "earlier";

/** "{n}" and "{time}" are filled in; nothing locale-specific is needed from Intl beyond dates. */
export type AgoText = {
  justNow: string;
  minutes: string;
  hours: string;
  yesterday: string;
};

const dateIn = (at: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);

const dayBefore = (date: string) =>
  new Date(Date.parse(`${date}T00:00:00Z`) - 24 * HOUR)
    .toISOString()
    .slice(0, 10);

/** Which day a notice arrived, in the shop's time zone. */
export function noticeDay(
  at: string,
  timeZone: string,
  now = new Date(),
): NoticeDay {
  const day = dateIn(new Date(at), timeZone);
  const today = dateIn(now, timeZone);
  if (day >= today) return "today";
  return day === dayBefore(today) ? "yesterday" : "earlier";
}

/** When a notice arrived: "hace 5 min", "hace 3 h", "ayer, 14:37", then the date. */
export function noticeAgo(
  at: string,
  timeZone: string,
  locale: string,
  text: AgoText,
  now = new Date(),
) {
  const arrived = new Date(at);
  const diff = now.getTime() - arrived.getTime();
  if (diff < MINUTE) return text.justNow;
  if (diff < HOUR)
    return text.minutes.replace("{n}", String(Math.floor(diff / MINUTE)));
  const day = noticeDay(at, timeZone, now);
  if (day === "today")
    return text.hours.replace("{n}", String(Math.floor(diff / HOUR)));
  const time = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(arrived);
  if (day === "yesterday") return text.yesterday.replace("{time}", time);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(arrived);
}

/** Notices grouped by the day they arrived, keeping their order (newest first). */
export function byNoticeDay<
  N extends { createdAt: string; summary: { timeZone: string } },
>(list: N[], now = new Date()) {
  const groups: { day: NoticeDay; items: N[] }[] = [];
  for (const n of list) {
    const day = noticeDay(n.createdAt, n.summary.timeZone, now);
    const last = groups.at(-1);
    if (last?.day === day) last.items.push(n);
    else groups.push({ day, items: [n] });
  }
  return groups;
}

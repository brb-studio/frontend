type Groupable = {
  branchId: string;
  branch?: { name: string } | undefined;
  status:
    | "confirmed"
    | "pending_payment"
    | "completed"
    | "cancelled"
    | "no_show";
  startAt: string;
};

/** One branch's day, split by what the staff still has to do. */
export type AgendaGroup<A extends Groupable> = {
  branchId: string;
  branchName: string;
  /** Still to attend or to close: confirmed or waiting for the online payment. */
  open: A[];
  /** Attended and closed. */
  done: A[];
  /** Cancelled or no-show: nothing left to do. */
  closed: A[];
};

const byStart = (a: Groupable, b: Groupable) =>
  Date.parse(a.startAt) - Date.parse(b.startAt);

/** Groups a day's appointments by branch (sorted by name), each part in time order. */
export function groupAgenda<A extends Groupable>(list: A[]): AgendaGroup<A>[] {
  const groups = new Map<string, AgendaGroup<A>>();
  for (const a of [...list].sort(byStart)) {
    let group = groups.get(a.branchId);
    if (!group) {
      group = {
        branchId: a.branchId,
        branchName: a.branch?.name ?? "",
        open: [],
        done: [],
        closed: [],
      };
      groups.set(a.branchId, group);
    }
    if (a.status === "completed") group.done.push(a);
    else if (a.status === "cancelled" || a.status === "no_show")
      group.closed.push(a);
    else group.open.push(a);
  }
  return [...groups.values()].sort((a, b) =>
    a.branchName.localeCompare(b.branchName),
  );
}

/** Today's date ("YYYY-MM-DD") in a time zone, e.g. the branch's, not the browser's. */
export const todayIn = (timeZone: string | undefined, now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

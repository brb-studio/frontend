"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarClock,
  History,
  type LucideIcon,
  Mail,
  Phone,
  Search,
  UserX,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Field } from "@/shared/ui/field";
import { Pager } from "@/shared/ui/pager";
import { adminQuery } from "./api";
import { initials } from "./initials";
import { type CustomerList, customerListSchema } from "./schemas";
import { SEARCH_DELAY_MS, searchTerm, splitMatch } from "./search";
import type { AdminText } from "./ui";

type Customer = CustomerList["customers"][number];

/** The text with the part that matched the search highlighted. */
function Marked({ text, q }: { text: string; q: string }) {
  return splitMatch(text, q).map((part, i) =>
    part.hit ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one string, in order, never reordered.
      <mark key={i} className="rounded bg-accent/25 px-0.5 text-fg">
        {part.text}
      </mark>
    ) : (
      part.text
    ),
  );
}

function CustomerCard({
  customer,
  money,
  day,
  q,
  t,
}: {
  customer: Customer;
  money: (minor: number) => string;
  day: (date?: string) => string;
  /** The live search, to mark what matched. */
  q: string;
  t: AdminText["customers"];
}) {
  const missed = customer.noShows > 0;
  const stats: {
    icon: LucideIcon;
    label: string;
    value: string;
    alert?: boolean;
  }[] = [
    { icon: CalendarCheck, label: t.visits, value: String(customer.visits) },
    {
      icon: UserX,
      label: t.noShows,
      value: String(customer.noShows),
      alert: missed,
    },
    { icon: Wallet, label: t.spent, value: money(customer.spentMinor) },
    { icon: History, label: t.lastVisit, value: day(customer.lastVisit) },
  ];
  return (
    <li className="grid gap-4 rounded-3xl border border-line bg-card p-4 text-sm">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-accent text-sm font-semibold text-accent-text"
        >
          {initials(customer.name)}
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <p className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-medium">
              <Marked text={customer.name} q={q} />
            </span>
            {customer.guest && (
              <span className="rounded-full border border-line px-2 py-0.5 text-xs text-fg-muted">
                {t.guest}
              </span>
            )}
          </p>
          {(customer.phone || customer.email) && (
            <p className="flex flex-wrap gap-x-4 gap-y-1 text-fg-muted">
              {customer.phone && (
                <a
                  href={`tel:${customer.phone}`}
                  className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-fg hover:underline"
                >
                  <Phone size={14} aria-hidden="true" />
                  {customer.phone}
                </a>
              )}
              {customer.email && (
                <a
                  href={`mailto:${customer.email}`}
                  className="inline-flex min-w-0 items-center gap-1.5 break-all underline-offset-4 hover:text-fg hover:underline"
                >
                  <Mail size={14} aria-hidden="true" className="shrink-0" />
                  <Marked text={customer.email} q={q} />
                </a>
              )}
            </p>
          )}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, alert }) => (
          <div
            key={label}
            className={`grid gap-0.5 rounded-2xl border px-3 py-2 ${alert ? "border-danger/40" : "border-line bg-surface"}`}
          >
            <dt
              className={`flex items-center gap-1.5 text-xs ${alert ? "text-danger" : "text-fg-muted"}`}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </dt>
            <dd
              className={`font-medium tabular-nums ${alert ? "text-danger" : ""}`}
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {customer.nextVisit && (
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent px-3 py-1 text-accent-text">
          <CalendarClock size={14} aria-hidden="true" />
          {t.nextVisit}: {day(customer.nextVisit)}
        </p>
      )}
    </li>
  );
}

/** "Per page" choices; the API accepts exactly these. */
const SIZES = [10, 20, 50] as const;

export function Customers({
  locale,
  t,
  pagerText,
}: {
  locale: Locale;
  t: AdminText;
  pagerText: Dictionary["account"];
}) {
  const text = t.customers;
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(SIZES[0]);
  // Live search: wait for a pause in typing, and only once there is enough to match.
  useEffect(() => {
    const timer = setTimeout(() => setQ(searchTerm(draft)), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft]);
  // A new search starts from its first page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on purpose whenever the term changes.
  useEffect(() => setPage(1), [q]);
  const list = useQuery({
    ...adminQuery(
      `customers?page=${page}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ""}`,
      customerListSchema,
    ),
    placeholderData: keepPreviousData,
    // Going back to a term typed a moment ago reuses its answer instead of asking again.
    staleTime: 60_000,
  });
  const total = list.data?.total ?? list.data?.customers.length ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  // A narrower search can leave the current page past the end.
  useEffect(() => {
    if (list.data && page > pages) setPage(pages);
  }, [list.data, page, pages]);
  const dates = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const day = (date?: string) =>
    date ? dates.format(new Date(`${date}T00:00:00Z`)) : text.never;
  const currency = list.data?.currency;
  const money = (minor: number) =>
    currency ? formatMoney(minor, currency, locale) : String(minor);
  const typing = draft.trim() !== "" && searchTerm(draft) === "";
  const limited = list.error?.message.endsWith(" 429") ?? false;
  const searching = list.isFetching && list.isPlaceholderData;
  const clear = () => {
    setDraft("");
    setQ("");
  };

  return (
    <div className="grid gap-4">
      <search className="grid gap-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            // Enter searches at once, without waiting for the pause.
            setQ(searchTerm(draft));
          }}
        >
          <Field
            name="q"
            type="search"
            label={text.search}
            maxLength={80}
            autoComplete="off"
            icon={<Search size={18} />}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") clear();
            }}
            className="[&_input::-webkit-search-cancel-button]:hidden"
            action={
              draft ? (
                <button
                  type="button"
                  aria-label={text.clear}
                  title={text.clear}
                  onClick={clear}
                  className="grid size-11 place-items-center rounded-full text-fg-muted hover:text-fg"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              ) : undefined
            }
          />
        </form>
        <p aria-live="polite" className="min-h-5 text-sm text-fg-muted">
          {searching
            ? text.searching
            : typing
              ? text.minLength
              : q && list.data
                ? (total === 1 ? text.foundOne : text.found)
                    .replace("{n}", String(total))
                    .replace("{q}", q)
                : !q && list.data?.customers.length
                  ? text.newest
                  : ""}
        </p>
      </search>
      {list.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : list.isError && !list.data ? (
        <p role="alert" className="text-danger">
          {limited ? text.tooMany : text.failed}
        </p>
      ) : list.data && list.data.customers.length > 0 ? (
        <>
          {limited && (
            <p role="alert" className="text-sm text-danger">
              {text.tooMany}
            </p>
          )}
          <ul
            className={`grid gap-3 transition-opacity ${searching ? "opacity-60" : ""}`}
          >
            {list.data.customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                money={money}
                day={day}
                q={q}
                t={text}
              />
            ))}
          </ul>
          <Pager
            label={t.nav.customers}
            page={page}
            pageSize={pageSize}
            total={total}
            shown={list.data.customers.length}
            onPage={(next) => {
              setPage(next);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onPageSize={setPageSize}
            sizes={SIZES}
            t={pagerText}
          />
        </>
      ) : (
        <p className="text-fg-muted">{text.none}</p>
      )}
    </div>
  );
}

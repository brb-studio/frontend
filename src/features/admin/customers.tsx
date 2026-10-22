"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { adminQuery } from "./api";
import { type CustomerList, customerListSchema } from "./schemas";
import type { AdminText } from "./ui";

type Customer = CustomerList["customers"][number];

function CustomerCard({
  customer,
  money,
  day,
  t,
}: {
  customer: Customer;
  money: (minor: number) => string;
  day: (date?: string) => string;
  t: AdminText["customers"];
}) {
  const stats = [
    [t.visits, String(customer.visits)],
    [t.noShows, String(customer.noShows)],
    [t.spent, money(customer.spentMinor)],
    [t.lastVisit, day(customer.lastVisit)],
  ];
  return (
    <li className="grid gap-3 rounded-3xl border border-line bg-card p-4 text-sm">
      <div className="grid gap-1">
        <p className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-medium">{customer.name}</span>
          {customer.guest && <span className="text-fg-muted">{t.guest}</span>}
        </p>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-fg-muted">
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="underline-offset-4 hover:underline"
            >
              {customer.phone}
            </a>
          )}
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="break-all underline-offset-4 hover:underline"
            >
              {customer.email}
            </a>
          )}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="grid gap-0.5">
            <dt className="text-fg-muted">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {customer.nextVisit && (
        <p className="text-accent-text">
          {t.nextVisit}: {day(customer.nextVisit)}
        </p>
      )}
    </li>
  );
}

export function Customers({ locale, t }: { locale: Locale; t: AdminText }) {
  const text = t.customers;
  const [q, setQ] = useState("");
  const list = useQuery({
    ...adminQuery(
      q ? `customers?q=${encodeURIComponent(q)}` : "customers",
      customerListSchema,
    ),
    placeholderData: keepPreviousData,
  });
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

  return (
    <div className="grid gap-6">
      <search>
        <form
          className="flex items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setQ(String(form.get("q") ?? "").trim());
          }}
        >
          <Field
            name="q"
            type="search"
            label={text.search}
            maxLength={80}
            icon={<Search size={18} />}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" className="h-13">
            {text.searchButton}
          </Button>
        </form>
      </search>
      {list.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : list.data && list.data.customers.length > 0 ? (
        <>
          {!q && <p className="text-sm text-fg-muted">{text.newest}</p>}
          <ul className="grid gap-3">
            {list.data.customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                money={money}
                day={day}
                t={text}
              />
            ))}
          </ul>
        </>
      ) : (
        <p className="text-fg-muted">{text.none}</p>
      )}
    </div>
  );
}

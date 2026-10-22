"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { formatMoney } from "@/shared/i18n/money";
import { Select } from "@/shared/ui/select";
import { today } from "./agenda-manager";
import { adminQuery } from "./api";
import { branchSchema, COUNTER_METHODS, cashDaySchema } from "./schemas";
import { type AdminText, Panel } from "./ui";

const branchesQuery = adminQuery("branches", z.array(branchSchema));
const KEY = {
  cash: "cashMinor",
  card: "cardMinor",
  transfer: "transferMinor",
} as const;

export function CashDesk({
  locale,
  t,
  chooseBranch,
}: {
  locale: Locale;
  t: AdminText;
  chooseBranch: boolean;
}) {
  const text = t.cash;
  const [day, setDay] = useState(today);
  const [branchId, setBranchId] = useState("");
  const branches = useQuery({ ...branchesQuery, enabled: chooseBranch });
  const report = useQuery(
    adminQuery(
      `cash?date=${day}${branchId ? `&branchId=${branchId}` : ""}`,
      cashDaySchema,
    ),
  );
  const data = report.data;
  const money = (minor: number) =>
    data ? formatMoney(minor, data.currency, locale) : "";
  const time = (at: string, timeZone: string) =>
    new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(new Date(at));

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">{text.day}</span>
          <input
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value || today())}
            className="h-13 rounded-2xl border border-line-strong bg-surface px-4 text-fg"
          />
        </label>
        {chooseBranch && branches.data && branches.data.length > 1 && (
          <Select
            name="branchId"
            label={text.branch}
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <option value="">{text.allBranches}</option>
            {branches.data.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
      </div>
      {report.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : !data ? (
        <p role="alert" className="text-danger">
          {text.failed}
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3">
            {COUNTER_METHODS.map((method) => (
              <div
                key={method}
                className="grid gap-1 rounded-3xl border border-line bg-card p-4"
              >
                <dt className="text-sm text-fg-muted">{t.methods[method]}</dt>
                <dd className="text-xl font-medium tabular-nums">
                  {money(data.totals[KEY[method]])}
                </dd>
              </div>
            ))}
          </dl>
          {data.unrecorded > 0 && (
            <p role="status" className="text-sm text-danger">
              {text.unrecorded.replace("{n}", String(data.unrecorded))}
            </p>
          )}
          {data.movements.length === 0 ? (
            <p className="text-fg-muted">{text.none}</p>
          ) : (
            <>
              <Panel title={text.people}>
                <ul className="grid gap-2 text-sm">
                  {data.people.map((person) => (
                    <li
                      key={person.id}
                      className="flex flex-wrap justify-between gap-2"
                    >
                      <span className="font-medium">{person.name}</span>
                      <span className="text-fg-muted tabular-nums">
                        {COUNTER_METHODS.filter(
                          (method) => person[KEY[method]] > 0,
                        )
                          .map(
                            (method) =>
                              `${t.methods[method]} ${money(person[KEY[method]])}`,
                          )
                          .join(" · ")}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title={text.movements}>
                <ul className="grid gap-2 text-sm">
                  {data.movements.map((m) => (
                    <li
                      key={`${m.at}:${m.customer}:${m.amountMinor}`}
                      className="grid gap-0.5 rounded-2xl border border-line px-3 py-2"
                    >
                      <p className="flex justify-between gap-2">
                        <span>
                          {time(m.at, m.timeZone)} ·{" "}
                          {m.kind === "cut" ? text.cut : text.product} ·{" "}
                          {m.customer}
                        </span>
                        <span className="font-medium tabular-nums">
                          {money(m.amountMinor)}
                        </span>
                      </p>
                      <p className="text-fg-muted">
                        {t.methods[m.method]} · {m.receivedBy}
                      </p>
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleCheck, Plus, X } from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { Button } from "@/shared/ui/button";
import { adminQuery, useAdminAction } from "./api";
import {
  type AdminTimeOff,
  barberSchema,
  branchSchema,
  timeOffSchema,
} from "./schemas";
import { KIND_ICON, TimeOffForm } from "./time-off-form";
import { describeRange, durationOf, phaseOf } from "./time-off-model";
import { type AdminText, Panel, Result } from "./ui";

const entriesQuery = adminQuery("time-off", z.array(timeOffSchema));
const barbersQuery = adminQuery("barbers", z.array(barberSchema));
const branchesQuery = adminQuery("branches", z.array(branchSchema));

function Entry({
  entry,
  who,
  locale,
  t,
  onRemoved,
}: {
  entry: AdminTimeOff;
  who: string;
  locale: Locale;
  t: AdminText;
  onRemoved: (message: string) => void;
}) {
  const text = t.timeOff;
  const remove = useAdminAction();
  const [asking, setAsking] = useState(false);
  const Icon = KIND_ICON[entry.kind];
  const now = phaseOf(entry) === "now";
  const length = durationOf(entry.start, entry.end);
  const duration =
    length.unit === "d"
      ? length.n === 1
        ? text.oneDay
        : text.days.replace("{n}", String(length.n))
      : (length.unit === "h" ? text.hours : text.minutes).replace(
          "{n}",
          String(length.n),
        );
  const range = describeRange(entry.start, entry.end, locale, text.allDayWord);

  return (
    <li
      className={`grid gap-3 rounded-3xl border bg-card p-4 text-sm ${now ? "border-accent" : "border-line"}`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`grid size-11 shrink-0 place-items-center rounded-full border ${entry.kind === "closure" ? "border-danger/50 text-danger" : "border-accent text-accent-text"}`}
        >
          <Icon size={20} />
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <p className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-medium">{who}</span>
            <span className="flex flex-wrap gap-1.5">
              {now && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-fg">
                  {text.inProgress}
                </span>
              )}
              <span className="rounded-full border border-line px-2 py-0.5 text-xs text-fg-muted">
                {text.kinds[entry.kind]}
              </span>
            </span>
          </p>
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{range}</span>
            <span className="text-fg-muted">· {duration}</span>
          </p>
          {entry.reason && (
            <p className="text-fg-muted italic">“{entry.reason}”</p>
          )}
        </div>
      </div>
      {asking ? (
        <div
          role="alertdialog"
          aria-label={text.removeConfirm}
          className="grid gap-3 rounded-2xl border border-danger/50 p-3"
        >
          <p>{text.removeConfirm}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              autoFocus
              onClick={() => setAsking(false)}
            >
              {text.back}
            </Button>
            <Button
              variant="danger"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(
                  { method: "DELETE", path: `time-off/${entry.id}` },
                  {
                    onSuccess: (result) => {
                      setAsking(false);
                      if (result.ok)
                        onRemoved(
                          text.removed.replace("{who}", `${who} · ${range}`),
                        );
                    },
                  },
                )
              }
            >
              {text.yesRemove}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAsking(true)}
          className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full border border-line px-4 text-sm text-fg-muted transition-colors hover:border-danger hover:text-danger"
        >
          <X size={16} aria-hidden="true" />
          {t.common.remove}
        </button>
      )}
      {remove.data && !remove.data.ok && (
        <Result result={remove.data} t={t.common} />
      )}
    </li>
  );
}

export function TimeOffManager({
  locale,
  t,
  canCloseBranch,
}: {
  locale: Locale;
  t: AdminText;
  canCloseBranch: boolean;
}) {
  const text = t.timeOff;
  const entries = useQuery(entriesQuery);
  const barbers = useQuery(barbersQuery);
  const branches = useQuery(branchesQuery);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const who = (entry: AdminTimeOff) =>
    entry.barberId
      ? (barbers.data?.find((b) => b.id === entry.barberId)?.name ?? "")
      : `${text.wholeBranch} · ${branches.data?.find((b) => b.id === entry.branchId)?.name ?? ""}`;
  const list = [...(entries.data ?? [])].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  const groups = [
    {
      key: "now",
      title: text.now,
      items: list.filter((e) => phaseOf(e) === "now"),
    },
    {
      key: "upcoming",
      title: text.upcoming,
      items: list.filter((e) => phaseOf(e) !== "now"),
    },
  ].filter((g) => g.items.length > 0);
  const ready = barbers.data && branches.data;

  return (
    <div className="grid gap-4">
      {notice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-2xl border border-accent bg-card px-4 py-3 text-sm"
        >
          <p className="flex items-start gap-2">
            <CircleCheck
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent-text"
            />
            {notice}
          </p>
          <button
            type="button"
            aria-label={t.common.close}
            className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted hover:text-fg"
            onClick={() => setNotice(null)}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <Panel
        title={text.newEntry}
        action={
          <Button
            variant={adding ? "secondary" : "primary"}
            onClick={() => {
              setNotice(null);
              setAdding(!adding);
            }}
          >
            {adding ? (
              <X size={18} aria-hidden="true" />
            ) : (
              <Plus size={18} aria-hidden="true" />
            )}
            {adding ? t.common.close : text.newEntry}
          </Button>
        }
      >
        {adding && ready ? (
          <TimeOffForm
            locale={locale}
            t={t}
            barbers={barbers.data}
            branches={branches.data}
            canCloseBranch={canCloseBranch}
            onCreated={(message) => {
              setAdding(false);
              setNotice(message);
            }}
          />
        ) : adding ? (
          <p className="text-fg-muted">{t.common.loading}</p>
        ) : null}
      </Panel>
      {entries.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : groups.length === 0 ? (
        <p className="text-fg-muted">{text.none}</p>
      ) : (
        groups.map((group) => (
          <section
            key={group.key}
            className="grid gap-3"
            aria-label={group.title}
          >
            <h2 className="text-lg font-medium">
              {group.title}
              <span className="ml-2 text-sm font-normal text-fg-muted">
                ({group.items.length})
              </span>
            </h2>
            <ul className="grid gap-3">
              {group.items.map((entry) => (
                <Entry
                  key={entry.id}
                  entry={entry}
                  who={who(entry)}
                  locale={locale}
                  t={t}
                  onRemoved={setNotice}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

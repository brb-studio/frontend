"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Clock,
  Globe,
  MapPin,
  Phone,
  Plus,
  Store,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { Button } from "@/shared/ui/button";
import {
  ActiveSwitch,
  EditButton,
  EntityCard,
  Fact,
  Notice,
} from "./admin-kit";
import { cityOf, hoursSummary, todayHours } from "./admin-view";
import { adminQuery, useAdminAction } from "./api";
import { BranchForm } from "./branch-form";
import { formatDuration } from "./catalog-view";
import { type AdminBranch, barberSchema, branchSchema } from "./schemas";
import { type AdminText, Panel, Result } from "./ui";

const branchesQuery = adminQuery("branches", z.array(branchSchema));
const barbersQuery = adminQuery("barbers", z.array(barberSchema));

export function BranchesManager({
  locale,
  t,
  canCreate,
}: {
  locale: Locale;
  t: AdminText;
  canCreate: boolean;
}) {
  const text = t.branches;
  const branches = useQuery(branchesQuery);
  const barbers = useQuery(barbersQuery);
  const action = useAdminAction();
  const [editing, setEditing] = useState<AdminBranch | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const words = {
    minutes: t.services.durationMin,
    hours: t.services.durationH,
    hoursMinutes: t.services.durationHM,
  };
  const span = (minutes: number) =>
    minutes >= 1440 && minutes % 1440 === 0
      ? text.days.replace("{n}", String(minutes / 1440))
      : formatDuration(minutes, words);
  const open = (next: AdminBranch | "new") => {
    setNotice(null);
    setEditing(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid gap-5">
      <Notice
        message={notice}
        closeLabel={t.common.close}
        onClose={() => setNotice(null)}
      />
      {editing && (
        <Panel
          title={
            editing === "new"
              ? text.newBranch
              : `${t.common.edit}: ${editing.name}`
          }
          action={
            <Button variant="secondary" onClick={() => setEditing(null)}>
              <X size={18} aria-hidden="true" />
              {t.common.close}
            </Button>
          }
        >
          <BranchForm
            key={editing === "new" ? "new" : editing.id}
            {...(editing === "new" ? {} : { branch: editing })}
            locale={locale}
            t={t}
            onDone={(message) => {
              setEditing(null);
              setNotice(message);
            }}
          />
        </Panel>
      )}
      {canCreate && (
        <Button className="w-fit" onClick={() => open("new")}>
          <Plus size={18} aria-hidden="true" />
          {text.newBranch}
        </Button>
      )}
      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}

      {branches.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : !branches.data || branches.data.length === 0 ? (
        <p className="text-fg-muted">{text.empty}</p>
      ) : (
        <ul className="grid gap-3">
          {branches.data.map((b) => {
            const today = todayHours(b.hours, b.timeZone);
            const week = hoursSummary(b.hours, locale);
            const people = (barbers.data ?? []).filter(
              (x) => x.active && x.branchId === b.id,
            ).length;
            const rules = b.booking;
            return (
              <EntityCard
                key={b.id}
                photo={b.image ?? b.images[0]}
                icon={Store}
                title={b.name}
                muted={!b.active}
                aside={
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${today ? "bg-accent text-accent-fg" : "border border-line text-fg-muted"}`}
                  >
                    {today
                      ? text.today.replace("{hours}", today)
                      : text.closedToday}
                  </span>
                }
                actions={
                  <>
                    {canCreate && (
                      <ActiveSwitch
                        label={t.services.activeLabel}
                        checked={b.active}
                        disabled={action.isPending}
                        onChange={(active) =>
                          action.mutate({
                            method: "PATCH",
                            path: `branches/${b.id}`,
                            body: { active },
                          })
                        }
                      />
                    )}
                    <EditButton label={t.common.edit} onClick={() => open(b)} />
                  </>
                }
              >
                <p className="flex flex-wrap gap-x-3 gap-y-1">
                  <Fact icon={MapPin}>{b.address.join(", ")}</Fact>
                  {b.phone && <Fact icon={Phone}>{b.phone}</Fact>}
                  <Fact icon={Globe}>{cityOf(b.timeZone)}</Fact>
                  {people === 0 ? (
                    <Fact icon={TriangleAlert} tone="warn">
                      {text.noBarbers}
                    </Fact>
                  ) : (
                    <Fact icon={Users}>
                      {people === 1
                        ? text.barbersOne
                        : text.barbersCount.replace("{n}", String(people))}
                    </Fact>
                  )}
                </p>
                {week ? (
                  <Fact icon={CalendarClock}>{week}</Fact>
                ) : (
                  <Fact icon={TriangleAlert} tone="warn">
                    {text.noHoursWarn}
                  </Fact>
                )}
                <p className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    text.ruleSlot.replace("{d}", span(rules.slotIntervalMin)),
                    rules.bufferMin > 0
                      ? text.ruleBuffer.replace("{d}", span(rules.bufferMin))
                      : "",
                    rules.minNoticeMin > 0
                      ? text.ruleNotice.replace("{d}", span(rules.minNoticeMin))
                      : text.ruleNoNotice,
                    text.ruleWindow.replace("{n}", String(rules.windowDays)),
                    rules.cancelNoticeMin > 0
                      ? text.ruleCancel.replace(
                          "{d}",
                          span(rules.cancelNoticeMin),
                        )
                      : text.ruleNoCancel,
                  ]
                    .filter(Boolean)
                    .map((rule) => (
                      <span
                        key={rule}
                        className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-fg-muted"
                      >
                        <Clock size={12} aria-hidden="true" />
                        {rule}
                      </span>
                    ))}
                </p>
              </EntityCard>
            );
          })}
        </ul>
      )}
    </div>
  );
}

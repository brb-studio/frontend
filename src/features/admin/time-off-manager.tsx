"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import * as z from "zod";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import { adminQuery, useAdminAction } from "./api";
import { barberSchema, branchSchema, timeOffSchema } from "./schemas";
import { type AdminText, Panel, Result, Row, smallButton, value } from "./ui";

const entriesQuery = adminQuery("time-off", z.array(timeOffSchema));
const barbersQuery = adminQuery("barbers", z.array(barberSchema));
const branchesQuery = adminQuery("branches", z.array(branchSchema));
const KINDS = ["break", "time_off", "vacation", "block"] as const;

/** Breaks, days off and closures, entered in the branch's own local time. */
export function TimeOffManager({
  t,
  canCloseBranch,
}: {
  t: AdminText;
  canCloseBranch: boolean;
}) {
  const entries = useQuery(entriesQuery);
  const barbers = useQuery(barbersQuery);
  const branches = useQuery(branchesQuery);
  const create = useAdminAction();
  const remove = useAdminAction();
  const [adding, setAdding] = useState(false);
  const who = (entry: z.output<typeof timeOffSchema>) =>
    entry.barberId
      ? (barbers.data?.find((b) => b.id === entry.barberId)?.name ?? "")
      : `${t.timeOff.wholeBranch} · ${branches.data?.find((b) => b.id === entry.branchId)?.name ?? ""}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const [scope, id] = value(form, "who").split(":");
    const reason = value(form, "reason");
    create.mutate(
      {
        method: "POST",
        path: "time-off",
        body: {
          ...(scope === "branch"
            ? { branchId: id, kind: "closure" }
            : { barberId: id, kind: value(form, "kind") }),
          start: value(form, "start"),
          end: value(form, "end"),
          ...(reason ? { reason } : {}),
        },
      },
      { onSuccess: (result) => result.ok && setAdding(false) },
    );
  }

  return (
    <Panel
      title={t.nav.timeOff}
      action={
        <button
          type="button"
          className={smallButton}
          onClick={() => setAdding(!adding)}
        >
          {adding ? t.common.close : t.timeOff.newEntry}
        </button>
      }
    >
      {adding && (
        <form onSubmit={submit} className="grid gap-3">
          <Select name="who" label={t.timeOff.who} required>
            {barbers.data
              ?.filter((b) => b.active)
              .map((b) => (
                <option key={b.id} value={`barber:${b.id}`}>
                  {b.name}
                </option>
              ))}
            {canCloseBranch &&
              branches.data?.map((b) => (
                <option key={b.id} value={`branch:${b.id}`}>
                  {t.timeOff.wholeBranch} · {b.name}
                </option>
              ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Field
              name="start"
              type="datetime-local"
              label={t.timeOff.start}
              required
            />
            <Field
              name="end"
              type="datetime-local"
              label={t.timeOff.end}
              required
            />
          </div>
          <Select name="kind" label={t.timeOff.kind}>
            {KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t.timeOff.kinds[kind]}
              </option>
            ))}
          </Select>
          <Field name="reason" label={t.timeOff.reason} />
          <Result result={create.data} t={t.common} />
          <Button type="submit" disabled={create.isPending}>
            {t.timeOff.newEntry}
          </Button>
        </form>
      )}
      <Result result={remove.data} t={t.common} />
      {entries.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : entries.data && entries.data.length > 0 ? (
        <ul className="grid gap-2">
          {entries.data.map((entry) => (
            <Row
              key={entry.id}
              title={who(entry)}
              meta={`${t.timeOff.kinds[entry.kind]} · ${entry.start.replace("T", " ")} → ${entry.end.replace("T", " ")}${entry.reason ? ` · ${entry.reason}` : ""}`}
            >
              <button
                type="button"
                className={smallButton}
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate({
                    method: "DELETE",
                    path: `time-off/${entry.id}`,
                  })
                }
              >
                {t.common.remove}
              </button>
            </Row>
          ))}
        </ul>
      ) : (
        <p className="text-fg-muted">{t.common.empty}</p>
      )}
    </Panel>
  );
}

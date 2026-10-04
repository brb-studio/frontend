"use client";

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import * as z from "zod";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Select } from "@/shared/ui/select";
import { adminQuery, useAdminAction } from "./api";
import { branchSchema, staffSchema } from "./schemas";
import { type AdminText, Panel, Result, Row, smallButton, value } from "./ui";

const teamQuery = adminQuery("users", z.array(staffSchema));
const branchesQuery = adminQuery("branches", z.array(branchSchema));
const created = z.object({ temporaryPassword: z.string() });

/** Staff accounts. New members get a one-time password to share; only the owner hands out admin. */
export function TeamManager({
  t,
  isOwner,
  selfId,
}: {
  t: AdminText;
  isOwner: boolean;
  selfId: string;
}) {
  const team = useQuery(teamQuery);
  const branches = useQuery(branchesQuery);
  const create = useAdminAction();
  const toggle = useAdminAction();
  const [adding, setAdding] = useState(false);
  const [role, setRole] = useState<"admin" | "manager" | "barber">("barber");
  const password = create.data?.ok
    ? created.safeParse(create.data.data)
    : undefined;
  const branchName = (id?: string) =>
    branches.data?.find((b) => b.id === id)?.name;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate({
      method: "POST",
      path: "users",
      body: {
        name: value(form, "name"),
        email: value(form, "email"),
        role,
        ...(role === "admin" ? {} : { branchId: value(form, "branchId") }),
      },
    });
  }

  return (
    <Panel
      title={t.nav.team}
      action={
        <button
          type="button"
          className={smallButton}
          onClick={() => setAdding(!adding)}
        >
          {adding ? t.common.close : t.team.newMember}
        </button>
      }
    >
      {adding && (
        <form onSubmit={submit} className="grid gap-3">
          <Field name="name" label={t.team.name} required />
          <Field name="email" type="email" label={t.team.email} required />
          <Select
            name="role"
            label={t.team.role}
            value={role}
            onChange={(event) => {
              const next = event.target.value;
              setRole(next === "admin" || next === "manager" ? next : "barber");
            }}
          >
            <option value="barber">{t.team.roles.barber}</option>
            <option value="manager">{t.team.roles.manager}</option>
            {isOwner && <option value="admin">{t.team.roles.admin}</option>}
          </Select>
          {role !== "admin" && (
            <Select name="branchId" label={t.common.branch} required>
              {branches.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          <Result result={create.data} t={t.common} />
          {password?.success && (
            <p className="rounded-2xl border border-accent p-3 text-sm">
              {t.team.temporaryPassword}{" "}
              <code className="select-all font-semibold">
                {password.data.temporaryPassword}
              </code>
            </p>
          )}
          <Button type="submit" disabled={create.isPending}>
            {t.team.newMember}
          </Button>
        </form>
      )}
      <Result result={toggle.data} t={t.common} />
      {team.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : (
        <ul className="grid gap-2">
          {team.data?.map((member) => (
            <Row
              key={member.id}
              muted={!member.active}
              title={member.name}
              meta={[
                t.team.roles[member.role],
                member.email,
                branchName(member.branchId),
              ]
                .filter(Boolean)
                .join(" · ")}
            >
              {member.role !== "owner" && member.id !== selfId && (
                <button
                  type="button"
                  className={smallButton}
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate({
                      method: "PATCH",
                      path: `users/${member.id}`,
                      body: { active: !member.active },
                    })
                  }
                >
                  {member.active ? t.common.deactivate : t.common.activate}
                </button>
              )}
            </Row>
          ))}
        </ul>
      )}
    </Panel>
  );
}

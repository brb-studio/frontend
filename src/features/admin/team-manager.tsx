"use client";

import { useQuery } from "@tanstack/react-query";
import {
  KeyRound,
  Mail,
  MapPin,
  Plus,
  Power,
  Scissors,
  Search,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { ChoicePills, EditButton, EntityCard, Fact, Notice } from "./admin-kit";
import { adminQuery, useAdminAction } from "./api";
import { initials } from "./initials";
import {
  type AdminStaff,
  barberSchema,
  branchSchema,
  staffSchema,
} from "./schemas";
import {
  type Credentials,
  CredentialsCard,
  TeamMemberForm,
  teamError,
} from "./team-member-form";
import {
  canManage,
  filterTeam,
  type RoleFilter,
  roleCounts,
  type StatusFilter,
  type TeamRole,
} from "./team-view";
import { type AdminText, Panel, smallButton } from "./ui";

const teamQuery = adminQuery("users", z.array(staffSchema));
const branchesQuery = adminQuery("branches", z.array(branchSchema));
const barbersQuery = adminQuery("barbers", z.array(barberSchema));
const resetSchema = z.object({ temporaryPassword: z.string() });

type Open =
  | { kind: "new" }
  | { kind: "edit" | "reset" | "toggle"; member: AdminStaff }
  | { kind: "credentials"; credentials: Credentials }
  | null;

/**
 * The barbershop's team: who signs in, with which role and branch, whether they ever signed in and
 * whether a barber can be booked; adding people, changing them, giving a new temporary password and
 * deactivating, each risky step with a confirmation.
 */
export function TeamManager({
  t,
  isOwner,
  selfId,
}: {
  t: AdminText;
  isOwner: boolean;
  selfId: string;
}) {
  const text = t.team;
  const team = useQuery(teamQuery);
  const branches = useQuery(branchesQuery);
  const barbers = useQuery(barbersQuery);
  const action = useAdminAction();
  const [open, setOpen] = useState<Open>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [role, setRole] = useState<RoleFilter>("");
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const [q, setQ] = useState("");
  const actor = { id: selfId, role: (isOwner ? "owner" : "admin") as TeamRole };
  const branchList = branches.data ?? [];
  const branchName = (id?: string) => branchList.find((b) => b.id === id)?.name;
  const profileOf = (userId: string) =>
    barbers.data?.find((b) => b.userId === userId)?.name;
  const members = team.data ?? [];
  const counts = roleCounts(members);
  const shown = filterTeam(members, { role, branchId, status, q });
  const show = (next: Open) => {
    setNotice(null);
    action.reset();
    setOpen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const finish = (message: string, credentials?: Credentials) => {
    setNotice(message);
    setOpen(credentials ? { kind: "credentials", credentials } : null);
  };
  const withCount = (label: string, n: number) => `${label} (${n})`;

  const confirmStep = (member: AdminStaff, kind: "reset" | "toggle") => {
    const activating = kind === "toggle" && !member.active;
    const ask =
      kind === "reset"
        ? text.resetAsk
        : activating
          ? text.activateAsk
          : text.deactivateAsk;
    const yes =
      kind === "reset"
        ? text.resetYes
        : activating
          ? text.activateYes
          : text.deactivateYes;
    const run = () =>
      action.mutate(
        kind === "reset"
          ? { method: "POST", path: `users/${member.id}/password` }
          : {
              method: "PATCH",
              path: `users/${member.id}`,
              body: { active: !member.active },
            },
        {
          onSuccess: (result) => {
            if (!result.ok) return;
            if (kind === "toggle") {
              finish(
                (activating ? text.activated : text.deactivated).replace(
                  "{name}",
                  member.name,
                ),
              );
              return;
            }
            const body = resetSchema.safeParse(result.data);
            finish(
              text.resetDone.replace("{name}", member.name),
              body.success
                ? {
                    name: member.name,
                    email: member.email,
                    password: body.data.temporaryPassword,
                  }
                : undefined,
            );
          },
        },
      );
    const error = teamError(text, action.data);
    return (
      <div role="alertdialog" aria-label={ask} className="grid gap-4">
        <p className="text-sm">{ask.replaceAll("{name}", member.name)}</p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={kind === "toggle" && !activating ? "danger" : "primary"}
            disabled={action.isPending}
            onClick={run}
          >
            {kind === "reset" ? (
              <KeyRound size={18} aria-hidden="true" />
            ) : (
              <Power size={18} aria-hidden="true" />
            )}
            {yes}
          </Button>
          <Button variant="secondary" autoFocus onClick={() => setOpen(null)}>
            {text.back}
          </Button>
        </div>
      </div>
    );
  };

  const title = (o: NonNullable<Open>) => {
    switch (o.kind) {
      case "new":
        return text.newMember;
      case "edit":
        return text.editTitle.replace("{name}", o.member.name);
      case "reset":
        return text.resetTitle.replace("{name}", o.member.name);
      case "toggle":
        return (
          o.member.active ? text.deactivateTitle : text.activateTitle
        ).replace("{name}", o.member.name);
      case "credentials":
        return text.credentialsTitle.replace("{name}", o.credentials.name);
    }
  };

  return (
    <div className="grid gap-5">
      <p className="-mt-3 max-w-2xl text-sm text-fg-muted">{text.lead}</p>
      <Notice
        message={notice}
        closeLabel={t.common.close}
        onClose={() => setNotice(null)}
      />

      {open && branches.data && (
        <Panel
          title={title(open)}
          action={
            <Button variant="secondary" onClick={() => setOpen(null)}>
              <X size={18} aria-hidden="true" />
              {t.common.close}
            </Button>
          }
        >
          {open.kind === "new" || open.kind === "edit" ? (
            <TeamMemberForm
              key={open.kind === "edit" ? open.member.id : "new"}
              {...(open.kind === "edit" ? { member: open.member } : {})}
              actorRole={actor.role}
              branches={branchList}
              linkedProfile={
                open.kind === "edit" ? profileOf(open.member.id) : undefined
              }
              t={t}
              onDone={finish}
            />
          ) : open.kind === "credentials" ? (
            <CredentialsCard credentials={open.credentials} t={text} />
          ) : (
            confirmStep(open.member, open.kind)
          )}
        </Panel>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Field
          name="q"
          type="search"
          label={text.search}
          value={q}
          autoComplete="off"
          icon={<Search size={18} />}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-56 flex-1"
        />
        <Button onClick={() => show({ kind: "new" })} disabled={!branches.data}>
          <Plus size={18} aria-hidden="true" />
          {text.newMember}
        </Button>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <ChoicePills
          name="role"
          label={text.role}
          value={role}
          options={[
            ["", withCount(text.allRoles, counts[""])],
            ["admin", withCount(text.admins, counts.admin)],
            ["manager", withCount(text.managers, counts.manager)],
            ["barber", withCount(text.barbers, counts.barber)],
          ]}
          onChange={setRole}
        />
        <ChoicePills
          name="status"
          label={t.common.active}
          value={status}
          options={[
            ["active", text.showActive],
            ["inactive", text.showInactive],
            ["all", text.showAll],
          ]}
          onChange={setStatus}
        />
        {branchList.length > 1 && (
          <ChoicePills
            name="branch"
            label={t.common.branch}
            value={branchId}
            options={[
              ["", t.common.allBranches],
              ...branchList.map((b) => [b.id, b.name] as const),
            ]}
            onChange={setBranchId}
          />
        )}
      </div>

      {team.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : shown.length === 0 ? (
        <p className="text-fg-muted">
          {q.trim() ? text.nothingFound.replace("{q}", q.trim()) : text.empty}
        </p>
      ) : (
        <ul className="grid gap-3">
          {shown.map((member) => {
            const profile = profileOf(member.id);
            const manageable = canManage(actor, member);
            const self = member.id === selfId;
            return (
              <EntityCard
                key={member.id}
                icon={UserRound}
                badge={initials(member.name)}
                title={
                  <>
                    {member.name}
                    {self && (
                      <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-fg">
                        {text.you}
                      </span>
                    )}
                  </>
                }
                muted={!member.active}
                aside={
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-fg-muted">
                    {text.roles[member.role]}
                  </span>
                }
                actions={
                  manageable ? (
                    <>
                      <EditButton
                        label={t.common.edit}
                        onClick={() => show({ kind: "edit", member })}
                      />
                      <button
                        type="button"
                        className={smallButton}
                        onClick={() => show({ kind: "reset", member })}
                      >
                        <KeyRound size={14} aria-hidden="true" />
                        {text.newPassword}
                      </button>
                      <button
                        type="button"
                        className={`${smallButton} ${member.active ? "hover:border-danger hover:text-danger" : ""}`}
                        onClick={() => show({ kind: "toggle", member })}
                      >
                        <Power size={14} aria-hidden="true" />
                        {member.active
                          ? t.common.deactivate
                          : t.common.activate}
                      </button>
                    </>
                  ) : null
                }
              >
                <p className="flex flex-wrap gap-x-3 gap-y-1">
                  <Fact icon={Mail}>
                    <span className="break-all">{member.email}</span>
                  </Fact>
                  <Fact icon={MapPin}>
                    {member.branchId
                      ? (branchName(member.branchId) ?? "")
                      : text.everyBranch}
                  </Fact>
                </p>
                <p className="flex flex-wrap gap-x-3 gap-y-1">
                  {!member.active ? (
                    <Fact icon={Power} tone="warn">
                      {text.inactiveNote}
                    </Fact>
                  ) : member.mustChangePassword ? (
                    <Fact icon={KeyRound} tone="accent">
                      {text.pendingFirstLogin}
                    </Fact>
                  ) : null}
                  {profile ? (
                    <Fact icon={Scissors}>
                      {text.barberProfile.replace("{name}", profile)}
                    </Fact>
                  ) : member.role === "barber" && barbers.data ? (
                    <Fact icon={TriangleAlert} tone="warn">
                      {text.noBarberProfile}
                    </Fact>
                  ) : null}
                </p>
              </EntityCard>
            );
          })}
        </ul>
      )}
    </div>
  );
}

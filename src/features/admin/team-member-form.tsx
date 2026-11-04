"use client";

import {
  Check,
  Copy,
  KeyRound,
  Link2,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import * as z from "zod";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import type { AdminResult } from "./actions";
import { ChoicePills } from "./admin-kit";
import { useAdminAction } from "./api";
import type { AdminBranch, AdminStaff } from "./schemas";
import {
  assignableRoles,
  needsBranch,
  type StaffRole,
  type TeamRole,
} from "./team-view";
import type { AdminText } from "./ui";

export type Credentials = { name: string; email: string; password: string };

const created = z.object({
  user: z.object({ name: z.string(), email: z.string() }),
  temporaryPassword: z.string(),
});

/** The API's error in the team's words, or the generic one. */
export function teamError(t: AdminText["team"], result?: AdminResult) {
  if (!result || result.ok) return null;
  const known = t.errors as Record<string, string>;
  return known[result.code] ?? t.errors.unknown;
}

/** One-time sign-in details, with copy buttons, after adding someone or giving them a new password. */
export function CredentialsCard({
  credentials,
  t,
}: {
  credentials: Credentials;
  t: AdminText["team"];
}) {
  const [copied, setCopied] = useState<"password" | "all" | null>(null);
  const copy = async (what: "password" | "all") => {
    const text =
      what === "password"
        ? credentials.password
        : t.credentialsText
            .replace("{email}", credentials.email)
            .replace("{password}", credentials.password);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2_000);
    } catch {}
  };
  return (
    <div className="grid gap-4">
      <p className="text-sm text-fg-muted">{t.credentialsLead}</p>
      <dl className="grid gap-3 rounded-2xl border border-accent p-4 text-sm">
        <div className="grid gap-0.5">
          <dt className="text-fg-muted">{t.email}</dt>
          <dd className="font-medium break-all select-all">
            {credentials.email}
          </dd>
        </div>
        <div className="grid gap-0.5">
          <dt className="text-fg-muted">{t.passwordLabel}</dt>
          <dd className="font-mono text-lg font-semibold break-all select-all">
            {credentials.password}
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void copy("all")}>
          {copied === "all" ? (
            <Check size={18} aria-hidden="true" />
          ) : (
            <Copy size={18} aria-hidden="true" />
          )}
          {copied === "all" ? t.copied : t.copyAll}
        </Button>
        <Button variant="secondary" onClick={() => void copy("password")}>
          <KeyRound size={18} aria-hidden="true" />
          {copied === "password" ? t.copied : t.copy}
        </Button>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {copied ? t.copied : ""}
      </p>
    </div>
  );
}

/** Adding someone, or changing an existing member's name, role and branch. */
export function TeamMemberForm({
  member,
  actorRole,
  branches,
  linkedProfile,
  t,
  onDone,
}: {
  member?: AdminStaff;
  actorRole: TeamRole;
  branches: AdminBranch[];
  /** The barber profile this account is linked to: while linked, role and branch stay put. */
  linkedProfile?: string | undefined;
  t: AdminText;
  onDone: (message: string, credentials?: Credentials) => void;
}) {
  const text = t.team;
  const action = useAdminAction();
  const startRole: StaffRole =
    member?.role === "admin" || member?.role === "manager"
      ? member.role
      : "barber";
  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>(startRole);
  const [branchId, setBranchId] = useState(
    member?.branchId ?? branches[0]?.id ?? "",
  );
  const roles = assignableRoles(actorRole);
  const locked = Boolean(member && linkedProfile);
  const branchNeeded = needsBranch(role);
  const missingBranch =
    branchNeeded && !branches.some((b) => b.id === branchId);
  const changes = member
    ? {
        ...(name.trim() !== member.name && { name: name.trim() }),
        ...(role !== member.role && { role }),
        ...(branchNeeded && branchId !== member.branchId && { branchId }),
      }
    : {};
  const ready =
    name.trim() !== "" &&
    (member ? Object.keys(changes).length > 0 : email.trim() !== "") &&
    !missingBranch;
  const error = teamError(text, action.data);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    if (member) {
      action.mutate(
        { method: "PATCH", path: `users/${member.id}`, body: changes },
        {
          onSuccess: (result) => {
            if (result.ok) onDone(text.saved.replace("{name}", name.trim()));
          },
        },
      );
      return;
    }
    action.mutate(
      {
        method: "POST",
        path: "users",
        body: {
          name: name.trim(),
          email: email.trim(),
          role,
          ...(branchNeeded ? { branchId } : {}),
        },
      },
      {
        onSuccess: (result) => {
          if (!result.ok) return;
          const body = created.safeParse(result.data);
          onDone(
            text.created.replace("{name}", name.trim()),
            body.success
              ? {
                  name: body.data.user.name,
                  email: body.data.user.email,
                  password: body.data.temporaryPassword,
                }
              : undefined,
          );
        },
      },
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          name="name"
          label={text.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          maxLength={120}
          required
        />
        {member ? (
          <div className="grid content-start gap-1 text-sm">
            <span className="text-fg-muted">{text.email}</span>
            <span className="break-all">{member.email}</span>
            <span className="text-xs text-fg-muted">{text.emailFixed}</span>
          </div>
        ) : (
          <Field
            name="email"
            type="email"
            label={text.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            required
          />
        )}
      </div>

      {locked && (
        <p className="flex items-start gap-2 rounded-2xl border border-line px-4 py-3 text-sm text-fg-muted">
          <Link2 size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
          {text.linkedLock.replace("{name}", linkedProfile ?? "")}
        </p>
      )}

      <fieldset className="grid gap-2" disabled={locked}>
        <legend className="mb-2 text-sm font-medium">{text.role}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {roles.map((r) => (
            <label
              key={r}
              className="grid cursor-pointer gap-1 rounded-2xl border border-line p-3 text-sm transition-colors hover:border-accent has-checked:border-accent has-checked:bg-surface has-disabled:cursor-not-allowed has-disabled:opacity-60 has-focus-visible:outline-2 has-focus-visible:outline-accent"
            >
              <input
                type="radio"
                name="role"
                className="sr-only"
                checked={role === r}
                onChange={() => setRole(r)}
              />
              <span className="font-medium">{text.roles[r]}</span>
              <span className="text-fg-muted">{text.roleHelp[r]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {branchNeeded &&
        (branches.length === 0 ? (
          <p
            className="flex items-start gap-2 text-sm text-danger"
            role="alert"
          >
            <TriangleAlert
              size={16}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            {text.noBranches}
          </p>
        ) : (
          <fieldset className="grid gap-2" disabled={locked}>
            <legend className="mb-2 text-sm font-medium">
              {t.common.branch}
            </legend>
            <ChoicePills
              name="branchId"
              label={t.common.branch}
              value={branchId}
              options={branches.map((b) => [b.id, b.name] as const)}
              onChange={setBranchId}
            />
          </fieldset>
        ))}

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-danger/40 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={!ready || action.isPending}>
          <UserPlus size={18} aria-hidden="true" />
          {member ? text.save : text.newMember}
        </Button>
      </div>
    </form>
  );
}

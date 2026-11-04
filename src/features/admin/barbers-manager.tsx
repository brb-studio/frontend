"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  Link2,
  MapPin,
  Plus,
  Scissors,
  Search,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import {
  ActiveSwitch,
  ChoicePills,
  EditButton,
  EntityCard,
  Fact,
  Notice,
} from "./admin-kit";
import { hoursSummary, matches } from "./admin-view";
import { adminQuery, useAdminAction } from "./api";
import { BarberForm } from "./barber-form";
import { BecomeBarber } from "./become-barber";
import type { StatusFilter } from "./catalog-view";
import { initials } from "./initials";
import {
  type AdminBarber,
  barberSchema,
  branchSchema,
  serviceSchema,
  staffSchema,
} from "./schemas";
import { type AdminText, Panel, Result } from "./ui";

type Props = {
  locale: Locale;
  t: AdminText;
  canCreate: boolean;
  canLink: boolean;
  me: string;
};

const barbersQuery = adminQuery("barbers", z.array(barberSchema));
const branchesQuery = adminQuery("branches", z.array(branchSchema));
const servicesQuery = adminQuery("services", z.array(serviceSchema));
const usersQuery = adminQuery("users", z.array(staffSchema));

export function BarbersManager({ locale, t, canCreate, canLink, me }: Props) {
  const text = t.barbers;
  const barbers = useQuery(barbersQuery);
  const services = useQuery(servicesQuery);
  const branches = useQuery(branchesQuery);
  const users = useQuery({ ...usersQuery, enabled: canLink });
  const action = useAdminAction();
  const [editing, setEditing] = useState<AdminBarber | "new" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>("active");
  const [branchId, setBranchId] = useState("");
  const [query, setQuery] = useState("");
  const taken = new Set(barbers.data?.flatMap((b) => b.userId ?? []) ?? []);
  const branchList = branches.data ?? [];
  const branchName = (id: string) =>
    branchList.find((b) => b.id === id)?.name ?? "";
  const accountOf = (b: AdminBarber) => {
    if (!b.userId) return null;
    if (b.userId === me) return text.you;
    const user = users.data?.find((u) => u.id === b.userId);
    return user ? text.linkedTo.replace("{name}", user.name) : text.linked;
  };
  const serviceNames = (ids: string[]) =>
    (services.data ?? [])
      .filter((s) => ids.includes(s.id))
      .map((s) => pick(s.name, locale));
  const shown = (barbers.data ?? []).filter(
    (b) =>
      (status === "all" || b.active === (status === "active")) &&
      (branchId === "" || b.branchId === branchId) &&
      matches(`${b.name} ${b.specialty?.es ?? ""}`, query),
  );
  const ready = services.data && branches.data;
  const open = (next: AdminBarber | "new") => {
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
      {canLink && barbers.data && !taken.has(me) && (
        <BecomeBarber t={t} me={me} />
      )}

      {editing && ready && (
        <Panel
          title={
            editing === "new"
              ? text.newBarber
              : `${t.common.edit}: ${editing.name}`
          }
          action={
            <Button variant="secondary" onClick={() => setEditing(null)}>
              <X size={18} aria-hidden="true" />
              {t.common.close}
            </Button>
          }
        >
          <BarberForm
            key={editing === "new" ? "new" : editing.id}
            {...(editing === "new" ? {} : { barber: editing })}
            branches={branches.data}
            services={services.data}
            accounts={canLink ? users.data : undefined}
            taken={taken}
            me={me}
            locale={locale}
            t={t}
            onDone={(message) => {
              setEditing(null);
              setNotice(message);
            }}
          />
        </Panel>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Field
          name="q"
          type="search"
          label={text.search}
          value={query}
          autoComplete="off"
          icon={<Search size={18} />}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-56 flex-1"
        />
        {canCreate && (
          <Button onClick={() => open("new")} disabled={!ready}>
            <Plus size={18} aria-hidden="true" />
            {text.newBarber}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <ChoicePills
          name="status"
          label={t.common.active}
          value={status}
          options={[
            ["active", t.services.filterActive],
            ["inactive", t.services.filterInactive],
            ["all", t.services.filterAll],
          ]}
          onChange={setStatus}
        />
        {branchList.length > 1 && (
          <ChoicePills
            name="branch"
            label={t.common.branch}
            value={branchId}
            options={[
              ["", text.allBranches],
              ...branchList.map((b) => [b.id, b.name] as const),
            ]}
            onChange={setBranchId}
          />
        )}
      </div>
      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}

      {barbers.isPending ? (
        <p className="text-fg-muted">{t.common.loading}</p>
      ) : shown.length === 0 ? (
        <p className="text-fg-muted">
          {query.trim()
            ? t.services.nothingFound.replace("{q}", query.trim())
            : text.empty}
        </p>
      ) : (
        <ul className="grid gap-3">
          {shown.map((b) => {
            const account = accountOf(b);
            const names = serviceNames(b.serviceIds);
            const week = hoursSummary(b.hours, locale);
            return (
              <EntityCard
                key={b.id}
                photo={b.image ?? b.images[0]}
                icon={UserRound}
                badge={initials(b.name)}
                title={b.name}
                muted={!b.active}
                actions={
                  <>
                    <ActiveSwitch
                      label={t.services.activeLabel}
                      checked={b.active}
                      disabled={action.isPending}
                      onChange={(active) =>
                        action.mutate({
                          method: "PATCH",
                          path: `barbers/${b.id}`,
                          body: { active },
                        })
                      }
                    />
                    <EditButton label={t.common.edit} onClick={() => open(b)} />
                  </>
                }
              >
                {b.specialty && (
                  <p className="text-fg-muted">{pick(b.specialty, locale)}</p>
                )}
                <p className="flex flex-wrap gap-x-3 gap-y-1">
                  <Fact icon={MapPin}>{branchName(b.branchId)}</Fact>
                  {names.length === 0 ? (
                    <Fact icon={TriangleAlert} tone="warn">
                      {text.noServicesWarn}
                    </Fact>
                  ) : (
                    <Fact icon={Scissors}>
                      <span title={names.join(", ")}>
                        {names.length === 1
                          ? text.servicesOne
                          : text.servicesCount.replace(
                              "{n}",
                              String(names.length),
                            )}
                      </span>
                    </Fact>
                  )}
                  {account ? (
                    <Fact icon={Link2}>{account}</Fact>
                  ) : (
                    <Fact icon={TriangleAlert} tone="warn">
                      {text.noAccountWarn}
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
              </EntityCard>
            );
          })}
        </ul>
      )}
    </div>
  );
}

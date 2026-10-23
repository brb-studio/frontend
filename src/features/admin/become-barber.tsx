"use client";

import { useQuery } from "@tanstack/react-query";
import { Scissors } from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";
import { adminQuery, useAdminAction } from "./api";
import { barberSchema, branchSchema } from "./schemas";
import { type AdminText, Result, smallButton } from "./ui";

const branchesQuery = adminQuery("branches", z.array(branchSchema));
const barbersQuery = adminQuery("barbers", z.array(barberSchema));

export function BecomeBarber({ t, me }: { t: AdminText; me: string }) {
  const text = t.myDay;
  const branches = useQuery(branchesQuery);
  const barbers = useQuery(barbersQuery);
  const action = useAdminAction();
  const open = branches.data?.filter((b) => b.active) ?? [];
  const [picked, setPicked] = useState("");
  const branchId = picked || open[0]?.id || "";
  const unlinked = barbers.data?.filter((b) => b.active && !b.userId) ?? [];

  return (
    <section className="grid gap-4 rounded-[1.75rem] border border-line bg-card p-5">
      <div className="grid gap-1">
        <p className="font-medium">{text.becomeTitle}</p>
        <p className="text-sm text-fg-muted">{text.becomeLead}</p>
      </div>
      {open.length > 1 && (
        <Select
          name="branchId"
          label={text.whichBranch}
          value={branchId}
          onChange={(event) => setPicked(event.target.value)}
        >
          {open.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      )}
      <div>
        <Button
          type="button"
          disabled={action.isPending || open.length === 0}
          onClick={() =>
            action.mutate({
              method: "POST",
              path: "barbers/me",
              body: open.length > 1 ? { branchId } : {},
            })
          }
        >
          <Scissors size={18} aria-hidden="true" />
          {text.becomeButton}
        </Button>
      </div>
      {unlinked.length > 0 && (
        <div className="grid gap-2">
          <p className="text-sm text-fg-muted">{text.existing}</p>
          <div className="flex flex-wrap gap-2">
            {unlinked.map((b) => (
              <button
                key={b.id}
                type="button"
                className={smallButton}
                disabled={action.isPending}
                onClick={() =>
                  action.mutate({
                    method: "PATCH",
                    path: `barbers/${b.id}`,
                    body: { userId: me },
                  })
                }
              >
                {text.itsMe.replace("{name}", b.name)}
              </button>
            ))}
          </div>
        </div>
      )}
      <Result result={action.data} t={t.common} />
    </section>
  );
}

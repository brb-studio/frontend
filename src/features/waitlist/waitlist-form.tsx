"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { ButtonLink } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { joinWaitlist } from "./actions";
import { type DayPart, myWaitlistKey } from "./model";

const select =
  "h-13 w-full rounded-2xl border border-line-strong bg-surface px-4 text-fg focus:border-accent";

export function WaitlistForm({
  item,
  branches,
  initialBranch,
  signedIn,
  lang,
  today,
  t,
}: {
  item: { kind: "service" | "package"; slug: string };
  branches: { slug: string; name: string }[];
  initialBranch: string;
  signedIn: boolean;
  lang: Locale;
  today: string;
  t: Dictionary["waitlist"];
}) {
  const queryClient = useQueryClient();
  const [branch, setBranch] = useState(initialBranch);
  const join = useMutation({
    mutationFn: joinWaitlist,
    onSuccess: (result) => {
      if (result.ok) {
        void queryClient.invalidateQueries({ queryKey: myWaitlistKey });
      }
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    join.mutate({
      branch,
      ...item,
      date: String(form.get("date") ?? ""),
      part: String(form.get("part") ?? "any") as DayPart,
    });
  }

  return (
    <section
      aria-labelledby="waitlist-title"
      className="grid gap-4 rounded-[2rem] border border-line bg-card p-6 shadow-soft"
    >
      <h2
        id="waitlist-title"
        className="flex items-center gap-2 font-medium text-xl"
      >
        <BellRing size={20} aria-hidden="true" className="text-accent" />
        {t.title}
      </h2>
      <p className="text-fg-muted">{t.lead}</p>
      {!signedIn ? (
        <ButtonLink href={`/${lang}/login`} variant="secondary">
          {t.signIn}
        </ButtonLink>
      ) : join.data?.ok ? (
        <p role="status" className="rounded-2xl border border-accent p-4">
          {t.done}
        </p>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          {join.data && !join.data.ok && (
            <FormAlert>{t.errors[join.data.error]}</FormAlert>
          )}
          {branches.length > 1 && (
            <label className="grid gap-2 text-sm font-medium">
              {t.branch}
              <select
                className={select}
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Field name="date" type="date" label={t.date} min={today} required />
          <label className="grid gap-2 text-sm font-medium">
            {t.part}
            <select name="part" className={select} defaultValue="any">
              <option value="any">{t.parts.any}</option>
              <option value="morning">{t.parts.morning}</option>
              <option value="afternoon">{t.parts.afternoon}</option>
            </select>
          </label>
          <SubmitButton
            pending={join.isPending}
            icon={<BellRing size={18} aria-hidden="true" />}
          >
            {t.submit}
          </SubmitButton>
        </form>
      )}
    </section>
  );
}

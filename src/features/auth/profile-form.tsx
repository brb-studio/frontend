"use client";

import { Phone, Save, User, UserPen } from "lucide-react";
import type { Dictionary } from "@/shared/i18n/en";
import { Field } from "@/shared/ui/field";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { updateProfile } from "./actions";
import { useAuthForm } from "./use-auth-form";

export function ProfileForm({
  t,
  text,
  name,
  phone,
}: {
  t: Dictionary["auth"];
  text: Dictionary["account"]["profile"];
  name: string;
  phone?: string;
}) {
  const { state, formAction, pending, formRef, error } = useAuthForm(
    updateProfile,
    t,
  );

  return (
    <details className="group rounded-[2rem] border border-line bg-card p-6">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 font-medium [&::-webkit-details-marker]:hidden">
        <UserPen size={18} aria-hidden="true" className="text-accent" />
        {text.title}
      </summary>
      <form
        ref={formRef}
        action={formAction}
        noValidate
        className="mt-5 grid gap-5"
      >
        <p className="text-sm text-fg-muted">{text.lead}</p>
        <Field
          name="name"
          label={t.name}
          autoComplete="name"
          required
          icon={<User size={18} />}
          defaultValue={state?.values?.name ?? name}
          error={error("name")}
        />
        <Field
          name="phone"
          type="tel"
          label={t.phone}
          autoComplete="tel"
          hint={t.phoneHint}
          icon={<Phone size={18} />}
          defaultValue={state?.values?.phone ?? phone}
          error={error("phone")}
        />
        {state?.formError && <FormAlert>{t.errors[state.formError]}</FormAlert>}
        {state?.done && (
          <p role="status" className="text-sm text-accent-text">
            {text.done}
          </p>
        )}
        <SubmitButton
          pending={pending}
          icon={<Save size={18} aria-hidden="true" />}
        >
          {text.submit}
        </SubmitButton>
      </form>
    </details>
  );
}

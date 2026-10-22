"use client";

import { Trash2 } from "lucide-react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { PasswordField } from "@/shared/ui/password-field";
import { deleteAccount } from "./actions";
import { useAuthForm } from "./use-auth-form";

export function DeleteAccountForm({
  t,
  text,
  locale,
}: {
  t: Dictionary["auth"];
  text: Dictionary["account"]["deleteAccount"];
  locale: Locale;
}) {
  const { state, formAction, pending, formRef, error } = useAuthForm(
    deleteAccount,
    t,
  );

  return (
    <details className="group rounded-[2rem] border border-line bg-card p-6">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 font-medium text-danger [&::-webkit-details-marker]:hidden">
        <Trash2 size={18} aria-hidden="true" />
        {text.title}
      </summary>
      <form
        ref={formRef}
        action={formAction}
        noValidate
        className="mt-5 grid gap-5"
      >
        <input type="hidden" name="lang" value={locale} />
        <p className="text-sm text-fg-muted">{text.lead}</p>
        <PasswordField
          name="password"
          label={text.password}
          autoComplete="current-password"
          required
          toggleLabel={t.togglePassword}
          error={error("password")}
        />
        {state?.formError && <FormAlert>{t.errors[state.formError]}</FormAlert>}
        <SubmitButton
          pending={pending}
          icon={<Trash2 size={18} aria-hidden="true" />}
        >
          {text.submit}
        </SubmitButton>
      </form>
    </details>
  );
}

"use client";

import { LogIn, Mail } from "lucide-react";
import Link from "next/link";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { Field } from "@/shared/ui/field";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { PasswordField } from "@/shared/ui/password-field";
import { login } from "./actions";
import { useAuthForm } from "./use-auth-form";

export function LoginForm({
  t,
  locale,
}: {
  t: Dictionary["auth"];
  locale: Locale;
}) {
  const { state, formAction, pending, formRef, error } = useAuthForm(login, t);

  return (
    <form ref={formRef} action={formAction} noValidate className="grid gap-5">
      <input type="hidden" name="lang" value={locale} />
      <Field
        name="email"
        type="email"
        label={t.email}
        autoComplete="email"
        inputMode="email"
        required
        icon={<Mail size={18} />}
        defaultValue={state?.values?.email}
        error={error("email")}
        className="animate-rise [animation-delay:240ms]"
      />
      <PasswordField
        name="password"
        label={t.password}
        autoComplete="current-password"
        required
        minLength={8}
        toggleLabel={t.togglePassword}
        error={error("password")}
        className="animate-rise [animation-delay:300ms]"
      />
      <Link
        href={`/${locale}/forgot-password`}
        className="-mt-2 animate-rise self-start text-sm font-medium text-accent-text underline-offset-4 [animation-delay:330ms] hover:underline"
      >
        {t.recovery.forgotLink}
      </Link>
      {state?.formError && <FormAlert>{t.errors[state.formError]}</FormAlert>}
      <SubmitButton
        pending={pending}
        icon={<LogIn size={18} aria-hidden="true" />}
        className="animate-rise [animation-delay:360ms]"
      >
        {t.login}
      </SubmitButton>
    </form>
  );
}

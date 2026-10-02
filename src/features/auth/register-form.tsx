"use client";

import { Mail, Phone, User, UserPlus } from "lucide-react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { Field } from "@/shared/ui/field";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { PasswordField } from "@/shared/ui/password-field";
import { register } from "./actions";
import { useAuthForm } from "./use-auth-form";

export function RegisterForm({
  t,
  locale,
}: {
  t: Dictionary["auth"];
  locale: Locale;
}) {
  const { state, formAction, pending, formRef, error } = useAuthForm(
    register,
    t,
  );

  return (
    <form ref={formRef} action={formAction} noValidate className="grid gap-5">
      <input type="hidden" name="lang" value={locale} />
      <Field
        name="name"
        label={t.name}
        autoComplete="name"
        required
        icon={<User size={18} />}
        defaultValue={state?.values?.name}
        error={error("name")}
        className="animate-rise [animation-delay:240ms]"
      />
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
        className="animate-rise [animation-delay:300ms]"
      />
      <Field
        name="phone"
        type="tel"
        label={t.phone}
        autoComplete="tel"
        hint={t.phoneHint}
        icon={<Phone size={18} />}
        defaultValue={state?.values?.phone}
        error={error("phone")}
        className="animate-rise [animation-delay:360ms]"
      />
      <PasswordField
        name="password"
        label={t.password}
        autoComplete="new-password"
        required
        minLength={8}
        hint={t.passwordHint}
        toggleLabel={t.togglePassword}
        error={error("password")}
        className="animate-rise [animation-delay:420ms]"
      />
      {state?.formError && <FormAlert>{t.errors[state.formError]}</FormAlert>}
      <SubmitButton
        pending={pending}
        icon={<UserPlus size={18} aria-hidden="true" />}
        className="animate-rise [animation-delay:480ms]"
      >
        {t.register}
      </SubmitButton>
    </form>
  );
}

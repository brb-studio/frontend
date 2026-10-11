"use client";

import { LogIn, Mail } from "lucide-react";
import { useActionState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { Field } from "@/shared/ui/field";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { PasswordField } from "@/shared/ui/password-field";
import { platformLogin } from "./actions";

export function PlatformLoginForm({
  t,
  togglePassword,
  locale,
}: {
  t: Dictionary["platform"]["login"];
  togglePassword: string;
  locale: Locale;
}) {
  const [state, action, pending] = useActionState(platformLogin, undefined);
  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="lang" value={locale} />
      <Field
        name="email"
        type="email"
        label={t.email}
        autoComplete="email"
        inputMode="email"
        required
        icon={<Mail size={18} />}
      />
      <PasswordField
        name="password"
        label={t.password}
        autoComplete="current-password"
        required
        minLength={8}
        toggleLabel={togglePassword}
      />
      {state?.error && <FormAlert>{t.errors[state.error]}</FormAlert>}
      <SubmitButton
        pending={pending}
        icon={<LogIn size={18} aria-hidden="true" />}
      >
        {t.submit}
      </SubmitButton>
    </form>
  );
}

"use client";

import { CheckCircle2, KeyRound, Mail, MailCheck, Send } from "lucide-react";
import Link from "next/link";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { ButtonLink } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { PasswordField } from "@/shared/ui/password-field";
import { forgotPassword, resetPassword, verifyEmail } from "./actions";
import { useAuthForm } from "./use-auth-form";

type Props = { t: Dictionary["auth"]; locale: Locale };

const linkClass =
  "font-medium text-accent-text underline-offset-4 hover:underline";

export function ForgotForm({ t, locale }: Props) {
  const { state, formAction, pending, formRef, error } = useAuthForm(
    forgotPassword,
    t,
  );
  const r = t.recovery;
  if (state?.done) {
    return (
      <div className="grid gap-5">
        <p role="status" className="text-accent-text">
          {r.forgotSent}
        </p>
        <Link href={`/${locale}/login`} className={linkClass}>
          {r.backToLogin}
        </Link>
      </div>
    );
  }
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
      />
      {state?.formError && <FormAlert>{t.errors[state.formError]}</FormAlert>}
      <SubmitButton
        pending={pending}
        icon={<Send size={18} aria-hidden="true" />}
      >
        {r.forgotSubmit}
      </SubmitButton>
      <Link href={`/${locale}/login`} className={`text-center ${linkClass}`}>
        {r.backToLogin}
      </Link>
    </form>
  );
}

export function ResetForm({ t, locale, token }: Props & { token: string }) {
  const { state, formAction, pending, formRef, error } = useAuthForm(
    resetPassword,
    t,
  );
  const r = t.recovery;
  if (state?.done) {
    return (
      <div className="grid gap-5">
        <p role="status" className="text-accent-text">
          {r.resetDone}
        </p>
        <ButtonLink href={`/${locale}/login`}>{t.login}</ButtonLink>
      </div>
    );
  }
  return (
    <form ref={formRef} action={formAction} noValidate className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      <PasswordField
        name="password"
        label={t.password}
        autoComplete="new-password"
        required
        minLength={8}
        toggleLabel={t.togglePassword}
        error={error("password")}
      />
      {state?.formError && (
        <FormAlert>
          {t.errors[state.formError]}{" "}
          {state.formError === "invalidToken" && (
            <Link href={`/${locale}/forgot-password`} className={linkClass}>
              {r.askAgain}
            </Link>
          )}
        </FormAlert>
      )}
      <SubmitButton
        pending={pending}
        icon={<KeyRound size={18} aria-hidden="true" />}
      >
        {r.resetSubmit}
      </SubmitButton>
    </form>
  );
}

/** A button, not an automatic GET: mail scanners open links and would burn a single-use token. */
export function VerifyForm({ t, locale, token }: Props & { token: string }) {
  const { state, formAction, pending, formRef } = useAuthForm(verifyEmail, t);
  const r = t.recovery;
  if (state?.done) {
    return (
      <div className="grid gap-5">
        <p role="status" className="flex items-center gap-2 text-accent-text">
          <CheckCircle2 size={18} aria-hidden="true" />
          {r.verifyDone}
        </p>
        <ButtonLink href={`/${locale}/home`}>{r.verifyContinue}</ButtonLink>
      </div>
    );
  }
  return (
    <form ref={formRef} action={formAction} noValidate className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      {state?.formError && <FormAlert>{t.errors[state.formError]}</FormAlert>}
      <SubmitButton
        pending={pending}
        icon={<MailCheck size={18} aria-hidden="true" />}
      >
        {r.verifySubmit}
      </SubmitButton>
    </form>
  );
}

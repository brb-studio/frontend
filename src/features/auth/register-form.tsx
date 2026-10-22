"use client";

import {
  Mail,
  MailCheck,
  Phone,
  ShieldCheck,
  ShieldQuestion,
  User,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Sheet, SheetActions } from "@/features/payments/sheet";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { PasswordField } from "@/shared/ui/password-field";
import { register } from "./actions";
import { useAuthForm } from "./use-auth-form";

export function RegisterForm({
  t,
  locale,
  notice,
  readPrivacy,
}: {
  t: Dictionary["auth"];
  locale: Locale;
  notice: string;
  readPrivacy: string;
}) {
  const { state, formAction, pending, formRef, error } = useAuthForm(
    register,
    t,
  );
  const [accepted, setAccepted] = useState(false);
  const [open, setOpen] = useState(true);
  const termsError = error("acceptTerms");

  if (state?.done) {
    return (
      <div className="grid gap-5">
        <p role="status" className="flex gap-3 text-accent-text">
          <MailCheck size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
          {t.recovery.registerSent}
        </p>
        <Link
          href={`/${locale}/login`}
          className="font-medium text-accent-text underline-offset-4 hover:underline"
        >
          {t.recovery.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => {
        if (accepted) return;
        event.preventDefault();
        setOpen(true);
      }}
      noValidate
      className="grid gap-5"
    >
      <input type="hidden" name="lang" value={locale} />
      {accepted && <input type="hidden" name="acceptTerms" value="true" />}
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex animate-rise items-start gap-2 text-left text-sm text-fg-muted underline-offset-4 [animation-delay:450ms] hover:text-fg hover:underline"
      >
        {accepted ? (
          <ShieldCheck
            size={18}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-accent-text"
          />
        ) : (
          <ShieldQuestion
            size={18}
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          />
        )}
        {accepted ? t.consent.accepted : t.consent.review}
      </button>
      {termsError && !accepted && <FormAlert>{termsError}</FormAlert>}
      {state?.formError && <FormAlert>{t.errors[state.formError]}</FormAlert>}
      <SubmitButton
        pending={pending}
        icon={<UserPlus size={18} aria-hidden="true" />}
        className="animate-rise [animation-delay:480ms]"
      >
        {t.register}
      </SubmitButton>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t.consent.title}
        icon={<ShieldCheck size={18} aria-hidden="true" />}
        closeLabel={t.consent.close}
      >
        <div className="grid gap-5 text-sm text-fg-muted">
          <p>{t.consent.lead}</p>
          <section className="grid gap-2">
            <h2 className="text-base font-medium text-fg">
              {t.consent.privacy}
            </h2>
            <p>{notice}</p>
            <Link
              href={`/${locale}/privacy`}
              className="font-medium text-accent-text underline-offset-4 hover:underline"
            >
              {readPrivacy}
            </Link>
          </section>
          <section className="grid gap-2">
            <h2 className="text-base font-medium text-fg">{t.consent.terms}</h2>
            <ul className="grid list-outside list-disc gap-2 pl-5">
              {t.consent.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        </div>
        <SheetActions>
          <Button
            className="w-full"
            onClick={() => {
              setAccepted(true);
              setOpen(false);
            }}
          >
            <ShieldCheck size={18} aria-hidden="true" />
            {t.consent.accept}
          </Button>
        </SheetActions>
      </Sheet>
    </form>
  );
}

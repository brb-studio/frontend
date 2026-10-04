"use client";

import { KeyRound } from "lucide-react";
import { useEffect } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import { FormAlert, SubmitButton } from "@/shared/ui/form";
import { PasswordField } from "@/shared/ui/password-field";
import { changePassword } from "./actions";
import { useAuthForm } from "./use-auth-form";

/** Change password, folded away under a native disclosure until needed. */
export function PasswordForm({
  t,
  text,
}: {
  t: Dictionary["auth"];
  text: Dictionary["account"]["password"];
}) {
  const { state, formAction, pending, formRef, error } = useAuthForm(
    changePassword,
    t,
  );
  useEffect(() => {
    if (state?.done) formRef.current?.reset();
  }, [state, formRef]);

  return (
    <details className="group rounded-[2rem] border border-line bg-card p-6">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 font-medium [&::-webkit-details-marker]:hidden">
        <KeyRound size={18} aria-hidden="true" className="text-accent-text" />
        {text.title}
      </summary>
      <form
        ref={formRef}
        action={formAction}
        noValidate
        className="mt-5 grid gap-5"
      >
        <PasswordField
          name="currentPassword"
          label={text.current}
          autoComplete="current-password"
          required
          toggleLabel={t.togglePassword}
          error={error("currentPassword")}
        />
        <PasswordField
          name="newPassword"
          label={text.next}
          autoComplete="new-password"
          required
          minLength={8}
          toggleLabel={t.togglePassword}
          error={error("newPassword")}
        />
        {state?.formError && <FormAlert>{t.errors[state.formError]}</FormAlert>}
        {state?.done && (
          <p role="status" className="text-sm text-accent-text">
            {text.done}
          </p>
        )}
        <SubmitButton
          pending={pending}
          icon={<KeyRound size={18} aria-hidden="true" />}
        >
          {text.submit}
        </SubmitButton>
      </form>
    </details>
  );
}

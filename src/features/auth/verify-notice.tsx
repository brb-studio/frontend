"use client";

import { MailWarning } from "lucide-react";
import { useActionState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { resendVerification } from "./actions";

/** Shown to signed-in people whose email isn't confirmed yet; the account works meanwhile. */
export function VerifyNotice({
  t,
  locale,
}: {
  t: Dictionary["auth"];
  locale: Locale;
}) {
  const [state, formAction, pending] = useActionState(
    resendVerification,
    undefined,
  );
  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-card px-4 py-3 text-sm"
    >
      <input type="hidden" name="lang" value={locale} />
      <MailWarning size={18} aria-hidden="true" className="text-accent" />
      <span className="min-w-0 flex-1 basis-60">{t.recovery.noticeText}</span>
      {state?.done ? (
        <span role="status" className="text-accent-text">
          {t.recovery.resent}
        </span>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 font-medium text-accent-text underline-offset-4 hover:underline disabled:opacity-50"
        >
          {t.recovery.resend}
        </button>
      )}
      {state?.formError && (
        <span role="alert" className="w-full text-danger">
          {t.errors[state.formError]}
        </span>
      )}
    </form>
  );
}

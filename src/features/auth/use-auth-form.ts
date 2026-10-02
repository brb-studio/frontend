"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import type { AuthState } from "./schema";

type Action = (state: AuthState, formData: FormData) => Promise<AuthState>;

export function useAuthForm(action: Action, t: Dictionary["auth"]) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')
      ?.focus();
  }, [state]);

  const error = (field: string) => {
    const key = state?.errors?.[field]?.[0];
    return key ? t.errors[key] : undefined;
  };

  return { state, formAction, pending, formRef, error };
}

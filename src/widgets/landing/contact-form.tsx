"use client";

import { type FormEvent, useId, useState } from "react";
import type { LandingDictionary } from "@/shared/i18n/landing-en";

type Copy = LandingDictionary["contactForm"];

export function ContactForm({ t }: { t: Copy }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [name, setName] = useState("");
  const id = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setName(String(data.get("name") ?? "").trim());
    setState("sending");
    setTimeout(() => setState("sent"), 1200);
  }

  return (
    <div className="lp-form" aria-live="polite">
      {state === "sent" ? (
        <div className="lp-form__sent">
          <span className="lp-form__check" aria-hidden="true" />
          <p className="lp-form__title">
            {t.sentTitle.replace("{name}", name.split(" ")[0] ?? "")}
          </p>
          <p className="lp-body">{t.sentBody}</p>
          <button
            type="button"
            className="lp-button lp-button--ghost"
            onClick={() => setState("idle")}
          >
            {t.again}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="lp-form__fields">
          <p className="lp-mono lp-form__label">{t.label}</p>
          <p className="lp-form__title">{t.title}</p>
          <label className="lp-field">
            <span>{t.name}</span>
            <input name="name" required autoComplete="name" maxLength={80} />
          </label>
          <label className="lp-field">
            <span>{t.shop}</span>
            <input
              name="shop"
              required
              autoComplete="organization"
              maxLength={80}
            />
          </label>
          <div className="lp-form__row">
            <label className="lp-field">
              <span>{t.phone}</span>
              <input
                name="phone"
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                maxLength={20}
              />
            </label>
            <label className="lp-field">
              <span>{t.size}</span>
              <select name="size" defaultValue={t.sizes[0]}>
                {t.sizes.map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="lp-field">
            <span>{t.message}</span>
            <textarea
              name="message"
              rows={3}
              maxLength={500}
              placeholder={t.messageHint}
              aria-describedby={`${id}-demo`}
            />
          </label>
          <button
            type="submit"
            className="lp-button lp-button--primary lp-form__submit"
            disabled={state === "sending"}
          >
            {state === "sending" ? t.sending : t.submit}
          </button>
          <p id={`${id}-demo`} className="lp-form__demo">
            {t.demo}
          </p>
        </form>
      )}
    </div>
  );
}

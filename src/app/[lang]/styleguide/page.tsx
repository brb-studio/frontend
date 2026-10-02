import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";

export const metadata: Metadata = {
  title: "Styleguide · MagicStudio",
  robots: { index: false },
};

const swatches = [
  ["canvas", "bg-canvas"],
  ["surface", "bg-surface"],
  ["card", "bg-card"],
  ["fg", "bg-fg"],
  ["fg-muted", "bg-fg-muted"],
  ["line-strong", "bg-line-strong"],
  ["accent", "bg-accent"],
  ["accent-text", "bg-accent-text"],
  ["danger", "bg-danger"],
] as const;

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto grid max-w-3xl content-start gap-12 p-8 sm:p-12">
      <header className="grid gap-3">
        <p className="text-sm uppercase tracking-[0.2em] text-accent-text">
          Styleguide
        </p>
        <h1 className="font-medium text-display">MagicStudio</h1>
        <p className="max-w-prose text-fg-muted">
          Clean studio barbering. White and ink, black and glass, one orange.
        </p>
      </header>

      <div className="grid grid-cols-4 gap-3">
        {swatches.map(([name, bg]) => (
          <div key={name} className="grid gap-2">
            <div className={`h-14 rounded-xl border border-line ${bg}`} />
            <span className="text-xs text-fg-muted">{name}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-3">
        <h2 className="font-medium text-title">Sharp cuts, calm hands</h2>
        <p className="max-w-prose">
          Geist everywhere; headlines in medium weight with tight tracking.
          <span className="text-accent-text"> Accent text</span> stays readable
          in both themes.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button>Book now</Button>
        <Button variant="secondary">View services</Button>
        <Button disabled>Disabled</Button>
        <ButtonLink href="/" variant="secondary">
          Link button
        </ButtonLink>
      </div>

      <div className="glass grid gap-2 rounded-3xl p-6 shadow-glow">
        <p className="font-medium text-title">Glass + glow</p>
        <p className="text-fg-muted">
          Falls back to a solid surface without backdrop-filter or with reduced
          transparency.
        </p>
      </div>

      <form className="grid gap-6">
        <Field
          name="name"
          label="Full name"
          autoComplete="name"
          hint="As it should appear on your booking"
        />
        <Field
          name="phone"
          label="Phone"
          type="tel"
          defaultValue="123"
          error="Enter a valid phone number"
        />
        <Field name="email" label="Email" type="email" disabled />
      </form>
    </div>
  );
}

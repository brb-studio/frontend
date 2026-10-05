"use client";

import { MapPin, Navigation, Phone } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";

export type BranchView = {
  slug: string;
  name: string;
  address: string[];
  phone: string;
  mapsUrl: string;
  hours: { days: string; time: string }[];
};

type Labels = {
  label: string;
  hours: string;
  directions: string;
  call: string;
};

export function BranchPicker({
  branches,
  labels,
  className = "",
}: {
  branches: BranchView[];
  labels: Labels;
  className?: string;
}) {
  const [slug, setSlug] = useState(branches[0]?.slug ?? "");
  const branch = branches.find((b) => b.slug === slug) ?? branches[0];
  if (!branch) return null;

  return (
    <section
      aria-label={labels.label}
      className={`grid border border-line bg-card gap-5 rounded-[1.75rem] p-5 ${className}`}
    >
      <Select
        label={labels.label}
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        icon={<MapPin size={18} />}
      >
        {branches.map((b) => (
          <option key={b.slug} value={b.slug}>
            {b.name}
          </option>
        ))}
      </Select>
      <div aria-live="polite" className="grid gap-3 text-sm">
        <p>{branch.address.join(", ")}</p>
        <dl className="grid gap-1">
          {branch.hours.map((h) => (
            <div key={h.days} className="flex justify-between gap-4">
              <dt className="first-letter:uppercase text-fg-muted">{h.days}</dt>
              <dd>{h.time}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-3">
        <a
          href={branch.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("secondary")}
        >
          <Navigation size={16} aria-hidden="true" />
          {labels.directions}
        </a>
        <a href={`tel:${branch.phone}`} className={buttonClass("primary")}>
          <Phone size={16} aria-hidden="true" />
          {labels.call}
        </a>
      </div>
    </section>
  );
}

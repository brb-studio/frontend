"use client";

import { CalendarPlus } from "lucide-react";
import { useRef, useState } from "react";
import type { Dictionary } from "@/shared/i18n/en";
import { buttonClass } from "./button";

export type CalendarEvent = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  details?: string;
};

const stamp = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

const escapeText = (text: string) =>
  text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");

const fold = (line: string) => {
  const chars = Array.from(line);
  const parts = [];
  for (let i = 0; i < chars.length; i += 73) {
    parts.push(chars.slice(i, i + 73).join(""));
  }
  return parts.join("\r\n ");
};

export function googleCalendarUrl(event: CalendarEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${stamp(event.startAt)}/${stamp(event.endAt)}`,
  });
  if (event.location) params.set("location", event.location);
  if (event.details) params.set("details", event.details);
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function icsFile(event: CalendarEvent, now = new Date()) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//brb-studio//booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@brb-studio`,
    `DTSTAMP:${stamp(now.toISOString())}`,
    `DTSTART:${stamp(event.startAt)}`,
    `DTEND:${stamp(event.endAt)}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.location && `LOCATION:${escapeText(event.location)}`,
    event.details && `DESCRIPTION:${escapeText(event.details)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(event.title)}`,
    "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines
    .filter((line): line is string => Boolean(line))
    .map(fold)
    .join("\r\n")}\r\n`;
}

export function AddToCalendar({
  event,
  managePath,
  t,
}: {
  event: CalendarEvent;
  managePath: string;
  t: Dictionary["calendar"];
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const [full, setFull] = useState<CalendarEvent | null>(null);
  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <details
      ref={ref}
      className="group relative"
      onToggle={(e) => {
        if (!e.currentTarget.open) return;
        const manage = `${t.manage} ${window.location.origin}${managePath}`;
        setFull({
          ...event,
          details: [event.details, manage].filter(Boolean).join("\n"),
        });
      }}
    >
      <summary
        className={buttonClass(
          "secondary",
          "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
        )}
      >
        <CalendarPlus size={16} aria-hidden="true" />
        {t.add}
      </summary>
      {full && (
        <div className="absolute right-0 z-20 mt-2 grid min-w-56 gap-1 rounded-2xl border border-line bg-card p-2 text-left text-sm shadow-soft">
          <a
            href={googleCalendarUrl(full)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="rounded-xl px-3 py-2.5 hover:bg-accent/10"
          >
            {t.google}
          </a>
          <a
            href={`data:text/calendar;charset=utf-8,${encodeURIComponent(icsFile(full))}`}
            download={`${t.fileName}.ics`}
            onClick={close}
            className="rounded-xl px-3 py-2.5 hover:bg-accent/10"
          >
            {t.ics}
          </a>
        </div>
      )}
    </details>
  );
}

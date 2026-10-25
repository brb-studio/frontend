"use client";

import { useEffect, useState } from "react";

type Reading = { time: string; iso: string };

function read(zone: string, locale: string): Reading {
  const now = new Date();
  return {
    time: new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: zone,
    }).format(now),
    iso: now.toISOString(),
  };
}

/**
 * The current time in a branch's timezone, updated every minute. The page is static, so the
 * server renders a neutral placeholder and the real time appears on hydration. Not a live region:
 * a clock that announces itself every minute is noise.
 */
export function BranchClock({
  city,
  zone,
  locale,
}: {
  city: string;
  zone: string;
  locale: string;
}) {
  const [reading, setReading] = useState<Reading | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setReading(read(zone, locale));
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    return () => clearTimeout(timer);
  }, [zone, locale]);

  return (
    <div className="lp-clock">
      <time className="lp-clock__time lp-mono" dateTime={reading?.iso}>
        {reading?.time ?? "--:--"}
      </time>
      <p className="lp-clock__city">
        {city}
        <span className="lp-mono lp-clock__zone">{zone}</span>
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Earnings } from "@/features/platform/earnings";
import { today } from "@/features/platform/model";
import type { PlatformText } from "@/features/platform/ui";
import type { Locale } from "@/shared/i18n/locales";

export function EarningsManager({
  locale,
  t,
}: {
  locale: Locale;
  t: PlatformText;
}) {
  const [date, setDate] = useState(today);
  const [page, setPage] = useState(1);
  return (
    <Earnings
      scope="admin"
      filters={{ from: date, to: date }}
      date={date}
      page={page}
      locale={locale}
      t={t}
      onDate={(next) => {
        setDate(next);
        setPage(1);
      }}
      onPage={setPage}
    />
  );
}

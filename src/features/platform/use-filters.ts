"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { daysAgo, type Filters, STATUSES, today } from "./model";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-f\d]{24}$/;

export type View = "overview" | "cuts" | "earnings";
const VIEWS: View[] = ["overview", "cuts", "earnings"];

/** Dashboard state lives in the URL (shareable, back button works). Changing a filter returns to page 1. */
export function useDashboardState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state = useMemo(() => {
    const day = (key: string, fallback: string) => {
      const value = params.get(key);
      return value && DAY.test(value) ? value : fallback;
    };
    const id = (key: string) => {
      const value = params.get(key);
      return value && ID.test(value) ? value : undefined;
    };
    const status = params.get("status");
    const view = params.get("view");
    const from = day("from", daysAgo(29));
    const to = day("to", today());
    const filters: Filters = {
      from: from <= to ? from : to,
      to,
      tenant: id("tenant"),
      branch: id("branch"),
      barber: id("barber"),
      status: STATUSES.find((s) => s === status),
    };
    return {
      filters,
      view: VIEWS.find((v) => v === view) ?? "overview",
      date: day("date", today()),
      cut: id("cut"),
      page: Math.max(1, Number(params.get("page")) || 1),
    };
  }, [params]);

  const set = useCallback(
    (patch: Record<string, string | undefined>, keepPage = false) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (!keepPage && !("page" in patch)) next.delete("page");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [params, pathname, router],
  );

  return { ...state, set };
}

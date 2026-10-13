import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Dictionary } from "@/shared/i18n/en";
import { Select } from "./select";

export const PAGE_SIZES = [5, 10, 20] as const;

const pageButton =
  "grid size-10 place-items-center rounded-full border text-sm font-medium tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-40";

export function Pager({
  label,
  page,
  pageSize,
  total,
  shown,
  onPage,
  onPageSize,
  t,
}: {
  label: string;
  page: number;
  pageSize: number;
  total: number;
  /** Items on the current page. */
  shown: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  t: Dictionary["account"];
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="grid gap-3 sm:grid-cols-[12rem_1fr] sm:items-end">
      <Select
        label={t.perPage}
        value={pageSize}
        onChange={(e) => {
          onPageSize(Number(e.target.value));
          onPage(1);
        }}
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </Select>
      <nav
        aria-label={label}
        className="grid justify-items-center gap-2 sm:justify-items-end"
      >
        <p className="text-xs text-fg-muted">
          {t.pageRange
            .replace("{from}", String((page - 1) * pageSize + 1))
            .replace("{to}", String((page - 1) * pageSize + shown))
            .replace("{total}", String(total))}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={`${pageButton} border-line`}
            aria-label={t.previousPage}
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((n) => Math.abs(n - page) <= 2)
            .map((n) => (
              <button
                key={n}
                type="button"
                aria-label={t.goToPage.replace("{n}", String(n))}
                aria-current={n === page ? "page" : undefined}
                className={`${pageButton} ${n === page ? "border-accent bg-accent text-accent-fg" : "border-line"} ${Math.abs(n - page) > 1 ? "hidden sm:grid" : ""}`}
                onClick={() => onPage(n)}
              >
                {n}
              </button>
            ))}
          <button
            type="button"
            className={`${pageButton} border-line`}
            aria-label={t.nextPage}
            disabled={page >= pages}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </nav>
    </div>
  );
}

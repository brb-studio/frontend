"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import {
  CommissionBadge,
  formatBps,
  formatDay,
  formatWhen,
  money,
} from "./format";
import { detailSchema, platformQuery } from "./model";
import { Async, card, fill, Modal, type PlatformText, StatusBadge } from "./ui";

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

const paymentTone = {
  paid: "ok",
  pending: "warn",
  refunded: "warn",
  rejected: "bad",
  expired: "bad",
  failed: "bad",
} as const;

export function CutDetail({
  id,
  locale,
  t,
  onClose,
}: {
  id: string;
  locale: Locale;
  t: PlatformText;
  onClose: () => void;
}) {
  const query = useQuery(platformQuery(`appointments/${id}`, detailSchema));
  const d = t.detail;
  return (
    <Modal title={d.title} closeLabel={d.close} onClose={onClose}>
      <Async query={query} t={t.states}>
        {(cut) => {
          const m = (minor: number) => money(minor, cut.currency, locale);
          const c = cut.commission;
          return (
            <div className="grid gap-6">
              <section aria-labelledby="ops" className="grid gap-3">
                <h3 id="ops" className="flex items-center gap-2 font-medium">
                  {d.operations}
                  <StatusBadge
                    tone={
                      cut.status === "completed"
                        ? "ok"
                        : cut.status === "confirmed"
                          ? "warn"
                          : "muted"
                    }
                  >
                    {t.status[cut.status]}
                  </StatusBadge>
                </h3>
                <dl className={`${card} grid gap-4 p-4 sm:grid-cols-2`}>
                  <Item label={d.when}>
                    {formatWhen(cut.startAt, cut.timeZone, locale)}
                  </Item>
                  <Item label={d.source}>{d.sources[cut.source]}</Item>
                  <Item label={d.barbershop}>{cut.tenant.name}</Item>
                  <Item label={d.branch}>{cut.branch.name}</Item>
                  <Item label={d.barber}>{cut.barber.name}</Item>
                  <Item label={d.customer}>
                    {cut.customer
                      ? [
                          cut.customer.name,
                          cut.customer.phone,
                          cut.customer.email,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : d.noCustomer}
                  </Item>
                  <Item label={d.services}>
                    <ul className="grid gap-0.5">
                      {cut.items.map((item) => (
                        <li key={`${item.kind}:${pick(item.name, locale)}`}>
                          {pick(item.name, locale)} ·{" "}
                          {fill(d.minutes, { n: item.durationMin })} ·{" "}
                          {m(item.priceMinor)}
                        </li>
                      ))}
                    </ul>
                  </Item>
                  {cut.notes && <Item label={d.notes}>{cut.notes}</Item>}
                  {cut.cancelReason && (
                    <Item label={d.cancelReason}>{cut.cancelReason}</Item>
                  )}
                </dl>
              </section>
              <section aria-labelledby="fin" className="grid gap-3">
                <h3 id="fin" className="font-medium">
                  {d.finance}
                </h3>
                <dl className={`${card} grid gap-4 p-4 sm:grid-cols-2`}>
                  <Item label={d.subtotal}>{m(cut.subtotalMinor)}</Item>
                  <Item label={d.discount}>
                    {m(cut.discountMinor)}
                    {cut.promotion &&
                      ` · ${d.promotion}: ${pick(cut.promotion.name, locale)}${cut.promotion.code ? ` (${cut.promotion.code})` : ""}`}
                  </Item>
                  <Item label={d.total}>
                    <strong className="text-base tabular-nums">
                      {m(cut.totalMinor)}
                    </strong>
                  </Item>
                  <Item label={d.payment}>
                    {cut.payment ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          tone={
                            paymentTone[
                              cut.payment.status as keyof typeof paymentTone
                            ] ?? "muted"
                          }
                        >
                          {t.payment[
                            cut.payment.status as keyof PlatformText["payment"]
                          ] ?? cut.payment.status}
                        </StatusBadge>
                        {m(cut.payment.amountMinor)}
                        {cut.payment.paidAt &&
                          ` · ${d.paidAt} ${formatDay(cut.payment.paidAt, locale)}`}
                        {cut.payment.applicationFeeMinor !== null &&
                          ` · ${d.fee}: ${m(cut.payment.applicationFeeMinor)}`}
                      </span>
                    ) : (
                      t.payment.none
                    )}
                  </Item>
                </dl>
                <div className={`${card} grid gap-3 p-4`}>
                  <p className="flex items-center gap-2 font-medium">
                    {d.commission}
                    <CommissionBadge view={c} t={t.commissionState} />
                  </p>
                  {(c.state === "accrued" || c.state === "paid") && (
                    <>
                      <p className="text-2xl font-medium tabular-nums">
                        {fill(d.formula, {
                          base: m(c.baseMinor),
                          rate: formatBps(c.bps, locale),
                          amount: m(c.amountMinor),
                        })}
                      </p>
                      <p className="text-sm text-fg-muted">
                        {d.formulaLead}{" "}
                        {c.source === "snapshot"
                          ? d.sourceSnapshot
                          : d.sourceConfig}
                      </p>
                    </>
                  )}
                  {c.state === "unconfigured" && (
                    <p className="text-sm text-danger">{d.unconfigured}</p>
                  )}
                  {c.state === "not_applicable" && (
                    <p className="text-sm text-fg-muted">{d.notApplicable}</p>
                  )}
                </div>
                <div className={`${card} grid gap-1 p-4 text-sm`}>
                  <p className="font-medium">{d.payout}</p>
                  {cut.payout ? (
                    <>
                      <p>
                        {fill(d.paidOn, {
                          date: formatDay(cut.payout.paidAt, locale),
                        })}
                      </p>
                      {cut.payout.reference && (
                        <p className="text-fg-muted">
                          {d.reference}: {cut.payout.reference}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-fg-muted">{d.unpaid}</p>
                  )}
                </div>
              </section>
            </div>
          );
        }}
      </Async>
    </Modal>
  );
}

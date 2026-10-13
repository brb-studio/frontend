"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Dictionary } from "@/shared/i18n/en";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { cancelProductOrder } from "./actions";
import { myOrdersKey, myOrdersQuery } from "./model";
import { QrCode } from "./qr-code";

/** The customer's reservations: the QR to show at the counter while one is open. */
export function MyProductOrders({
  locale,
  t,
}: {
  locale: Locale;
  t: Dictionary["products"];
}) {
  const queryClient = useQueryClient();
  const orders = useQuery(myOrdersQuery());
  const cancel = useMutation({
    mutationFn: cancelProductOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myOrdersKey }),
  });
  const { orders: list = [], transfer } = orders.data ?? {};
  // Closed ones stay out of the way: only what is still to pick up, plus the latest few.
  const shown = list
    .filter((o) => o.status === "reserved")
    .concat(list.filter((o) => o.status !== "reserved").slice(0, 3));
  if (shown.length === 0) return null;

  const day = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(
      new Date(iso),
    );

  return (
    <section aria-labelledby="my-orders" className="grid gap-3">
      <h2 id="my-orders" className="font-medium text-xl">
        {t.mine}
      </h2>
      <ul className="grid gap-3">
        {shown.map((order) => (
          <li
            key={order.id}
            className="grid gap-3 rounded-3xl border border-line bg-card p-4 text-sm"
          >
            <p className="flex justify-between gap-3 font-medium">
              <span>{t.status[order.status]}</span>
              <span>
                {formatMoney(order.totalMinor, order.currency, locale)}
              </span>
            </p>
            <ul className="grid gap-0.5 text-fg-muted">
              {order.items.map((item) => (
                <li key={`${item.name.es ?? item.name.en}:${item.quantity}`}>
                  {item.quantity} × {pick(item.name, locale)}
                </li>
              ))}
            </ul>
            {order.branch && (
              <p className="text-fg-muted">
                {t.pickupAt}: {order.branch.name}
              </p>
            )}
            {order.code && (
              <div className="grid justify-items-center gap-2">
                <QrCode value={order.code} label={t.qrHint} />
                <p className="text-center text-fg-muted">{t.qrHint}</p>
                <p className="text-fg-muted">
                  {t.expires}: {day(order.expiresAt)}
                </p>
                {transfer && (
                  <p className="text-center text-fg-muted">
                    {t.transfer}: {transfer.accountKey} · {t.holder}:{" "}
                    {transfer.holder}
                  </p>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate(order.id)}
                >
                  {t.cancel}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

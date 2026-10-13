"use client";

import { useQuery } from "@tanstack/react-query";
import { Camera, CameraOff } from "lucide-react";
import { useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { adminRequest } from "./actions";
import { adminQuery, useAdminAction } from "./api";
import { QrScanner } from "./qr-scanner";
import { type Pickup, pickupSchema } from "./schemas";
import { type AdminText, Panel, Result, smallButton } from "./ui";

const pendingQuery = adminQuery("product-orders", z.array(pickupSchema));

function PickupCard({
  pickup,
  locale,
  t,
}: {
  pickup: Pickup;
  locale: Locale;
  t: AdminText;
}) {
  const action = useAdminAction();
  const text = t.pickups;
  const money = (minor: number) => formatMoney(minor, pickup.currency, locale);
  const open = pickup.status === "reserved";
  const deliver = (method: "cash" | "spei") =>
    action.mutate({
      method: "POST",
      path: `product-orders/${pickup.id}/deliver`,
      body: { method },
    });

  return (
    <li className="grid gap-3 rounded-3xl border border-line bg-card p-4 text-sm">
      <p className="flex flex-wrap justify-between gap-2 font-medium">
        <span>
          {pickup.customer?.name ?? text.customer}
          {pickup.customer?.phone && (
            <span className="font-normal text-fg-muted">
              {" "}
              · {pickup.customer.phone}
            </span>
          )}
        </span>
        <span className={open ? "text-accent-text" : "text-fg-muted"}>
          {text.status[pickup.status]}
          {pickup.payment && ` · ${text.paidWith[pickup.payment.method]}`}
        </span>
      </p>
      <ul className="grid gap-1">
        {pickup.items.map((item) => (
          <li
            key={`${item.name.es ?? item.name.en}:${item.quantity}`}
            className="flex justify-between gap-3"
          >
            <span>
              {item.quantity} × {pick(item.name, locale)}
            </span>
            <span className="text-fg-muted">
              {money(item.priceMinor * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between gap-3 font-medium">
        <span>{text.total}</span>
        <span>{money(pickup.totalMinor)}</span>
      </p>
      {open && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={action.isPending}
            onClick={() => deliver("cash")}
          >
            {text.cash}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={action.isPending}
            onClick={() => deliver("spei")}
          >
            {text.spei}
          </Button>
          <button
            type="button"
            className={smallButton}
            disabled={action.isPending}
            onClick={() =>
              action.mutate({
                method: "POST",
                path: `product-orders/${pickup.id}/cancel`,
              })
            }
          >
            {text.cancel}
          </button>
        </div>
      )}
      <Result result={action.data} t={t.common} />
    </li>
  );
}

/** The counter: scan a customer's QR (or pick them from the list), get paid, hand the product over. */
export function Pickups({ locale, t }: { locale: Locale; t: AdminText }) {
  const text = t.pickups;
  const pending = useQuery(pendingQuery);
  const [camera, setCamera] = useState(false);
  const [scanned, setScanned] = useState<Pickup | "invalid" | null>(null);

  async function scan(code: string) {
    setCamera(false);
    const result = await adminRequest({
      method: "POST",
      path: "product-orders/scan",
      body: { code },
    });
    const parsed = result.ok ? pickupSchema.safeParse(result.data) : undefined;
    setScanned(parsed?.success ? parsed.data : "invalid");
  }

  return (
    <div className="grid gap-6">
      <Panel title={text.scanTitle}>
        <p className="text-fg-muted">{text.scanLead}</p>
        {camera ? (
          <QrScanner
            onCode={scan}
            denied={text.denied}
            unsupported={text.unsupported}
          />
        ) : null}
        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setScanned(null);
              setCamera(!camera);
            }}
          >
            {camera ? (
              <CameraOff size={18} aria-hidden="true" />
            ) : (
              <Camera size={18} aria-hidden="true" />
            )}
            {camera ? text.closeCamera : text.openCamera}
          </Button>
        </div>
        {scanned === "invalid" && (
          <p role="alert" className="text-sm text-danger">
            {text.invalid}
          </p>
        )}
        {scanned && scanned !== "invalid" && (
          <ul>
            <PickupCard pickup={scanned} locale={locale} t={t} />
          </ul>
        )}
      </Panel>
      <Panel title={text.pendingTitle}>
        {pending.isPending ? (
          <p className="text-fg-muted">{t.common.loading}</p>
        ) : pending.data && pending.data.length > 0 ? (
          <ul className="grid gap-3">
            {pending.data.map((pickup) => (
              <PickupCard
                key={pickup.id}
                pickup={pickup}
                locale={locale}
                t={t}
              />
            ))}
          </ul>
        ) : (
          <p className="text-fg-muted">{text.none}</p>
        )}
      </Panel>
    </div>
  );
}

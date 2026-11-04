"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Banknote,
  CameraOff,
  CircleCheck,
  Clock,
  type LucideIcon,
  Package,
  Phone,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import { type ComponentProps, type ReactNode, useState } from "react";
import * as z from "zod";
import type { Locale } from "@/shared/i18n/locales";
import { pick } from "@/shared/i18n/localized";
import { formatMoney } from "@/shared/i18n/money";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { adminRequest } from "./actions";
import { adminQuery, useAdminAction } from "./api";
import { bySoonest, expiresToday } from "./pickups-model";
import { QrScanner } from "./qr-scanner";
import { type Pickup, pickupSchema } from "./schemas";
import { type AdminText, Panel, Result } from "./ui";

const pendingQuery = adminQuery("product-orders", z.array(pickupSchema));
type Method = "cash" | "spei";
type Pending = { kind: "deliver"; method: Method } | { kind: "cancel" };
const METHOD_ICON: Record<Method, LucideIcon> = {
  cash: Banknote,
  spei: ArrowLeftRight,
};

/** A full-width action, same size as its neighbours whatever the label. */
function Action({
  icon: Icon,
  tone = "plain",
  children,
  ...button
}: ComponentProps<"button"> & {
  icon: LucideIcon;
  tone?: "plain" | "primary" | "danger";
  children: ReactNode;
}) {
  const look =
    tone === "primary"
      ? "border-accent bg-accent text-accent-fg hover:shadow-glow"
      : tone === "danger"
        ? "border-danger/50 text-danger hover:border-danger hover:bg-danger/5"
        : "border-line bg-card hover:border-accent";
  return (
    <button
      type="button"
      className={`flex min-h-12 w-full min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-center text-sm leading-tight font-medium transition-colors disabled:opacity-50 ${look}`}
      {...button}
    >
      <Icon size={18} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </button>
  );
}

function PickupCard({
  pickup,
  locale,
  t,
  onDone,
}: {
  pickup: Pickup;
  locale: Locale;
  t: AdminText;
  /** What was saved, in words: the card leaves the list once it's handed over. */
  onDone: (message: string) => void;
}) {
  const action = useAdminAction();
  const [pending, setPending] = useState<Pending | null>(null);
  const text = t.pickups;
  const money = (minor: number) => formatMoney(minor, pickup.currency, locale);
  const open = pickup.status === "reserved";
  const name = pickup.customer?.name ?? text.customer;
  const who = [name, pickup.branch?.name].filter(Boolean).join(" · ");
  const today = expiresToday(pickup.expiresAt);
  const expires = today
    ? text.expiresToday
    : text.expiresOn.replace(
        "{date}",
        new Intl.DateTimeFormat(locale, {
          weekday: "short",
          day: "numeric",
          month: "short",
        }).format(new Date(pickup.expiresAt)),
      );
  const units = pickup.items.reduce((sum, item) => sum + item.quantity, 0);

  const confirm = (p: Pending) =>
    action.mutate(
      p.kind === "deliver"
        ? {
            method: "POST",
            path: `product-orders/${pickup.id}/deliver`,
            body: { method: p.method },
          }
        : { method: "POST", path: `product-orders/${pickup.id}/cancel` },
      {
        onSuccess: (result) => {
          setPending(null);
          if (!result.ok) return;
          onDone(
            p.kind === "deliver"
              ? text.delivered
                  .replace("{who}", who)
                  .replace("{amount}", money(pickup.totalMinor))
                  .replace("{method}", text.paidWith[p.method])
              : text.cancelledDone.replace("{who}", who),
          );
        },
      },
    );

  return (
    <li
      className={`grid gap-4 rounded-3xl border bg-card p-4 text-sm ${open && today ? "border-accent" : "border-line"}`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-accent text-accent-text"
        >
          <Package size={20} />
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <p className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-base font-medium">{name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${open ? "bg-accent text-accent-fg" : "border border-line text-fg-muted"}`}
            >
              {text.status[pickup.status]}
              {pickup.payment && ` · ${text.paidWith[pickup.payment.method]}`}
            </span>
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-fg-muted">
            {pickup.customer?.phone && (
              <a
                href={`tel:${pickup.customer.phone}`}
                className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-fg hover:underline"
              >
                <Phone size={14} aria-hidden="true" />
                {pickup.customer.phone}
              </a>
            )}
            {open && (
              <span
                className={`inline-flex items-center gap-1.5 ${today ? "font-medium text-accent-text" : ""}`}
              >
                <Clock size={14} aria-hidden="true" />
                {expires}
              </span>
            )}
            {pickup.branch && <span>{pickup.branch.name}</span>}
          </p>
        </div>
      </div>
      <div className="grid gap-2 rounded-2xl border border-line bg-surface p-3">
        <ul className="grid gap-1.5">
          {pickup.items.map((item) => (
            <li
              key={`${item.name.es ?? item.name.en}:${item.quantity}`}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="grid min-w-7 shrink-0 place-items-center rounded-lg border border-line px-1.5 py-0.5 text-xs font-medium tabular-nums">
                  {item.quantity}×
                </span>
                <span className="truncate">{pick(item.name, locale)}</span>
              </span>
              <span className="shrink-0 text-fg-muted tabular-nums">
                {money(item.priceMinor * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <p className="flex items-baseline justify-between gap-3 border-t border-line pt-2">
          <span className="text-fg-muted">
            {text.total} · {units}
          </span>
          <span className="text-lg font-semibold tabular-nums">
            {money(pickup.totalMinor)}
          </span>
        </p>
      </div>
      {open &&
        (pending ? (
          <div
            role="alertdialog"
            aria-label={
              pending.kind === "deliver"
                ? text.confirmDeliver
                : text.confirmCancel
            }
            className={`grid gap-3 rounded-2xl border p-4 ${pending.kind === "cancel" ? "border-danger/60" : "border-accent"}`}
          >
            <div className="grid gap-1">
              <p className="font-medium">
                {pending.kind === "deliver"
                  ? text.confirmDeliver
                      .replace("{amount}", money(pickup.totalMinor))
                      .replace("{method}", text.paidWith[pending.method])
                  : text.confirmCancel}
              </p>
              <p className="text-fg-muted">{who}</p>
              <p className="text-xs text-fg-muted">
                {pending.kind === "cancel"
                  ? `${text.cancelNote} ${text.cannotUndo}`
                  : text.cannotUndo}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Focus lands on "back", so a stray Enter never confirms. */}
              <Action icon={X} autoFocus onClick={() => setPending(null)}>
                {text.back}
              </Action>
              <Action
                icon={pending.kind === "deliver" ? CircleCheck : X}
                tone={pending.kind === "deliver" ? "primary" : "danger"}
                disabled={action.isPending}
                onClick={() => confirm(pending)}
              >
                {pending.kind === "deliver" ? text.yesDeliver : text.yesCancel}
              </Action>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            {(["cash", "spei"] as const).map((method) => (
              <Action
                key={method}
                icon={METHOD_ICON[method]}
                tone={method === "cash" ? "primary" : "plain"}
                onClick={() => setPending({ kind: "deliver", method })}
              >
                {text[method]}
              </Action>
            ))}
            <Action
              icon={X}
              tone="danger"
              onClick={() => setPending({ kind: "cancel" })}
            >
              {text.cancel}
            </Action>
          </div>
        ))}
      {action.data && !action.data.ok && (
        <Result result={action.data} t={t.common} />
      )}
    </li>
  );
}

/** The counter: scan a customer's QR (or type its code, or pick them from the list), get paid, hand it over. */
export function Pickups({ locale, t }: { locale: Locale; t: AdminText }) {
  const text = t.pickups;
  const pending = useQuery(pendingQuery);
  const [camera, setCamera] = useState(false);
  const [scanned, setScanned] = useState<Pickup | "invalid" | null>(null);
  const [code, setCode] = useState("");
  const [looking, setLooking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const list = bySoonest(pending.data ?? []);

  async function scan(raw: string) {
    const value = raw.trim();
    setCamera(false);
    if (!value) return;
    setLooking(true);
    const result = await adminRequest({
      method: "POST",
      path: "product-orders/scan",
      body: { code: value },
    });
    setLooking(false);
    const parsed = result.ok ? pickupSchema.safeParse(result.data) : undefined;
    setScanned(parsed?.success ? parsed.data : "invalid");
  }
  const done = (message: string) => {
    setNotice(message);
    setScanned(null);
    setCode("");
  };

  return (
    <div className="grid gap-6">
      {notice && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-2xl border border-accent bg-card px-4 py-3 text-sm"
        >
          <p className="flex items-start gap-2">
            <CircleCheck
              size={18}
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-accent-text"
            />
            {notice}
          </p>
          <button
            type="button"
            aria-label={t.common.close}
            className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted hover:text-fg"
            onClick={() => setNotice(null)}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <Panel title={text.scanTitle}>
        <p className="-mt-2 text-fg-muted">{text.scanLead}</p>
        {camera && (
          <QrScanner
            onCode={(found) => void scan(found)}
            denied={text.denied}
            unsupported={text.unsupported}
            hint={text.pointAt}
            torchOn={text.torchOn}
            torchOff={text.torchOff}
          />
        )}
        <Button
          type="button"
          variant={camera ? "secondary" : "primary"}
          className="w-full sm:w-fit"
          onClick={() => {
            setScanned(null);
            setNotice(null);
            setCamera(!camera);
          }}
        >
          {camera ? (
            <CameraOff size={18} aria-hidden="true" />
          ) : (
            <ScanLine size={18} aria-hidden="true" />
          )}
          {camera
            ? text.closeCamera
            : scanned
              ? text.scanAnother
              : text.openCamera}
        </Button>
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void scan(code);
          }}
        >
          <Field
            name="code"
            label={text.code}
            value={code}
            maxLength={100}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            onChange={(event) => setCode(event.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="secondary"
            aria-label={text.find}
            title={text.find}
            disabled={looking || code.trim() === ""}
            className="h-13! px-4!"
          >
            <Search size={18} aria-hidden="true" />
          </Button>
        </form>
        <p className="-mt-2 text-sm text-fg-muted">{text.codeHint}</p>
        {scanned === "invalid" && (
          <p role="alert" className="text-sm text-danger">
            {text.invalid}
          </p>
        )}
        {scanned && scanned !== "invalid" && (
          <ul>
            <PickupCard pickup={scanned} locale={locale} t={t} onDone={done} />
          </ul>
        )}
      </Panel>
      <Panel title={text.pendingCount.replace("{n}", String(list.length))}>
        {pending.isPending ? (
          <p className="text-fg-muted">{t.common.loading}</p>
        ) : list.length > 0 ? (
          <ul className="grid gap-3">
            {list.map((pickup) => (
              <PickupCard
                key={pickup.id}
                pickup={pickup}
                locale={locale}
                t={t}
                onDone={done}
              />
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-fg-muted">
            <Package size={18} aria-hidden="true" />
            {text.none}
          </p>
        )}
      </Panel>
    </div>
  );
}

import { queryOptions } from "@tanstack/react-query";
import * as z from "zod";

export const PAYMENT_KINDS = ["deposit", "full"] as const;
export const ONLINE_METHODS = ["card", "bank_transfer"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];
export type OnlineMethod = (typeof ONLINE_METHODS)[number];

export const TICKET_STATUSES = [
  "requires_payment",
  "paid",
  "refunded",
  "failed",
  "pending",
  "rejected",
  "expired",
  "awaiting_transfer",
  "disputed",
] as const;

/** The appointment's copy of its payment, as the API shows it to customers and staff. */
export const ticketSchema = z.object({
  provider: z.enum(["stripe", "spei"]).optional(),
  method: z.enum(["spei", "card", "bank_transfer"]).optional(),
  kind: z.enum(PAYMENT_KINDS).optional(),
  status: z.enum(TICKET_STATUSES),
  amountMinor: z.number().int(),
  paidMinor: z.number().int().optional(),
  refundedMinor: z.number().int().optional(),
  balanceMinor: z.number().int().optional(),
  /** Online payments: what the customer gets back cancelling in time (Stripe's fee isn't refundable). */
  refundableMinor: z.number().int().optional(),
  cardBrand: z.string().optional(),
  cardLast4: z.string().optional(),
  paidAt: z.string().nullable().optional(),
});
export type Ticket = z.output<typeof ticketSchema>;

/** What the payment screen needs: the state and, while unpaid, how to pay. */
export const checkoutSchema = z.object({
  appointmentId: z.string(),
  appointmentStatus: z.enum([
    "confirmed",
    "pending_payment",
    "completed",
    "cancelled",
    "no_show",
  ]),
  paymentId: z.string(),
  method: z.enum(["spei", "card", "bank_transfer"]),
  kind: z.enum(PAYMENT_KINDS),
  status: z.enum(TICKET_STATUSES),
  amountMinor: z.number().int(),
  totalMinor: z.number().int(),
  balanceMinor: z.number().int(),
  refundableMinor: z.number().int(),
  currency: z.string(),
  deadline: z.string(),
  cardBrand: z.string().optional(),
  cardLast4: z.string().optional(),
  clientSecret: z.string().optional(),
  transfer: z
    .object({
      clabe: z.string(),
      bankName: z.string().nullable(),
      reference: z.string().nullable(),
      amountRemainingMinor: z.number().int(),
      hostedUrl: z.string().nullable(),
    })
    .optional(),
});
export type Checkout = z.output<typeof checkoutSchema>;

/** What paying online would charge and refund for a quoted visit, per option, from the API. */
export const onlineQuoteSchema = z.object({
  required: z.boolean(),
  fullMinor: z.number().int(),
  depositMinor: z.number().int().optional(),
  options: z.array(
    z.object({
      kind: z.enum(PAYMENT_KINDS),
      method: z.enum(ONLINE_METHODS),
      amountMinor: z.number().int(),
      refundableMinor: z.number().int(),
    }),
  ),
});
export type OnlineQuote = z.output<typeof onlineQuoteSchema>;

/** Stripe's minimum charge in MXN (10.00); the API applies the same rule. */
export const STRIPE_MIN_MXN = 1_000;

/** Stripe's minimum per currency (MXN 10.00, USD 0.50); other currencies aren't charged online. */
const MIN_CHARGE: Record<string, number> = { MXN: STRIPE_MIN_MXN, USD: 50 };

export type OnlinePayments = {
  deposit: { enabled: boolean; percentBps: number };
  holdMinutes: { card: number; bank_transfer: number };
  /** What this shop takes: cards always; Mexican bank transfers only for shops in MXN. */
  methods: OnlineMethod[];
};

/**
 * The amounts to show before booking, with the API's rule (it computes the real charge): the deposit
 * rounded up to the whole peso or dollar, at least Stripe's minimum, never more than the total.
 */
export function onlineAmounts(
  totalMinor: number,
  online: OnlinePayments,
  currency: string,
) {
  const min = MIN_CHARGE[currency];
  if (min === undefined || totalMinor < min) return undefined;
  const { enabled, percentBps } = online.deposit;
  const raw = Math.ceil((totalMinor * percentBps) / 1_000_000) * 100;
  const deposit = Math.min(totalMinor, Math.max(min, raw));
  return {
    required: enabled,
    fullMinor: totalMinor,
    ...(enabled && deposit < totalMinor && { depositMinor: deposit }),
  };
}

/** A transfer takes longer: only offered when its hold ends before the visit starts. */
export const transferFits = (
  startAt: string,
  online: OnlinePayments,
  now = Date.now(),
) =>
  online.methods.includes("bank_transfer") &&
  now + online.holdMinutes.bank_transfer * 60_000 <= Date.parse(startAt);

const settled = (status: Checkout["status"]) =>
  status === "paid" || status === "refunded" || status === "disputed";

/** Keep asking while the money is on its way; stop once the payment or the booking is resolved. */
export const stillWaiting = (checkout: Checkout | undefined) =>
  checkout?.appointmentStatus === "pending_payment" &&
  !settled(checkout.status);

export const checkoutKey = (appointmentId: string) =>
  ["payment", appointmentId] as const;

export const checkoutPath = (appointmentId: string, secret = false) =>
  `/api/payments/${appointmentId}${secret ? "?secret=1" : ""}`;

export const checkoutQuery = (appointmentId: string) =>
  queryOptions({
    queryKey: checkoutKey(appointmentId),
    queryFn: async ({ signal }): Promise<Checkout> => {
      const response = await fetch(checkoutPath(appointmentId), { signal });
      if (!response.ok) throw new Error(`payment ${response.status}`);
      return checkoutSchema.parse(await response.json());
    },
    refetchInterval: (query) =>
      stillWaiting(query.state.data) ? 4_000 : false,
  });

export type TicketText = {
  kinds: Record<PaymentKind, string>;
  methods: Record<"card" | "bank_transfer" | "spei", string>;
  paid: string;
  paidFull: string;
  balance: string;
  awaitingTransfer: string;
  awaitingPayment: string;
  manualPending: string;
  refunded: string;
  partlyRefunded: string;
  disputed: string;
  expired: string;
};

/**
 * One line that says how the visit stands: "Deposit paid by card · 187.00 left", "Paid in full by
 * transfer", "Waiting for the transfer"… `money` formats minor units in the visit's currency.
 */
export function ticketLine(
  ticket: Ticket,
  t: TicketText,
  money: (minor: number) => string,
) {
  const method =
    ticket.method ?? (ticket.provider === "spei" ? "spei" : "card");
  const how = t.methods[method];
  const card =
    method === "card" && ticket.cardLast4
      ? ` ${ticket.cardBrand ?? ""} •••• ${ticket.cardLast4}`.trimEnd()
      : "";
  switch (ticket.status) {
    case "paid": {
      if ((ticket.refundedMinor ?? 0) > 0) {
        return t.partlyRefunded.replace(
          "{amount}",
          money(ticket.refundedMinor ?? 0),
        );
      }
      const balance = ticket.balanceMinor ?? 0;
      if (ticket.kind === "deposit" || balance > 0) {
        return `${t.kinds.deposit} ${t.paid} ${how}${card} · ${t.balance.replace("{amount}", money(balance))}`;
      }
      return `${t.paidFull} ${how}${card}`;
    }
    case "awaiting_transfer":
      return t.awaitingTransfer;
    case "pending":
      return method === "spei" ? t.manualPending : t.awaitingPayment;
    case "refunded":
      return t.refunded;
    case "disputed":
      return t.disputed;
    case "expired":
    case "failed":
    case "rejected":
      return t.expired;
    default:
      return t.awaitingPayment;
  }
}

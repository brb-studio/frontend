import { describe, expect, test } from "bun:test";
import {
  type Checkout,
  type OnlinePayments,
  onlineAmounts,
  stillWaiting,
  type TicketText,
  ticketLine,
  transferFits,
} from "./model";

const online: OnlinePayments = {
  deposit: { enabled: true, percentBps: 2_500 },
  holdMinutes: { card: 20, bank_transfer: 60 },
  methods: ["card", "bank_transfer"],
};

describe("onlineAmounts", () => {
  test("25% of 250.00 rounds up to 63.00", () => {
    expect(onlineAmounts(25_000, online, "MXN")).toEqual({
      required: true,
      fullMinor: 25_000,
      depositMinor: 6_300,
    });
  });

  test("without a deposit only the full amount, and paying is optional", () => {
    expect(
      onlineAmounts(
        25_000,
        {
          ...online,
          deposit: { enabled: false, percentBps: 2_500 },
        },
        "MXN",
      ),
    ).toEqual({ required: false, fullMinor: 25_000 });
  });

  test("raised to Stripe's minimum; nothing online under it", () => {
    expect(onlineAmounts(2_000, online, "MXN")?.depositMinor).toBe(1_000);
    expect(onlineAmounts(999, online, "MXN")).toBeUndefined();
  });

  test("dollars round up to the whole dollar with USD 0.50 as the minimum", () => {
    const usd = { ...online, methods: ["card" as const] };
    expect(onlineAmounts(2_500, usd, "USD")).toEqual({
      required: true,
      fullMinor: 2_500,
      depositMinor: 700,
    });
    expect(onlineAmounts(49, usd, "USD")).toBeUndefined();
    expect(onlineAmounts(10_000, usd, "EUR")).toBeUndefined();
  });
});

test("a transfer fits only when its hold ends before the visit, and never in dollars", () => {
  const now = Date.parse("2026-10-11T15:00:00Z");
  expect(transferFits("2026-10-11T16:00:00Z", online, now)).toBe(true);
  expect(transferFits("2026-10-11T15:59:00Z", online, now)).toBe(false);
  expect(
    transferFits("2026-10-12T16:00:00Z", { ...online, methods: ["card"] }, now),
  ).toBe(false);
});

test("polling stops once the payment or the booking is resolved", () => {
  const base = { appointmentStatus: "pending_payment", status: "pending" };
  expect(stillWaiting(base as Checkout)).toBe(true);
  expect(stillWaiting({ ...base, status: "paid" } as Checkout)).toBe(false);
  expect(
    stillWaiting({ ...base, appointmentStatus: "cancelled" } as Checkout),
  ).toBe(false);
  expect(stillWaiting(undefined)).toBe(false);
});

describe("ticketLine", () => {
  const t: TicketText = {
    kinds: { deposit: "Deposit", full: "Full" },
    methods: { card: "by card", bank_transfer: "by transfer", spei: "by SPEI" },
    paid: "paid",
    paidFull: "Paid in full",
    balance: "{amount} left",
    awaitingTransfer: "Waiting for the transfer",
    awaitingPayment: "Waiting for payment",
    manualPending: "Manual payment pending",
    refunded: "Refunded",
    partlyRefunded: "{amount} refunded",
    disputed: "Disputed",
    expired: "Not paid",
  };
  const money = (minor: number) => (minor / 100).toFixed(2);

  test("a deposit says how much is left", () => {
    expect(
      ticketLine(
        {
          method: "card",
          kind: "deposit",
          status: "paid",
          amountMinor: 6_300,
          balanceMinor: 18_700,
          cardBrand: "visa",
          cardLast4: "4242",
        },
        t,
        money,
      ),
    ).toBe("Deposit paid by card visa •••• 4242 · 187.00 left");
  });

  test("full payments, transfers waiting and manual ones", () => {
    expect(
      ticketLine(
        {
          method: "bank_transfer",
          kind: "full",
          status: "paid",
          amountMinor: 25_000,
          balanceMinor: 0,
        },
        t,
        money,
      ),
    ).toBe("Paid in full by transfer");
    expect(
      ticketLine({ status: "awaiting_transfer", amountMinor: 1 }, t, money),
    ).toBe("Waiting for the transfer");
    expect(
      ticketLine(
        { provider: "spei", status: "pending", amountMinor: 1 },
        t,
        money,
      ),
    ).toBe("Manual payment pending");
    expect(ticketLine({ status: "disputed", amountMinor: 1 }, t, money)).toBe(
      "Disputed",
    );
    expect(
      ticketLine(
        { status: "paid", amountMinor: 30_000, refundedMinor: 28_399 },
        t,
        money,
      ),
    ).toBe("283.99 refunded");
  });
});

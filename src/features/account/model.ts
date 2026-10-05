import { queryOptions } from "@tanstack/react-query";
import * as z from "zod";
import { availabilitySchema } from "@/features/booking/model";
import { localized } from "@/shared/i18n/localized";

export const appointmentSchema = z.object({
  id: z.string(),
  status: z.enum(["confirmed", "completed", "cancelled", "no_show"]),
  startAt: z.string(),
  endAt: z.string(),
  timeZone: z.string(),
  branch: z.object({ slug: z.string(), name: z.string() }).optional(),
  barber: z.object({ slug: z.string(), name: z.string() }).optional(),
  items: z.array(z.object({ name: localized, durationMin: z.number().int() })),
  currency: z.string(),
  totalMinor: z.number().int(),
  payment: z
    .object({
      status: z.enum(["requires_payment", "paid", "refunded", "failed"]),
      amountMinor: z.number().int(),
    })
    .nullable()
    .optional(),
  cancellable: z.boolean().optional(),
  customer: z
    .object({ name: z.string(), phone: z.string().optional() })
    .optional(),
});
export type Appointment = z.output<typeof appointmentSchema>;

export const myAppointmentsKey = ["me", "appointments"] as const;

export const myAppointmentsQuery = () =>
  queryOptions({
    queryKey: myAppointmentsKey,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/me/appointments", { signal });
      if (!response.ok) throw new Error(`appointments ${response.status}`);
      return z.array(appointmentSchema).parse(await response.json());
    },
    staleTime: 30_000,
  });

export const rescheduleSlotsKey = (id: string) =>
  ["me", "appointments", id, "slots"] as const;

export const rescheduleSlotsQuery = (id: string) =>
  queryOptions({
    queryKey: rescheduleSlotsKey(id),
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/me/appointments/${id}/slots`, {
        signal,
      });
      if (!response.ok) throw new Error(`slots ${response.status}`);
      return availabilitySchema.parse(await response.json());
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

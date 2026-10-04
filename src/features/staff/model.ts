import { queryOptions } from "@tanstack/react-query";
import * as z from "zod";
import { appointmentSchema } from "@/features/account/model";
import { localized } from "@/shared/i18n/localized";

export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum([
    "appointment.booked",
    "appointment.cancelled",
    "appointment.rescheduled",
  ]),
  appointmentId: z.string(),
  summary: z.object({
    start: z.string(),
    timeZone: z.string(),
    customerName: z.string(),
    items: z.array(localized),
    branchName: z.string(),
  }),
  read: z.boolean(),
  createdAt: z.string(),
});
export type StaffNotification = z.output<typeof notificationSchema>;

export const notificationsSchema = z.object({
  unread: z.number().int(),
  items: z.array(notificationSchema),
});

export const agendaKey = ["staff", "agenda"] as const;
export const notificationsKey = ["staff", "notifications"] as const;

/** The next 7 days of appointments this staff member may see. */
export const agendaQuery = () =>
  queryOptions({
    queryKey: agendaKey,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/staff/appointments", { signal });
      if (!response.ok) throw new Error(`agenda ${response.status}`);
      return z.array(appointmentSchema).parse(await response.json());
    },
    staleTime: 30_000,
  });

export const notificationsQuery = () =>
  queryOptions({
    queryKey: notificationsKey,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/staff/notifications", { signal });
      if (!response.ok) throw new Error(`notifications ${response.status}`);
      return notificationsSchema.parse(await response.json());
    },
    staleTime: 30_000,
  });

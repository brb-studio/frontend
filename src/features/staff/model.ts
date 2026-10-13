import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import * as z from "zod";
import { appointmentSchema } from "@/features/account/model";
import { localized } from "@/shared/i18n/localized";
import { PAGE_SIZES } from "@/shared/ui/pager";

export const notificationSchema = z.object({
  id: z.string(),
  type: z.enum([
    "appointment.booked",
    "appointment.cancelled",
    "appointment.rescheduled",
    "payment.disputed",
    "payment.transfer_requested",
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
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  items: z.array(notificationSchema),
});

export const agendaKey = ["staff", "agenda"] as const;
export const notificationsKey = ["staff", "notifications"] as const;

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

export const notificationsQuery = (
  page = 1,
  pageSize: number = PAGE_SIZES[0],
) =>
  queryOptions({
    queryKey: [...notificationsKey, page, pageSize],
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/staff/notifications?page=${page}&pageSize=${pageSize}`,
        { signal },
      );
      if (!response.ok) throw new Error(`notifications ${response.status}`);
      return notificationsSchema.parse(await response.json());
    },
    staleTime: 30_000,
  });

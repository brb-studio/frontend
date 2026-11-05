import * as z from "zod";
import { backend } from "@/shared/api/backend";
import { localized } from "@/shared/i18n/localized";
import { appointmentSchema, historySchema } from "./model";

export const getMyAppointments = () =>
  backend("/v1/me/appointments", z.array(appointmentSchema));

export const getMyHistory = (page: string, pageSize: string) =>
  backend(
    `/v1/me/appointments/history?page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`,
    historySchema,
  );

const loyaltySchema = z.array(
  z.object({
    id: z.string(),
    name: localized,
    type: z.enum(["percent", "fixed"]),
    value: z.number().int(),
    everyVisits: z.number().int(),
    visits: z.number().int(),
  }),
);
export type Loyalty = z.output<typeof loyaltySchema>;

export const getMyLoyalty = () => backend("/v1/me/loyalty", loyaltySchema);

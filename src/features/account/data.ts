import * as z from "zod";
import { backend } from "@/shared/api/backend";
import { appointmentSchema, historySchema } from "./model";

export const getMyAppointments = () =>
  backend("/v1/me/appointments", z.array(appointmentSchema));

export const getMyHistory = (page: string, pageSize: string) =>
  backend(
    `/v1/me/appointments/history?page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`,
    historySchema,
  );

import * as z from "zod";
import { backend } from "@/shared/api/backend";
import { appointmentSchema } from "./model";

export const getMyAppointments = () =>
  backend("/v1/me/appointments", z.array(appointmentSchema));

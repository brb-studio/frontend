import * as z from "zod";
import { appointmentSchema } from "@/features/account/model";
import { localized } from "@/shared/i18n/localized";

export const hoursSchema = z.array(
  z.object({ weekday: z.number().int(), open: z.string(), close: z.string() }),
);
export type HoursRow = z.output<typeof hoursSchema>[number];

export const bookingRulesSchema = z.object({
  slotIntervalMin: z.number().int(),
  bufferMin: z.number().int(),
  minNoticeMin: z.number().int(),
  windowDays: z.number().int(),
  cancelNoticeMin: z.number().int(),
});
export type BookingRules = z.output<typeof bookingRulesSchema>;

export const branchSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  address: z.array(z.string()),
  phone: z.string().optional(),
  mapsUrl: z.string().optional(),
  image: z.string().optional(),
  timeZone: z.string(),
  hours: hoursSchema,
  booking: bookingRulesSchema,
  active: z.boolean(),
});
export type AdminBranch = z.output<typeof branchSchema>;

export const barberSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  userId: z.string().optional(),
  slug: z.string(),
  name: z.string(),
  specialty: localized.optional(),
  image: z.string().optional(),
  hours: hoursSchema,
  serviceIds: z.array(z.string()),
  active: z.boolean(),
});
export type AdminBarber = z.output<typeof barberSchema>;

export const serviceSchema = z.object({
  id: z.string(),
  branchId: z.string().optional(),
  slug: z.string(),
  name: localized,
  description: localized.optional(),
  image: z.string().optional(),
  durationMin: z.number().int(),
  priceMinor: z.number().int(),
  position: z.number().int(),
  active: z.boolean(),
});
export type AdminService = z.output<typeof serviceSchema>;

export const packageSchema = z.object({
  id: z.string(),
  branchId: z.string().optional(),
  slug: z.string(),
  name: localized,
  description: localized.optional(),
  image: z.string().optional(),
  priceMinor: z.number().int(),
  items: z.array(z.object({ serviceId: z.string() })),
  durationMin: z.number().int().nullable(),
  listPriceMinor: z.number().int().nullable(),
  servicesActive: z.boolean(),
  position: z.number().int(),
  active: z.boolean(),
});
export type AdminPackage = z.output<typeof packageSchema>;

export const promotionSchema = z.object({
  id: z.string(),
  name: localized,
  code: z.string().optional(),
  type: z.enum(["percent", "fixed"]),
  value: z.number().int(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  firstVisitOnly: z.boolean(),
  maxRedemptions: z.number().int().optional(),
  redemptions: z.number().int(),
  active: z.boolean(),
});
export type AdminPromotion = z.output<typeof promotionSchema>;

export const staffSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["owner", "admin", "manager", "barber", "customer"]),
  branchId: z.string().optional(),
  active: z.boolean(),
});
export type AdminStaff = z.output<typeof staffSchema>;

export const timeOffSchema = z.object({
  id: z.string(),
  branchId: z.string(),
  barberId: z.string().optional(),
  kind: z.enum(["break", "time_off", "vacation", "block", "closure"]),
  reason: z.string().optional(),
  start: z.string(),
  end: z.string(),
  timeZone: z.string(),
});
export type AdminTimeOff = z.output<typeof timeOffSchema>;

export const staffAppointmentSchema = appointmentSchema.extend({
  barberId: z.string(),
  branchId: z.string(),
  source: z.enum(["online", "staff"]),
  notes: z.string().optional(),
});
export type AdminAppointment = z.output<typeof staffAppointmentSchema>;

export const tenantSchema = z.object({
  slug: z.string(),
  name: z.string(),
  currency: z.string(),
  theme: z.record(z.string(), z.unknown()),
  brand: z.object({ instagramUrl: z.string().optional() }),
  subscription: z.object({
    plan: z.string(),
    status: z.string(),
    limits: z.object({ branches: z.number(), barbers: z.number() }),
  }),
});

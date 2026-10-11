import { backend } from "@/shared/api/backend";
import {
  availabilityPath,
  availabilitySchema,
  type BookingTarget,
} from "./model";

export const getAvailability = (target: BookingTarget) =>
  backend(
    `/v1/public/availability?${availabilityPath(target)}`,
    availabilitySchema,
  );
